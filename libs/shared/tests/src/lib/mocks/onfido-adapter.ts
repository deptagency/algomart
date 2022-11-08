import {
  CheckResult,
  CheckStatus,
  ReportResult,
  ReportStatus,
  ReportSubResult,
  ReportType,
  ToApplicantBase,
  ToApplicantBaseExtended,
  ToCheckBase,
  ToReportBase,
  WorkflowDetails,
  WorkflowState,
} from '@algomart/schemas'
import { OnfidoAdapter } from '@algomart/shared/adapters'
import { jest } from '@jest/globals'

import { MethodLikeKeys } from './jest-types'

export function setupOnfidoAdapterMockImplementations(
  prototypeOverrides = {},
  staticOverrides = {}
) {
  const defaultStaticMocks = {}
  const staticMocks = { ...defaultStaticMocks, ...staticOverrides }
  for (const propertyName in staticMocks) {
    if (staticMocks[propertyName]) {
      jest
        .spyOn(OnfidoAdapter, propertyName as never)
        .mockImplementation(staticMocks[propertyName])
    }
  }

  const defaultPrototypeMocks = {
    testConnection: jest.fn(() => Promise.resolve()),
    ping: jest.fn(() => Promise.resolve(true)),
    getToken: generateSuccessfulGetTokenMock('fake-token'),
    createWorkflowRun: generateSuccessfulCreateWorkflowRunMock(),
    getWorkflowDetails: generateSuccessfulGetWorkflowDetailsMock(),
    getApplicants: jest.fn(
      (): Promise<ToApplicantBase[]> => Promise.resolve([])
    ),
    getApplicant: generateSuccessfulGetApplicantMock(),
    createApplicant: generateSuccessfulCreateApplicantMock({
      externalId: 'fake-external-id',
      status: WorkflowState.in_progress,
      finished: false,
    }),
    updateApplicant: generateSuccessfulUpdateApplicantMock(),
    // Will be removed
    // -------------------
    getChecksForApplicant: (): Promise<ToCheckBase[]> => Promise.resolve([]),
    getCheckById: (): Promise<ToCheckBase> =>
      Promise.resolve({
        applicantId: 'fake-applicant-id',
        createdAt: 'fake-created-at',
        externalId: 'fake-check-id',
        status: CheckStatus.complete,
        result: CheckResult.clear,
      }),
    getReportsByCheckId: (): Promise<ToReportBase[]> =>
      Promise.resolve([
        {
          externalId: 'fake-report-id',
          createdAt: 'fake-created-at',
          checkId: 'fake-check-id',
          name: ReportType.proof_of_address,
          status: ReportStatus.complete,
          result: ReportResult.clear,
          subResult: ReportSubResult.clear,
        },
      ]),
    // -------------------
    processWebhookCheckComplete: jest.fn(() => Promise.resolve()),
    processWebhookWorkflowComplete: jest.fn(() => Promise.resolve()),
  }
  const prototypeMocks = { ...defaultPrototypeMocks, ...prototypeOverrides }
  for (const propertyName in prototypeMocks) {
    if (prototypeMocks[propertyName]) {
      jest
        .spyOn(
          OnfidoAdapter.prototype,
          propertyName as MethodLikeKeys<OnfidoAdapter>
        )
        .mockImplementation(prototypeMocks[propertyName])
    }
  }
}

export function generateSuccessfulGetTokenMock(token: string) {
  return () => Promise.resolve({ token })
}

export function generateSuccessfulCreateWorkflowRunMock(
  status = WorkflowState.clear,
  finished = true
) {
  return () =>
    Promise.resolve({
      externalId: 'fake-workflow-id',
      status,
      finished,
    })
}

export function generateSuccessfulGetWorkflowDetailsMock(
  status = WorkflowState.clear,
  finished = true
) {
  return () =>
    Promise.resolve({
      externalId: 'fake-workflow-id',
      status,
      finished,
    })
}

const defaultWorkflowDetails = {
  externalId: 'fake-workflow-id',
  status: WorkflowState.clear,
  finished: true,
}

export function generateSuccessfulGetApplicantMock(
  workflow: WorkflowDetails = defaultWorkflowDetails
) {
  return (): Promise<ToApplicantBaseExtended | null> =>
    Promise.resolve({
      externalId: 'fake-applicant-id',
      firstName: 'fake-first-name',
      lastName: 'fake-last-name',
      createdAt: 'fake-created-at',
      workflow,
    })
}

export function generateSuccessfulCreateApplicantMock(
  workflow: WorkflowDetails = defaultWorkflowDetails
) {
  return (): Promise<ToApplicantBaseExtended | null> =>
    Promise.resolve({
      externalId: 'fake-applicant-id',
      firstName: 'fake-first-name',
      lastName: 'fake-last-name',
      createdAt: 'fake-created-at',
      workflow,
    })
}

export function generateSuccessfulUpdateApplicantMock() {
  return (): Promise<ToApplicantBase | null> =>
    Promise.resolve({
      externalId: 'fake-applicant-id',
      createdAt: 'fake-created-at',
    })
}
