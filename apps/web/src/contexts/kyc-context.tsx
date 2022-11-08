import {
  ApplicantCreateRequest,
  ApplicantToken,
  ToApplicantBaseExtended,
  UserAccountStatus,
  UserStatusReport,
  WorkflowDetails,
} from '@algomart/schemas'
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query'
import { Translate } from 'next-translate'
import useTranslation from 'next-translate/useTranslation'
import type { SdkHandle } from 'onfido-sdk-ui'
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ExtractError } from 'validator-fns'

import { useAuth } from '@/contexts/auth-context'
import * as accountService from '@/services/account-service'
import { Profile } from '@/types/auth'
import { validateCreateApplicant } from '@/utils/kyc-validation'
import { useAPI } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export enum KYCStatus {
  idle = 'idle',
  info = 'info',
  loading = 'loading',
  error = 'error',
}

interface KYCProviderProps {
  applicantId: string | null
  applicant: ToApplicantBaseExtended | null
  token: string | null
  userStatus: UserStatusReport
  workflow: WorkflowDetails | null
}

export interface KYCContextProps {
  applicantId: string | null
  applicant: ToApplicantBaseExtended | null
  getError: (field: string) => string
  loadingText: string
  onCreate: (body: ApplicantCreateRequest) => Promise<void>
  handleRequestManualReview: () => void
  handleReset: () => void
  setIsModalOpen: (isModalOpen: boolean) => void
  status: KYCStatus
  token: string | null
  userStatus: UserStatusReport
}

export const KYCContext = createContext<KYCContextProps | null>(null)

export function useKYCContext() {
  const context = useContext(KYCContext)
  if (!context) {
    throw new Error('KYCProvider missing')
  }
  return context
}

type State = {
  applicant: UseQueryResult<ToApplicantBaseExtended>
  token: UseQueryResult<ApplicantToken>
  userStatus: UseQueryResult<UserStatusReport>
  createApplicant: UseMutationResult<ToApplicantBaseExtended>
  requestManualReview: UseMutationResult<boolean>
  generateNewWorkflow: UseMutationResult<WorkflowDetails>
}

function getLoadingText(t: Translate, state: State) {
  if (state.applicant.isLoading)
    return t('common:statuses.Getting Applicant Details')

  if (state.token.isLoading) return t('common:statuses.Retrieving Token')

  if (state.userStatus.isLoading)
    return t('common:statuses.Getting User Status')

  if (state.createApplicant.isLoading)
    return t('common:statuses.Creating Applicant')

  if (state.requestManualReview.isLoading)
    return t('common:statuses.Requesting Manual Review')

  if (state.generateNewWorkflow.isLoading)
    return t('common:statuses.Generating New Workflow')

  return ''
}

function getStatus(
  applicantId: string | undefined,
  user: Partial<Profile> | undefined,
  state: State
) {
  if (
    state.applicant.isLoading ||
    state.createApplicant.isLoading ||
    state.token.isLoading ||
    state.userStatus.isLoading ||
    state.requestManualReview.isLoading ||
    state.generateNewWorkflow.isLoading
  )
    return KYCStatus.loading

  if (
    state.applicant.isError ||
    state.token.isError ||
    state.userStatus.isError ||
    state.createApplicant.isError ||
    state.requestManualReview.isError ||
    state.generateNewWorkflow.isError
  )
    return KYCStatus.error

  if (applicantId && user && state.applicant.data) return KYCStatus.info

  if (!applicantId && user) return KYCStatus.idle

  return KYCStatus.loading
}

const QueryKeys = {
  applicant: 'applicant',
  status: 'applicantStatus',
  token: 'applicantToken',
}

export const KYCProvider = ({
  children,
  applicantId: initialApplicantId,
  applicant: initialApplicant,
  token: initialToken,
  workflow: initialWorkflow,
  userStatus: initialUserStatus,
}: { children: ReactNode } & KYCProviderProps) => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const sdk = useRef<SdkHandle>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [applicantId, setApplicantId] = useState<string | null>(
    initialApplicantId
  )
  const [pollUserStatus, setPollUserStatus] = useState(false)

  const applicant = useAPI<ToApplicantBaseExtended>(
    [QueryKeys.applicant, applicantId],
    urls.api.accounts.applicant,
    {
      enabled: !!(user && applicantId),
      initialData: initialApplicant,
    }
  )

  const token = useAPI<ApplicantToken>(
    [QueryKeys.token, applicantId],
    urls.api.accounts.applicantToken,
    {
      enabled: !!(user && applicantId),
      initialData: { token: initialToken },
      refetchOnWindowFocus: false,
    }
  )

  const userStatus = useAPI<UserStatusReport>(
    [QueryKeys.status, applicantId],
    urls.api.accounts.status,
    {
      initialData: initialUserStatus,
      enabled: !!user,
      refetchInterval(data) {
        return data.status === UserAccountStatus.Unverified && pollUserStatus
          ? 5000
          : false
      },
    }
  )

  const createApplicant = useMutation(accountService.createApplicant, {
    async onMutate(details) {
      const validation = await validate(details)

      if (validation.state === 'invalid') {
        setFormErrors(validation.errors)
        throw new Error('Invalid applicant data')
      }

      setFormErrors({})
    },

    async onSuccess(data) {
      setApplicantId(data.workflow?.applicantId)

      await queryClient.invalidateQueries([QueryKeys.applicant])
      await queryClient.invalidateQueries([QueryKeys.status])
    },
  })

  const requestManualReview = useMutation(accountService.requestManualReview, {
    async onSuccess() {
      await queryClient.invalidateQueries([QueryKeys.applicant])
      await queryClient.invalidateQueries([QueryKeys.status])
    },
  })

  const generateNewWorkflow = useMutation(accountService.generateNewWorkflow, {
    async onSuccess(data) {
      setApplicantId(data.applicantId)

      await queryClient.invalidateQueries([QueryKeys.applicant])
      await queryClient.invalidateQueries([QueryKeys.status])

      toggleModal(true)
    },
  })

  const workflow = applicant.data?.workflow ?? initialWorkflow

  const status = useMemo(
    () =>
      getStatus(applicantId, user, {
        applicant,
        token,
        userStatus,
        createApplicant,
        requestManualReview,
        generateNewWorkflow,
      }),
    [
      applicant,
      applicantId,
      createApplicant,
      generateNewWorkflow,
      requestManualReview,
      token,
      user,
      userStatus,
    ]
  )

  const loadingText = useMemo(
    () =>
      getLoadingText(t, {
        applicant,
        token,
        userStatus,
        createApplicant,
        requestManualReview,
        generateNewWorkflow,
      }),
    [
      applicant,
      createApplicant,
      generateNewWorkflow,
      requestManualReview,
      t,
      token,
      userStatus,
    ]
  )
  const validate = useMemo(() => validateCreateApplicant(t), [t])
  const [formErrors, setFormErrors] = useState<ExtractError<typeof validate>>(
    {}
  )

  const getError = useCallback(
    (field: string) =>
      formErrors && field in formErrors ? (formErrors[field] as string) : '',
    [formErrors]
  )

  const toggleModal = useCallback((open: boolean) => {
    if (!sdk.current) return

    setIsModalOpen(open)
    sdk.current.setOptions({
      isModalOpen: open,
    })
  }, [])

  const initializeOnfidoSDK = useCallback(async () => {
    if (
      !token.data?.token ||
      !workflow?.externalId ||
      sdk.current?.options.workflowRunId === workflow.externalId
    )
      return

    const { init } = await import('onfido-sdk-ui')

    sdk.current = init({
      token: token.data.token,
      containerId: 'onfido-mount',
      workflowRunId: workflow.externalId,
      useModal: true,
      isModalOpen,
      onModalRequestClose: async function () {
        toggleModal(false)

        await queryClient.invalidateQueries([QueryKeys.status])
        await queryClient.invalidateQueries([QueryKeys.applicant])

        setPollUserStatus(true)
      },
    })
  }, [
    isModalOpen,
    queryClient,
    toggleModal,
    token.data.token,
    workflow?.externalId,
  ])

  useEffect(() => {
    initializeOnfidoSDK()
  }, [initializeOnfidoSDK])

  const value = useMemo<KYCContextProps>(
    () => ({
      applicant: applicant.data,
      applicantId,
      getError,
      handleRequestManualReview: requestManualReview.mutateAsync,
      handleReset: generateNewWorkflow.mutateAsync,
      loadingText,
      onCreate: async (body) => {
        await createApplicant.mutateAsync(body)
      },
      setIsModalOpen: toggleModal,
      status,
      token: token.data?.token,
      userStatus: userStatus.data,
    }),
    [
      applicant.data,
      applicantId,
      getError,
      requestManualReview.mutateAsync,
      generateNewWorkflow.mutateAsync,
      loadingText,
      toggleModal,
      status,
      token.data?.token,
      userStatus.data,
      createApplicant,
    ]
  )

  return (
    <KYCContext.Provider value={value}>
      {children}
      <div id="onfido-mount"></div>
    </KYCContext.Provider>
  )
}
