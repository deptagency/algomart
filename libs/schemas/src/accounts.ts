import { Static, Type } from '@sinclair/typebox'

import { CircleWirePayoutPublicDetailsSchema } from './payouts'
import {
  AlgorandAccountAddressObjectSchema,
  AlgorandAccountAddressSchema,
  BaseSchema,
  CircleTransferStatus,
  CircleWalletIdSchema,
  CurrencyAmountSchema,
  CurrencyAmountStringSchema,
  CurrencyCodeSchema,
  EntityType,
  IdSchema,
  LanguageSchema,
  Nullable,
  PageSchema,
  PageSizeSchema,
  PaginationSchema,
  regExpToString,
  Simplify,
  SortDirection,
  UserExternalIdSchema,
} from './shared'
import {
  AlgorandTransactionSchema,
  AlgorandTransactionStatus,
} from './transactions'

export enum FirebaseClaim {
  admin = 'admin',
}

export enum UserAccountStatus {
  Clear = 'clear',
  Approved = 'approved',
  Limited = 'limited',
  NeedsVerification = 'needs-verification',
  ManualReview = 'manual-review',
  Restricted = 'restricted',
  Banned = 'banned',
  Unverified = 'unverified',
}

export enum StatesWithLimitations {
  Hawaii = 'HI',
  Alaska = 'AK',
  Minnesota = 'MN',
  NewYork = 'NY',
}

export enum BreakdownResult {
  clear = 'clear',
  consider = 'consider',
}

export enum UserAccountProvider {
  Email = 'email',
  Google = 'google',
}

export enum AlgorandAccountSig {
  Sig = 'sig',
  Msig = 'msig',
  Lsig = 'lsig',
}

export enum AlgorandAccountStatus {
  Online = 'Online',
  Offline = 'Offline',
  NotParticipating = 'NotParticipating',
}

export enum PaymentOption {
  Card = 'card',
  USDC = 'usdc',
}

export const UserAccountMinAge = 14
export const UserAccountMaxAge = 100

// Matches 2-20 letters and numbers
export const UserAccountUsernamePattern = /^[\dA-Za-z]{2,20}$/

// Reasons for failure in Onfido's workflow builder when a customer is matched to a list
export const ReasonForReviewPEP = 'PEPs Match'
export const ReasonForReviewSanctions = 'Sanctions Match'
export const ReasonForReviewMonitored = 'Monitored Lists Match'
export const ReasonForReviewAdverseMedia = 'Adverse Media Match'
export const ReasonForReviewMultiple = 'Multiple Category Match'

export const AdminPermissionsSchema = Type.Object({
  claims: Type.Array(Type.Enum(FirebaseClaim)),
})

export const AlgorandAccountSchema = Type.Intersect([
  BaseSchema,
  AlgorandAccountAddressObjectSchema,
  Type.Object({
    creationTransactionId: Type.Optional(Type.String({ format: 'uuid' })),
    creationTransaction: Type.Optional(AlgorandTransactionSchema),
    encryptedKey: Type.String(),
  }),
])

export const AssetHoldingSchema = Type.Object({
  amount: Type.Number(),
  assetIndex: Type.Number(),
  isFrozen: Type.Boolean(),
})

export const AlgorandTransformedAccountInfoSchema = Type.Object({
  address: Type.String(),
  amount: Type.Integer(),
  amountWithoutPendingRewards: Type.Integer(),
  appsLocalState: Type.Optional(
    Type.Array(Type.Record(Type.String(), Type.Unknown()))
  ),
  appsTotalExtraPages: Type.Optional(Type.Integer()),
  appsTotalSchema: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  assets: Type.Optional(Type.Array(AssetHoldingSchema)),
  authAddr: Type.Optional(Type.String()),
  createdApps: Type.Optional(
    Type.Array(Type.Record(Type.String(), Type.Unknown()))
  ),
  createdAssets: Type.Optional(
    Type.Array(Type.Record(Type.String(), Type.Unknown()))
  ),
  participation: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  pendingRewards: Type.Integer(),
  rewardBase: Type.Optional(Type.Integer()),
  rewards: Type.Integer(),
  round: Type.Integer(),
  sigType: Type.Optional(Type.Enum(AlgorandAccountSig)),
  status: Type.Enum(AlgorandAccountStatus),
  totalAppsOptedIn: Type.Integer(),
  totalAssetsOptedIn: Type.Integer(),
  totalCreatedApps: Type.Integer(),
  totalCreatedAssets: Type.Integer(),
})

export const UsernameSchema = Type.String({
  minLength: 2,
  maxLength: 20,
  pattern: regExpToString(UserAccountUsernamePattern),
})

export const UsernameObjectSchema = Type.Object({
  username: UsernameSchema,
})

export const UserAvatarObjectSchema = Type.Object({
  profileAvatar: Type.Optional(Type.String()),
})

export const EmailSchema = Type.String({ format: 'email' })

export const UserEmailObjectSchema = Type.Object({
  email: EmailSchema,
})

export const AgeSchema = Type.Integer({
  maximum: UserAccountMaxAge,
  minimum: UserAccountMinAge,
})

const BreakdownResultSchema = Type.Object({
  result: Nullable(Type.Enum(BreakdownResult)),
  properties: Type.Optional(Type.Any()),
  breakdown: Type.Optional(Type.Any()),
})

const WatchlistBreakdownSchema = Type.Object({
  sanction: BreakdownResultSchema,
  politically_exposed_person: BreakdownResultSchema,
  legal_and_regulatory_warnings: BreakdownResultSchema,
  adverse_media: BreakdownResultSchema,
})

const WatchlistMonitorRequestSchema = Type.Object({
  applicant_id: Type.String(),
  report_name: Type.String(),
  tags: Type.Optional(Type.Array(Type.String())),
})

const WatchlistMonitorResponseSchema = Type.Object({
  id: Type.String(),
  applicant_id: Type.String(),
  report_name: Type.String(),
  is_sandbox: Type.Boolean(),
  created_at: Type.String(),
})

const WatchlistMonitorSchema = Type.Object({
  externalId: Type.String(),
  applicantId: Type.String(),
  reportName: Type.String(),
  createdAt: Type.String(),
})

const BreakdownSchema = Type.Intersect([
  Type.Object({
    age_validation: BreakdownResultSchema,
    compromised_document: BreakdownResultSchema,
    data_comparison: BreakdownResultSchema,
    data_consistency: BreakdownResultSchema,
    data_validation: BreakdownResultSchema,
    image_integrity: BreakdownResultSchema,
    police_record: BreakdownResultSchema,
    visual_authenticity: BreakdownResultSchema,
    issuing_authority: BreakdownResultSchema,
  }),
  WatchlistBreakdownSchema,
])

export const ProviderSchema = Type.Enum(UserAccountProvider)

const BaseUserAccountSchema = Type.Object({
  age: Type.Optional(Nullable(AgeSchema)),
  balance: Type.Optional(CurrencyAmountSchema),
  currency: Type.Optional(CurrencyCodeSchema),
  email: Type.Optional(EmailSchema),
  externalId: UserExternalIdSchema,
  externalWalletId: Type.Optional(CircleWalletIdSchema),
  verificationStatus: Type.Enum(UserAccountStatus),
  applicantId: Type.Optional(Nullable(Type.String())),
  lastWorkflowRunId: Type.Optional(Nullable(Type.String())),
  lastVerified: Type.Optional(Nullable(Type.String({ format: 'date-time' }))),
  language: Type.Optional(LanguageSchema),
  provider: Type.Optional(Nullable(ProviderSchema)),
  recentWatchlistBreakdown: Type.Optional(Nullable(WatchlistBreakdownSchema)),
  username: Type.Optional(UsernameSchema),
  watchlistMonitorId: Type.Optional(Nullable(Type.String())),
})

export const CreateUserAccountRequestSchema = Type.Object({
  age: Type.Optional(Nullable(AgeSchema)),
  currency: Type.Optional(CurrencyCodeSchema),
  email: EmailSchema,
  language: Type.Optional(LanguageSchema),
  provider: ProviderSchema,
  username: Type.Optional(UsernameSchema),
})

export const UpdateUserAccountSchema = Type.Object({
  age: Type.Optional(Nullable(AgeSchema)),
  currency: Type.Optional(CurrencyCodeSchema),
  email: Type.Optional(EmailSchema),
  language: Type.Optional(LanguageSchema),
  showProfile: Type.Optional(Type.Boolean()),
  username: Type.Optional(Type.String()),
})

export const DeleteTestAccountSchema = Type.Object({
  usernames: Type.Array(Type.String()),
})

export const PublicUserAccountSchema = Type.Intersect([
  BaseUserAccountSchema,
  Type.Object({
    id: Type.Optional(IdSchema),
    address: AlgorandAccountAddressSchema,
    status: Type.Optional(Type.Enum(AlgorandTransactionStatus)),
    showProfile: Type.Boolean(),
  }),
])

export const UserAccountSchema = Type.Intersect([
  BaseSchema,
  BaseUserAccountSchema,
  Type.Object({
    algorandAccountId: IdSchema,
    algorandAccount: Type.Optional(AlgorandAccountSchema),
    claims: Type.Optional(Type.Array(Type.Enum(FirebaseClaim))),
    showProfile: Type.Optional(Type.Boolean()),
  }),
])

// #region KYC

// see: https://documentation.onfido.com/#check-status
export enum CheckStatus {
  in_progress = 'in_progress',
  awaiting_applicant = 'awaiting_applicant',
  complete = 'complete',
  withdrawn = 'withdrawn',
  paused = 'paused',
  reopened = 'reopened',
}

// see: https://documentation.onfido.com/v3/#check-results
export enum CheckResult {
  clear = 'clear',
  consider = 'consider',
}

// see: https://documentation.onfido.com/v3/#report-status
export enum ReportStatus {
  awaiting_data = 'awaiting_data',
  awaiting_approval = 'awaiting_approval',
  cancelled = 'cancelled',
  complete = 'complete',
  withdrawn = 'withdrawn',
  paused = 'paused',
}

// see: https://documentation.onfido.com/v3/#report-results
export enum ReportResult {
  clear = 'clear',
  consider = 'consider',
  unidentified = 'unidentified',
  null = 'null',
}

// see: https://documentation.onfido.com/v3/#sub-results-document-reports
export enum ReportSubResult {
  clear = 'clear',
  rejected = 'rejected',
  suspected = 'suspected',
  caution = 'caution',
}

// see: https://documentation.onfido.com/#report-names-in-api
export enum ReportType {
  document = 'document',
  document_with_address_information = 'document_with_address_information',
  document_with_driving_licence_information = 'document_with_driving_licence_information',
  caution = 'caution',
  facial_similarity_photo = 'facial_similarity_photo',
  facial_similarity_photo_fully_auto = 'facial_similarity_photo_fully_auto',
  facial_similarity_video = 'facial_similarity_video',
  known_faces = 'known_faces',
  identity_enhanced = 'identity_enhanced',
  watchlist_aml = 'watchlist_aml',
  watchlist_enhanced = 'watchlist_enhanced',
  watchlist_standard = 'watchlist_standard',
  watchlist_peps_only = 'watchlist_peps_only',
  watchlist_sanctions_only = 'watchlist_sanctions_only',
  proof_of_address = 'proof_of_address',
  right_to_work = 'right_to_work',
  us_driving_licence = 'us_driving_licence',
  applicant_fraud = 'applicant_fraud',
}

export enum WorkflowState {
  in_progress = 'in_progress',
  clear = 'clear',
  fail = 'fail',
  manual_review = 'manual_review',
  cancelled = 'cancelled',
}

const ApplicantOnfidoAPIBaseSchema = Type.Object({
  id: IdSchema,
  created_at: Type.Optional(Type.String()),
  sandbox: Type.Optional(Type.Boolean()),
  first_name: Type.Optional(Type.String()),
  last_name: Type.Optional(Type.String()),
  email: Type.Optional(Type.String()),
  dob: Type.Optional(Type.String()),
  delete_at: Type.Optional(Nullable(Type.String())),
  href: Type.Optional(Type.String()),
  address: Type.Optional(
    Type.Object({
      postcode: Type.Optional(Type.String()),
      country: Type.Optional(Type.String()),
      line1: Type.Optional(Type.String()),
      line2: Type.Optional(Type.String()),
      line3: Type.Optional(Type.String()),
      street: Type.Optional(Type.String()),
      sub_street: Type.Optional(Type.String()),
      state: Type.Optional(Type.String()),
      town: Type.Optional(Type.String()),
      flat_number: Type.Optional(Type.String()),
      building_number: Type.Optional(Type.String()),
      building_name: Type.Optional(Type.String()),
    })
  ),
  id_numbers: Type.Optional(
    Type.Array(
      Type.Object({
        type: Type.String(),
        value: Type.String(),
        stateCode: Type.Optional(Type.String()),
      })
    )
  ),
})

const ApplicantOnfidoAPIRequestSchema = Type.Intersect([
  ApplicantOnfidoAPIBaseSchema,
])

const ApplicantOnfidoAPIResponseSchema = Type.Intersect([
  ApplicantOnfidoAPIBaseSchema,
  Type.Object({
    id: Type.Optional(Type.String()),
    created_at: Type.Optional(Type.String()),
    sandbox: Type.Optional(Type.Boolean()),
    delete_at: Type.Optional(Nullable(Type.String())),
    href: Type.Optional(Type.String()),
  }),
])

const CheckOnfidoAPIResponseSchema = Type.Object({
  id: Type.Optional(Type.String()),
  report_ids: Type.Array(Type.String()),
  created_at: Type.Optional(Type.String()),
  href: Type.Optional(Type.String()),
  applicant_id: Type.Optional(Type.String()),
  applicant_provides_data: Type.Optional(Type.Boolean()),
  status: Type.Optional(Type.String()),
  tags: Type.Array(Type.String()),
  result: Type.Optional(Type.String()),
  form_uri: Type.Optional(Type.String()),
  redirect_uri: Type.Optional(Type.String()),
  results_uri: Type.Optional(Type.String()),
  privacy_notices_read_consent_given: Type.Optional(Type.Boolean()),
  webhook_ids: Type.Array(Type.String()),
})

const ReportOnfidoAPIResponseSchema = Type.Object({
  id: Type.Optional(Type.String()),
  created_at: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  href: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  result: Type.Optional(Type.String()),
  sub_result: Type.Optional(Type.String()),
  documents: Type.Array(Type.Object({ id: Type.String() })),
  check_id: Type.Optional(Type.String()),
  breakdown: Type.Optional(Nullable(BreakdownSchema)),
})

export const UserStatusReportSchema = Type.Object({
  isVerificationEnabled: Type.Boolean(),
  isVerificationRequired: Type.Boolean(),
  status: Type.Enum(UserAccountStatus),
  totalAmountBeforeVerification: Type.Number(),
  dailyAmountBeforeVerification: Type.Number(),
})

const UserTotalsSchema = Type.Object({
  amountSpentInLast24Hours: Type.Number(),
  totalAmountSpent: Type.Number(),
})

export const UserTotalsReportSchema = Type.Intersect([
  UserTotalsSchema,
  Type.Object({
    userBalance: Type.Number(),
    userExternalId: Type.String(),
  }),
])

export const ApplicantRequestParamsSchema = Type.Object({
  applicantId: Type.String(),
})

export const ApplicantRequestQuerySchema = Type.Object({
  workflowRunId: Type.String(),
})

const ToApplicantBaseSchema = Type.Object({
  externalId: Type.String(),
  createdAt: Type.String(),
})

const ToReportBaseSchema = Type.Object({
  externalId: Type.String(),
  createdAt: Type.String(),
  name: Type.Enum(ReportType),
  status: Type.Enum(ReportStatus),
  result: Type.Enum(ReportResult),
  subResult: Type.Enum(ReportSubResult),
  checkId: Type.String(),
  breakdown: Type.Optional(Nullable(BreakdownSchema)),
})

const ToCheckBaseSchema = Type.Object({
  externalId: Type.String(),
  applicantId: Type.String(),
  createdAt: Type.String(),
  status: Type.Enum(CheckStatus),
  result: Type.Enum(CheckResult),
  reportIds: Type.Optional(Type.Array(Type.String())),
  reports: Type.Optional(Type.Array(ToReportBaseSchema)),
})

const Address = Type.Object({
  postcode: Type.Optional(Nullable(Type.String())),
  country: Type.Optional(Nullable(Type.String())),
  line1: Type.Optional(Nullable(Type.String())),
  line2: Type.Optional(Nullable(Type.String())),
  line3: Type.Optional(Nullable(Type.String())),
  street: Type.Optional(Nullable(Type.String())),
  subStreet: Type.Optional(Nullable(Type.String())),
  state: Type.Optional(Nullable(Type.String())),
  town: Type.Optional(Nullable(Type.String())),
  flatNumber: Type.Optional(Nullable(Type.String())),
  buildingNumber: Type.Optional(Nullable(Type.String())),
  buildingName: Type.Optional(Nullable(Type.String())),
})

export const WorkflowDetailsSchema = Type.Object({
  externalId: Type.String(),
  status: Type.Enum(WorkflowState),
  finished: Type.Boolean(),
  applicantId: Type.Optional(Type.String()),
  workflowId: Type.Optional(Type.String()),
  reasons: Type.Optional(Nullable(Type.Array(Type.String()))),
})

const WorkflowDetailsResponseSchema = Type.Object({
  id: Type.String(),
  applicant_id: Type.String(),
  workflow_id: Type.String(),
  finished: Type.Optional(Type.Boolean()),
  version_id: Type.Optional(Type.Number()),
  state: Type.String(),
  reasons: Type.Optional(Nullable(Type.Array(Type.String()))),
})

export const ToApplicantBaseExtendedSchema = Type.Object({
  externalId: Type.String(),
  createdAt: Type.String(),
  dateOfBirth: Type.Optional(Type.String()),
  firstName: Type.String(),
  lastName: Type.String(),
  address: Type.Optional(Nullable(Address)),
  workflow: Type.Optional(WorkflowDetailsSchema),
})

export const ApplicantTokenSchema = Type.Object({
  token: Type.String(),
})

export const ApplicantCreateSchema = Type.Object({
  firstName: Type.String(),
  lastName: Type.String(),
  email: Type.String(),
  dob: Type.Optional(Type.String()),
  address: Type.Optional(Type.Union([Address, Type.Null()])),
  idNumbers: Type.Optional(
    Type.Array(
      Type.Object({
        type: Type.String(),
        value: Type.String(),
        stateCode: Type.Optional(Type.String()),
      })
    )
  ),
})

export const ApplicantCreateRequestSchema = ApplicantCreateSchema

const OnfidoErrorResponseSchema = Type.Object({
  error: Type.Object({
    type: Type.String(),
    message: Type.String(),
    fields: Type.Optional(Type.Object({})),
  }),
})

export type AlgorandTransformedAccountInfo = Simplify<
  Static<typeof AlgorandTransformedAccountInfoSchema>
>
export type AlgorandAssetHolding = Simplify<Static<typeof AssetHoldingSchema>>
export type ApplicantToken = Simplify<Static<typeof ApplicantTokenSchema>>
export type ApplicantCreate = Simplify<Static<typeof ApplicantCreateSchema>>
export type ApplicantCreateRequest = Simplify<
  Static<typeof ApplicantCreateRequestSchema>
>
export type ApplicantRequestParams = Simplify<
  Static<typeof ApplicantRequestParamsSchema>
>
export type ApplicantRequestQuery = Simplify<
  Static<typeof ApplicantRequestQuerySchema>
>
export type ApplicantOnfidoAPIRequest = Simplify<
  Static<typeof ApplicantOnfidoAPIRequestSchema>
>
export type ApplicantOnfidoAPIResponse = Simplify<
  Static<typeof ApplicantOnfidoAPIResponseSchema>
>
export type CheckOnfidoAPIResponse = Simplify<
  Static<typeof CheckOnfidoAPIResponseSchema>
>
export type WorkflowDetails = Simplify<Static<typeof WorkflowDetailsSchema>>
export type WorkflowDetailsResponse = Simplify<
  Static<typeof WorkflowDetailsResponseSchema>
>
export type ReportOnfidoAPIResponse = Simplify<
  Static<typeof ReportOnfidoAPIResponseSchema>
>
export type ToApplicantBase = Simplify<Static<typeof ToApplicantBaseSchema>>
export type ToApplicantBaseExtended = Simplify<
  Static<typeof ToApplicantBaseExtendedSchema>
>
export type ToCheckBase = Simplify<Static<typeof ToCheckBaseSchema>>
export type ToReportBase = Simplify<Static<typeof ToReportBaseSchema>>
export type UserStatusReport = Simplify<Static<typeof UserStatusReportSchema>>
export type UserTotals = Simplify<Static<typeof UserTotalsSchema>>
export type UserTotalsReport = Simplify<Static<typeof UserTotalsReportSchema>>
export type WatchlistBreakdown = Simplify<
  Static<typeof WatchlistBreakdownSchema>
>
export type WatchlistMonitor = Simplify<Static<typeof WatchlistMonitorSchema>>
export type WatchlistMonitorRequest = Simplify<
  Static<typeof WatchlistMonitorRequestSchema>
>
export type WatchlistMonitorResponse = Simplify<
  Static<typeof WatchlistMonitorResponseSchema>
>

export type OnfidoErrorResponse = Simplify<
  Static<typeof OnfidoErrorResponseSchema>
>
export type OnfidoResponse<T = unknown> = T | OnfidoErrorResponse

export function isOnfidoSuccessResponse<T = unknown>(
  response: OnfidoResponse<T>
): response is T {
  const data = response
  return !!data
}

// #endregion KYC

export const UserAccountTransferCreateSchema = Type.Object({
  amount: CurrencyAmountStringSchema,
  entityId: IdSchema,
  entityType: Type.Enum(EntityType),
  externalId: Type.Optional(Nullable(IdSchema)),
  userAccountId: IdSchema,
})

export const UserAccountTransferUpdateSchema = Type.Object({
  error: Type.Optional(Type.String()),
  externalId: IdSchema,
  status: Type.Enum(CircleTransferStatus),
})

export const UserAccountTransferSchema = Type.Intersect([
  BaseSchema,
  UserAccountTransferCreateSchema,
  Type.Object({
    error: Type.Optional(Type.String()),
    balance: Type.Optional(CurrencyAmountStringSchema),
    status: Type.Enum(CircleTransferStatus),
  }),
])

export const SendPasswordResetSchema = Type.Object({
  email: EmailSchema,
})

export const SendNewEmailVerificationSchema = Type.Object({
  verificationLink: Type.String(),
})

export enum UserAccountTransferType {
  Credit = 'credit',
  Debit = 'debit',
}

export enum UserAccountTransferAction {
  CashOut = 'cashOut',
  Deposit = 'deposit',
  CollectiblePurchase = 'collectiblePurchase',
  CollectibleSale = 'collectibleSale',
  PackPurchase = 'packPurchase',
}

export const EntityIdSchema = Type.Object({
  entityId: IdSchema,
})

export const UserAccountTransferHistorySchema = Type.Object({
  action: Type.Enum(UserAccountTransferAction),
  amount: CurrencyAmountStringSchema,
  createdAt: Type.String({ format: 'date-time' }),
  status: Type.Enum(CircleTransferStatus),
  type: Type.Enum(UserAccountTransferType),
  entityId: IdSchema,
  pack: Type.Optional(
    Nullable(
      Type.Object({
        id: IdSchema,
        image: Type.String({ format: 'uri' }),
        title: Type.String(),
      })
    )
  ),
  collectible: Type.Optional(
    Nullable(
      Type.Object({
        id: IdSchema,
        image: Type.String({ format: 'uri' }),
        title: Type.String(),
      })
    )
  ),
  listing: Type.Optional(
    Nullable(
      Type.Object({
        id: IdSchema,
      })
    )
  ),
  wirePayout: Type.Optional(Nullable(CircleWirePayoutPublicDetailsSchema)),
})

export const UserAccountTransfersQuerySchema = Type.Object({
  page: Type.Optional(PageSchema),
  pageSize: Type.Optional(PageSizeSchema),
  joinCollectible: Type.Optional(Type.Boolean()),
  joinListing: Type.Optional(Type.Boolean()),
  joinPack: Type.Optional(Type.Boolean()),
  joinWirePayout: Type.Optional(Type.Boolean()),
  language: Type.Optional(Nullable(LanguageSchema)),
  status: Type.Optional(Type.Array(Type.Enum(CircleTransferStatus))),
})

export const UserAccountTransfersResponseSchema = Type.Object({
  total: CurrencyAmountSchema,
  transfers: Type.Array(UserAccountTransferHistorySchema),
})

export type AlgorandAccount = Simplify<Static<typeof AlgorandAccountSchema>>
export type AdminPermissions = Simplify<Static<typeof AdminPermissionsSchema>>
export type Breakdown = Simplify<Static<typeof BreakdownSchema>>
export type CreateUserAccountRequest = Simplify<
  Static<typeof CreateUserAccountRequestSchema>
>
export type PublicAccount = Simplify<Static<typeof PublicUserAccountSchema>>
export type UserAccount = Simplify<Static<typeof UserAccountSchema>>
export type UserAvatar = Simplify<Static<typeof UserAvatarObjectSchema>>
export type Username = Simplify<Static<typeof UsernameObjectSchema>>
export type UserEmail = Simplify<Static<typeof UserEmailObjectSchema>>
export type UpdateUserAccount = Simplify<Static<typeof UpdateUserAccountSchema>>
export type DeleteTestAccount = Simplify<Static<typeof DeleteTestAccountSchema>>

export type UserAccountTransferCreate = Simplify<
  Static<typeof UserAccountTransferCreateSchema>
>
export type UserAccountTransferUpdate = Simplify<
  Static<typeof UserAccountTransferUpdateSchema>
>
export type UserAccountTransfer = Simplify<
  Static<typeof UserAccountTransferSchema>
>
export type UserAccountTransferHistory = Simplify<
  Static<typeof UserAccountTransferHistorySchema>
>
export type UserAccountTransfersQuery = Simplify<
  Static<typeof UserAccountTransfersQuerySchema>
>
export type UserAccountTransfersResponse = Simplify<
  Static<typeof UserAccountTransfersResponseSchema>
>
export type SendPasswordReset = Simplify<Static<typeof SendPasswordResetSchema>>
export type SendNewEmailVerification = Simplify<
  Static<typeof SendNewEmailVerificationSchema>
>

export const UserAccountsSchema = Type.Object({
  users: Type.Array(UserAccountSchema),
  total: CurrencyAmountSchema,
})
export type UserAccounts = Simplify<Static<typeof UserAccountsSchema>>

export enum UserSortField {
  Username = 'username',
  Email = 'email',
  CreatedAt = 'createdAt',
}

// #region KYC portal
export const SearchPattern = /[^()+<=>@[\]`{}~]/
export const UsersQuerystringSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    search: Type.Optional(
      Type.String({ pattern: regExpToString(SearchPattern) })
    ),
    sortBy: Type.Optional(
      Type.Enum(UserSortField, { default: UserSortField.CreatedAt })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Descending })
    ),
  }),
])
export type UsersQuerystring = Simplify<Static<typeof UsersQuerystringSchema>>

export const UsersVerificationQuerystringSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    verificationStatus: Type.Enum(UserAccountStatus),
    sortBy: Type.Optional(
      Type.Enum(UserSortField, { default: UserSortField.CreatedAt })
    ),
    sortDirection: Type.Optional(
      Type.Enum(SortDirection, { default: SortDirection.Descending })
    ),
  }),
])
export type UsersVerificationQuerystring = Simplify<
  Static<typeof UsersVerificationQuerystringSchema>
>
// #endregion

export function isPurchaseAllowed(
  {
    isVerificationRequired,
    status,
    totalAmountBeforeVerification,
    dailyAmountBeforeVerification,
  }: UserStatusReport,
  amount: string | number = 0,
  method: PaymentOption | null = null
): boolean {
  const allowedStatuses = [UserAccountStatus.Clear, UserAccountStatus.Approved]
  if (method === PaymentOption.Card)
    allowedStatuses.push(UserAccountStatus.Limited)

  const paymentAmount = amount ? Number(amount) : 0
  const newDaily = dailyAmountBeforeVerification - paymentAmount
  const newTotal = totalAmountBeforeVerification - paymentAmount
  const isVerificationRequiredWithNewAmount = 0 >= newDaily || 0 >= newTotal

  if (!isVerificationRequired && !isVerificationRequiredWithNewAmount) {
    allowedStatuses.push(UserAccountStatus.Unverified)
  }

  return allowedStatuses.includes(status)
}
