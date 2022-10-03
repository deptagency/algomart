import {
  ApplicantCreateRequest,
  ToApplicantBaseExtended,
  WorkflowDetails,
} from '@algomart/schemas'

import { apiFetcher } from '@/utils/react-query'
import { urls } from '@/utils/urls'

export async function createApplicant(
  json: ApplicantCreateRequest
): Promise<ToApplicantBaseExtended> {
  const applicant = await apiFetcher().post<ToApplicantBaseExtended>(
    urls.api.accounts.applicant,
    { json }
  )
  return applicant
}

export async function generateNewWorkflow(): Promise<WorkflowDetails> {
  const workflow = await apiFetcher().post<WorkflowDetails>(
    urls.api.accounts.applicantWorkflow
  )
  return workflow
}

export async function requestManualReview(): Promise<boolean> {
  try {
    await apiFetcher().post(urls.api.accounts.applicantManualReview)
    return true
  } catch {
    return false
  }
}
