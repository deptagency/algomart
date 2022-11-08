import {
  ApplicantOnfidoAPIRequest,
  ApplicantOnfidoAPIResponse,
  ApplicantToken,
  BreakdownResult,
  CheckOnfidoAPIResponse,
  CheckResult,
  CheckStatus,
  CreateNotification,
  isOnfidoSuccessResponse,
  NotificationType,
  OnfidoEvents,
  OnfidoResponse,
  ReasonForReviewAdverseMedia,
  ReasonForReviewMonitored,
  ReasonForReviewMultiple,
  ReasonForReviewPEP,
  ReasonForReviewSanctions,
  ReportOnfidoAPIResponse,
  ReportResult,
  ReportStatus,
  ReportSubResult,
  ReportType,
  StatesWithLimitations,
  ToApplicantBase,
  ToApplicantBaseExtended,
  ToCheckBase,
  ToReportBase,
  UserAccountStatus,
  WatchlistBreakdown,
  WatchlistMonitor,
  WatchlistMonitorRequest,
  WatchlistMonitorResponse,
  WorkflowDetails,
  WorkflowDetailsResponse,
  WorkflowState,
} from '@algomart/schemas'
import { UserAccountModel } from '@algomart/shared/models'
import { HttpTransport, invariant } from '@algomart/shared/utils'
import { WebhookEvent, WebhookEventVerifier } from '@onfido/api'
import pino from 'pino'

export interface OnfidoAdapterOptions {
  isEnabled: boolean
  url: string
  token: string
  onboardingWorkflowId: string
  webhookToken: string
  webUrl: string
  cmsUrl: string
}

function toCheckStatus(status: string): CheckStatus | null {
  return (
    {
      awaiting_applicant: CheckStatus.awaiting_applicant,
      complete: CheckStatus.complete,
      in_progress: CheckStatus.in_progress,
      paused: CheckStatus.paused,
      reopened: CheckStatus.reopened,
      withdrawn: CheckStatus.withdrawn,
    }[status] || null
  )
}

function toCheckResult(result: string): CheckResult | null {
  return (
    {
      clear: CheckResult.clear,
      consider: CheckResult.consider,
    }[result] || null
  )
}

function toReportStatus(status: string): ReportStatus | null {
  return (
    {
      awaiting_applicant: ReportStatus.awaiting_approval,
      awaiting_data: ReportStatus.awaiting_data,
      cancelled: ReportStatus.cancelled,
      complete: ReportStatus.complete,
      paused: ReportStatus.paused,
      withdrawn: ReportStatus.withdrawn,
    }[status] || null
  )
}

function toReportResult(result: string): ReportResult | null {
  return (
    {
      clear: ReportResult.clear,
      consider: ReportResult.consider,
      null: ReportResult.null,
      unidentified: ReportResult.unidentified,
    }[result] || null
  )
}

function toReportSubResult(subResult: string): ReportSubResult | null {
  return (
    {
      consider: ReportSubResult.caution,
      clear: ReportSubResult.clear,
      rejected: ReportSubResult.rejected,
      suspected: ReportSubResult.suspected,
    }[subResult] || null
  )
}

function toReportName(name: string): ReportType | null {
  return (
    {
      document: ReportType.document,
      document_with_address_information:
        ReportType.document_with_address_information,
      document_with_driving_licence_information:
        ReportType.document_with_driving_licence_information,
      facial_similarity_photo: ReportType.facial_similarity_photo,
      facial_similarity_photo_fully_auto:
        ReportType.facial_similarity_photo_fully_auto,
      facial_similarity_video: ReportType.facial_similarity_video,
      known_faces: ReportType.known_faces,
      identity_enhanced: ReportType.identity_enhanced,
      watchlist_aml: ReportType.watchlist_aml,
      watchlist_enhanced: ReportType.watchlist_enhanced,
      watchlist_standard: ReportType.watchlist_standard,
      watchlist_peps_only: ReportType.watchlist_peps_only,
      watchlist_sanctions_only: ReportType.watchlist_sanctions_only,
      proof_of_address: ReportType.proof_of_address,
      right_to_work: ReportType.right_to_work,
      us_driving_licence: ReportType.us_driving_licence,
      applicant_fraud: ReportType.applicant_fraud,
    }[name] || null
  )
}

function toWorkflowState(status: string): WorkflowState | null {
  return (
    {
      cancelled: WorkflowState.cancelled,
      clear: WorkflowState.clear,
      fail: WorkflowState.fail,
      in_progress: WorkflowState.in_progress,
      manual_review: WorkflowState.manual_review,
    }[status] || null
  )
}

function toApplicantBase(
  response: ApplicantOnfidoAPIResponse
): ToApplicantBase {
  return {
    externalId: response.id,
    createdAt: response.created_at,
  }
}

function toApplicantExtended(
  response: ApplicantOnfidoAPIResponse
): ToApplicantBaseExtended {
  return {
    externalId: response.id,
    createdAt: response.created_at,
    firstName: response.first_name,
    lastName: response.last_name,
    dateOfBirth: response.dob,
    address: response.address,
  }
}

function toCheckBase(response: CheckOnfidoAPIResponse): ToCheckBase {
  return {
    externalId: response.id,
    applicantId: response.applicant_id,
    createdAt: response.created_at,
    status: toCheckStatus(response.status),
    result: toCheckResult(response.result),
    reportIds: response.report_ids,
  }
}

function toReportBase(response: ReportOnfidoAPIResponse): ToReportBase {
  return {
    externalId: response.id,
    createdAt: response.created_at,
    name: toReportName(response.name),
    status: toReportStatus(response.status),
    result: toReportResult(response.result),
    subResult: toReportSubResult(response.sub_result),
    checkId: response.check_id,
    breakdown: response.breakdown,
  }
}

function toWorkflowBase(response: WorkflowDetailsResponse): WorkflowDetails {
  return {
    externalId: response.id,
    status: toWorkflowState(response.state),
    finished: response.finished,
    applicantId: response.applicant_id,
    workflowId: response.workflow_id,
    reasons: response.reasons,
  }
}

function toWatchlistBase(response: WatchlistMonitorResponse): WatchlistMonitor {
  return {
    externalId: response.id,
    applicantId: response.applicant_id,
    createdAt: response.created_at,
    reportName: response.report_name,
  }
}

const onboardingWorkflowStatusMap = {
  [WorkflowState.cancelled]: UserAccountStatus.Unverified,
  [WorkflowState.clear]: UserAccountStatus.Clear,
  [WorkflowState.fail]: UserAccountStatus.Restricted,
  [WorkflowState.in_progress]: UserAccountStatus.Unverified,
  [WorkflowState.manual_review]: UserAccountStatus.ManualReview,
}

export class OnfidoAdapter {
  http: HttpTransport
  logger: pino.Logger<unknown>
  onboardingWorkflowId: string

  constructor(
    private readonly options: OnfidoAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })

    this.http = new HttpTransport({
      baseURL: options.url,
      defaultHeaders: {
        Authorization: `Token token=${options.token}`,
      },
    })

    this.onboardingWorkflowId = options.onboardingWorkflowId

    this.testConnection(options)
  }

  async testConnection(options: OnfidoAdapterOptions) {
    try {
      if (!options.isEnabled) return

      if (!options.url) throw new Error('URL is required')
      if (!options.token) throw new Error('Token is required')

      invariant(options.url, 'URL is required')
      invariant(options.cmsUrl, 'CMS URL is required')
      invariant(options.token, 'Token is required')
      invariant(
        options.onboardingWorkflowId,
        'Onboarding workflow ID is required'
      )
      invariant(options.webUrl, 'Web URL is required')
      invariant(options.webhookToken, 'Webhook token is required')

      const applicants = await this.getApplicants()
      invariant(applicants)
      this.logger.info('Successfully connected to Onfido')
    } catch (error) {
      this.logger.error(error, 'Failed to connect to Onfido')
    }
  }

  async ping() {
    const response = await this.http.get('ping')
    return response.status === 200
  }

  get isEnabled() {
    return this.options.isEnabled
  }

  notEnabled() {
    this.logger.error('KYC is not enabled')
    return null
  }

  // #region SDK

  async getToken(applicantId: string): Promise<ApplicantToken | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.post<OnfidoResponse<ApplicantToken>>(
      '/v3/sdk_token',
      {
        applicant_id: applicantId,
      }
    )

    if (isOnfidoSuccessResponse(response.data)) {
      return response.data
    }

    this.logger.error({ response }, 'Failed to get SDK token')
    return null
  }

  // #endregion SDK

  // #region Workflows

  async createWorkflowRun(
    applicantId: string
  ): Promise<WorkflowDetails | null> {
    if (!this.isEnabled) return this.notEnabled()

    const response = await this.http.post<
      OnfidoResponse<WorkflowDetailsResponse>
    >('/v4/workflow_runs', {
      applicant_id: applicantId,
      workflow_id: this.options.onboardingWorkflowId,
    })

    if (isOnfidoSuccessResponse(response.data)) {
      return toWorkflowBase(response.data)
    }

    this.logger.error({ response }, 'Failed to create workflow')
    return null
  }

  async getWorkflowDetails(
    workflowRunId: string
  ): Promise<WorkflowDetails | null> {
    if (!this.isEnabled) return this.notEnabled()
    if (!workflowRunId) {
      this.logger.error('Workflow ID is required')
      return null
    }

    const response = await this.http.get<
      OnfidoResponse<WorkflowDetailsResponse>
    >(`/v4/workflow_runs/${workflowRunId}`)

    if (isOnfidoSuccessResponse(response.data)) {
      return toWorkflowBase(response.data)
    }

    this.logger.error({ response }, 'Failed to retrieve workflow details')
    return null
  }

  // #endregion Workflows

  // #region Applicants

  async getApplicants(): Promise<ToApplicantBase[]> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.get<
      OnfidoResponse<{ applicants: ApplicantOnfidoAPIResponse[] }>
    >('/v3/applicants')

    if (isOnfidoSuccessResponse(response.data)) {
      return response.data.applicants.map((app: ApplicantOnfidoAPIResponse) =>
        toApplicantBase(app)
      )
    }

    this.logger.error({ response }, 'Failed to get applicants')
    return null
  }

  async getApplicant(id: string): Promise<ToApplicantBaseExtended | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.get<
      OnfidoResponse<ApplicantOnfidoAPIResponse>
    >(`v3.3/applicants/${id}`)

    if (isOnfidoSuccessResponse(response.data)) {
      return toApplicantExtended(response.data)
    }

    this.logger.error({ response }, 'Failed to get applicant by ID')
    return null
  }

  async createApplicant(
    body: Omit<ApplicantOnfidoAPIRequest, 'id'>
  ): Promise<ToApplicantBaseExtended | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.post<
      OnfidoResponse<ApplicantOnfidoAPIResponse>
    >('v3.3/applicants', body)

    if (isOnfidoSuccessResponse(response.data)) {
      return toApplicantExtended(response.data)
    }

    this.logger.error({ response }, 'Failed to create applicant')
    return null
  }

  async updateApplicant(
    id: string,
    body: Omit<ApplicantOnfidoAPIRequest, 'id'>
  ): Promise<ToApplicantBase | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.put<
      OnfidoResponse<ApplicantOnfidoAPIResponse>
    >(`v3.3/applicants/${id}`, body)

    if (isOnfidoSuccessResponse(response.data)) {
      return toApplicantBase(response.data)
    }

    this.logger.error({ response }, 'Failed to update applicant')
    return null
  }
  // #endregion Applicants

  // #region Checks

  async getChecksForApplicant(id: string): Promise<ToCheckBase[] | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.get<
      OnfidoResponse<{ checks: CheckOnfidoAPIResponse[] }>
    >(`v3/checks?applicant_id=${id}`)

    if (isOnfidoSuccessResponse(response.data)) {
      return response.data.checks.map((check: CheckOnfidoAPIResponse) =>
        toCheckBase(check)
      )
    }

    this.logger.error({ response }, 'Failed to get checks for applicant')
    return null
  }

  async getCheckById(id: string): Promise<ToCheckBase | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.get<
      OnfidoResponse<CheckOnfidoAPIResponse>
    >(`v3/checks/${id}`)

    if (isOnfidoSuccessResponse(response.data)) {
      return toCheckBase(response.data)
    }

    this.logger.error({ response }, 'Failed to find check by ID')
    return null
  }
  // #endregion Checks

  // #region Reports

  async getReportsByCheckId(checkId: string): Promise<ToReportBase[] | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.get<
      OnfidoResponse<{ reports: ReportOnfidoAPIResponse[] }>
    >(`v3/reports?check_id=${checkId}`)

    if (isOnfidoSuccessResponse(response.data)) {
      return response.data.reports.map((report) => toReportBase(report))
    }

    this.logger.error({ response }, 'Failed to get report by ID')
    return null
  }
  // #endregion Reports

  // #region Webhooks
  async subscribeToMonitor(
    body: WatchlistMonitorRequest
  ): Promise<WatchlistMonitor | null> {
    if (!this.isEnabled) return this.notEnabled()
    const response = await this.http.post<
      OnfidoResponse<WatchlistMonitorResponse>
    >('v3.4/watchlist_monitors', body)

    if (isOnfidoSuccessResponse(response.data)) {
      return toWatchlistBase(response.data)
    }

    this.logger.error({ response }, 'Failed to subscribe to monitor')
    return null
  }

  private async processWebhookCheckComplete(webhook: WebhookEvent) {
    if (!this.isEnabled) return this.notEnabled()
    const checkId = webhook.object.id
    invariant(checkId, 'Check identifier not provided')
    const notifications: CreateNotification[] = []

    // Get check and assess details
    const check = await this.getCheckById(checkId)
    if (!check) {
      this.logger.warn({ check }, 'Check not found')
      return notifications
    }
    const { applicantId } = check || {}
    if (!applicantId) {
      this.logger.warn({ check }, 'Applicant identifier not provided')
      return notifications
    }

    // Find the user associated with the Onfido applicant
    const user = await UserAccountModel.query().findOne({ applicantId })
    if (!user) {
      this.logger.warn({ user }, 'User not found')
      return notifications
    }

    // Get reports for the check
    const reports = await this.getReportsByCheckId(checkId)
    if (reports.length < 0) {
      this.logger.warn({ reports }, 'No reports found')
      return notifications
    }
    const watchlistReport = reports.find(
      ({ name }) => name === ReportType.watchlist_aml
    )
    if (!watchlistReport) {
      this.logger.warn({ reports }, 'No watchlist AML report found')
      return notifications
    }

    // Verify details for report and send notifications
    const { breakdown } = watchlistReport || {}
    const isSanctionHit = breakdown.sanction.result !== BreakdownResult.clear
    const isAdverseMediaHit =
      breakdown.adverse_media.result !== BreakdownResult.clear
    const isLegalHit =
      breakdown.legal_and_regulatory_warnings.result !== BreakdownResult.clear
    const isPEPHit =
      breakdown.politically_exposed_person.result !== BreakdownResult.clear
    const verificationStatus =
      isLegalHit || isPEPHit
        ? UserAccountStatus.Restricted
        : isAdverseMediaHit || isSanctionHit
        ? UserAccountStatus.ManualReview
        : undefined

    const payload = {
      recentWatchlistBreakdown: breakdown as WatchlistBreakdown,
      lastVerified: new Date().toISOString(),
    }
    if (verificationStatus) Object.assign(payload, { verificationStatus })

    // Update the user's record with the breakdown
    await UserAccountModel.query().findById(user.id).patch(payload)

    notifications.push({
      type: NotificationType.ReportComplete,
      userAccountId: user.id,
      variables: {
        applicantId,
        url: `https://dashboard.us.onfido.com/results/${user.lastWorkflowRunId}`,
        userEmail: user.email,
        verificationStatus,
      },
    })

    return notifications
  }

  private async processWebhookWorkflowComplete(webhook: WebhookEvent) {
    this.logger.debug({ webhook }, 'processing onfido webhook')

    const notifications: CreateNotification[] = []
    let verificationStatus: UserAccountStatus

    if (!this.isEnabled) return this.notEnabled()
    const workflowRunId = webhook.object.id
    if (!workflowRunId) {
      this.logger.warn({ webhook }, 'Workflow Run ID not provided')
      return notifications
    }

    const workflow = await this.getWorkflowDetails(workflowRunId)
    const { applicantId, status: workflowStatus } = workflow || {}
    if (!applicantId) {
      this.logger.warn({ webhook }, 'Workflow Applicant ID not provided')
      return notifications
    }

    // Check if this is the initial workflow or the ongoing monitoring for watchlists
    const isOnboardingWorkflow =
      workflow.workflowId === this.onboardingWorkflowId
    if (!isOnboardingWorkflow) {
      this.logger.warn({ webhook }, 'Unknown Workflow')
      return notifications
    }

    const user = await UserAccountModel.query().findOne({
      applicantId,
    })
    if (!user) {
      this.logger.warn(
        { webhook },
        'No user matching the Workflow Applicant ID'
      )
      return notifications
    }

    // Notifications
    const reasonsList = workflow.reasons.join(', ')
    const workflowFailed = {
      type: NotificationType.WorkflowCompleteRejected,
      userAccountId: user.id,
      variables: {
        status: workflowStatus,
        url: `https://dashboard.us.onfido.com/results/${user.lastWorkflowRunId}`,
        reasons: reasonsList,
      },
    }
    const workflowManualReview = {
      type: NotificationType.WorkflowCompleteManual,
      userAccountId: user.id,
      variables: {
        status: workflowStatus,
        url: this.options.cmsUrl,
        reasons: reasonsList,
      },
    }
    const workflowCompleteForCustomer = {
      type: NotificationType.WorkflowComplete,
      userAccountId: user.id,
      variables: {
        url: `${this.options.webUrl}my/verification`,
        status: workflowStatus,
      },
    }

    // Initial onboarding workflow
    if (isOnboardingWorkflow) {
      // Determine user status based on workflow state
      verificationStatus =
        onboardingWorkflowStatusMap[workflowStatus] ??
        UserAccountStatus.Unverified

      // If the verification status is marked clear, validate the address
      if (verificationStatus === UserAccountStatus.Clear) {
        const applicant = await this.getApplicant(applicantId)
        // If the address is one of Circle's restricted states, change the account status to Limited
        if (
          applicant?.address?.state &&
          Object.values(StatesWithLimitations).includes(
            applicant.address.state as string as StatesWithLimitations
          )
        ) {
          verificationStatus = UserAccountStatus.Limited
        }
      }

      // Send user a notification their workflow is complete
      notifications.push(workflowCompleteForCustomer)
    }

    // If a watchlist run failed, check if the reason is adverse media
    if (
      workflowStatus === WorkflowState.fail &&
      workflow.reasons.includes(ReasonForReviewAdverseMedia)
    ) {
      // Update the user to manual review
      verificationStatus = UserAccountStatus.ManualReview
    }

    // If a watchlist run failed, check if the reason is PEP, sanctions, govt, or if multiple categories
    if (
      workflow.reasons.includes(ReasonForReviewPEP) ||
      workflow.reasons.includes(ReasonForReviewMonitored) ||
      workflow.reasons.includes(ReasonForReviewSanctions) ||
      workflow.reasons.includes(ReasonForReviewMultiple)
    ) {
      // Update the user to restricted
      verificationStatus = UserAccountStatus.Restricted
    }

    // Send alert to team that a workflow failed
    if (verificationStatus === UserAccountStatus.Restricted) {
      notifications.push(workflowFailed)
    }

    // Send alert to team that a workflow is in manual review
    if (verificationStatus === UserAccountStatus.ManualReview) {
      notifications.push(workflowManualReview)
    }

    // If a new verification status is determined, update the user status
    if (
      user.verificationStatus !== UserAccountStatus.Banned &&
      verificationStatus
    ) {
      this.logger.debug(
        { status: verificationStatus, userId: user.id },
        'Updating user verification status'
      )
      // Update user with new last verified date and updated status
      await UserAccountModel.query().findById(user.id).patch({
        verificationStatus,
        lastVerified: new Date().toISOString(),
      })
    } else {
      this.logger.debug(
        { status: verificationStatus, userId: user.id },
        'No change to user verification status'
      )
    }

    return notifications
  }

  async processWebhook(
    webhook: string | Buffer,
    signature: string
  ): Promise<CreateNotification[] | null> {
    if (!this.isEnabled) return this.notEnabled()
    // Verify webhook
    const verifyPayload = async () => {
      let payload: WebhookEvent | null = null
      try {
        const verifier = new WebhookEventVerifier(this.options.webhookToken)
        const response = verifier.readPayload(webhook, signature)
        if (!response) throw new Error('No payload')
        payload = response
      } catch (error) {
        this.logger.error(
          { message: error.message },
          'Unable to verify payload for webhook'
        )
        return null
      }
      return payload
    }
    const payload = await verifyPayload()
    invariant(payload, 'Unable to verify webhook')

    // Process webhook
    const { action } = payload || {}
    switch (action) {
      case OnfidoEvents.CheckCompleted:
        return await this.processWebhookCheckComplete(payload)
      case OnfidoEvents.WorkflowRunCompleted:
        return await this.processWebhookWorkflowComplete(payload)
      default:
        this.logger.warn(`unhandled onfido webhook event: ${action}`)
        return []
    }
  }

  async getApplicantsWithoutMonitor(): Promise<
    Array<{
      applicantId: string
      lastVerified: Date
      userExternalId: string
      lastWorkflowRunId: string
      verificationStatus: UserAccountStatus
    }>
  > {
    const isVerificationEnabled = this.isEnabled
    if (!isVerificationEnabled) return []

    const users = await UserAccountModel.query()
      .select('applicantId')
      .whereNotNull('applicantId')
      .whereNotNull('lastWorkflowRunId')
      .whereNotNull('lastVerified')
      .whereNull('watchlistMonitorId')

    return users.map((user) => ({
      applicantId: user.applicantId,
      userExternalId: user.externalId,
      lastWorkflowRunId: user.lastWorkflowRunId,
      lastVerified: new Date(user.lastVerified),
      verificationStatus: user.verificationStatus,
    }))
  }
}
