import {
  CircleCreateWireBankAccountRequest,
  CircleWireBankAccount,
  CircleWireBankAccountStatus,
  CreateIBANWireBankAccountRequest,
  CreateUSWireBankAccountRequest,
  CreateWireBankAccountRequest,
  IBANWireBankAccount,
  PatchWireBankAccount,
  UserAccount,
} from '@algomart/schemas'
import { CircleAdapter } from '@algomart/shared/adapters'
import { WireBankAccountModel } from '@algomart/shared/models'
import {
  SubmitWireBankAccountData,
  SubmitWireBankAccountQueue,
  UpdateWireBankAccountStatusQueue,
} from '@algomart/shared/queues'
import { invariant, userInvariant } from '@algomart/shared/utils'
import { UnrecoverableError } from 'bullmq'
import { Model } from 'objection'
import pino from 'pino'
import { v4 as uuid } from 'uuid'

export class WiresService {
  logger: pino.Logger<unknown>

  constructor(
    private readonly circle: CircleAdapter,
    private readonly submitWireBankAccountQueue: SubmitWireBankAccountQueue,
    private readonly updateWireBankAccountStatusQueue: UpdateWireBankAccountStatusQueue,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
  }

  // inserts a pending status wire bank account row and queues a job to submit the creation
  // request to circle
  async createBankAccount(
    user: UserAccount,
    payload: CreateWireBankAccountRequest
  ): Promise<IBANWireBankAccount> {
    const trx = await Model.startTransaction()
    let wireBankAccount
    try {
      // If default was selected, find any wire bank accounts currently marked as
      // the default and mark false
      if (payload.default === true) {
        await WireBankAccountModel.query(trx)
          .where({ ownerId: user.id })
          .andWhere('default', true)
          .patch({
            default: false,
          })
      }
      // known race condition:
      // if a user makes many simultaneous requests they can probably create a race condition
      // wherein multiple bank accounts are marked as the default. We are not concerned about
      // this enough to change this code. (payment-cards have this same issue fwiw)

      // insert a pending wire bank account row (will submit to circle in a job)
      wireBankAccount = await WireBankAccountModel.query(trx).insert({
        externalId: null,
        idempotencyKey: uuid(),
        fingerprint: null,
        trackingRef: null,
        description: null,
        accountNumber:
          (payload as CreateUSWireBankAccountRequest).accountNumber ?? null,
        routingNumber:
          (payload as CreateUSWireBankAccountRequest).routingNumber ?? null,
        iban: (payload as CreateIBANWireBankAccountRequest).iban ?? null,
        ownerId: user.id,
        default: payload.default,
        isSaved: payload.isSaved,
        billingDetails: payload.billingDetails,
        bankAddress: payload.bankAddress,
        status: CircleWireBankAccountStatus.Pending,
      } as WireBankAccountModel)

      await trx.commit()
    } catch (error) {
      this.logger.error(error)
      await trx.rollback()
      throw error
    }

    // queue a job to submit the creation request to circle
    try {
      await this.startSubmitWireBankAccount(wireBankAccount.id)
    } catch (error) {
      // If there's an error queueing the job, delete the bank account
      //
      // Note: unfortunately, if the request had default: true, this means any bank account that was
      // previously marked "default" will still be "false" and the user will be left without a default
      //
      // Another note: It's probably possible in theory that a job could be queued even if an exception
      // is caught. (some kind of connection issue after the job is queued but before bull-mq hears back
      // from redis) We are not currently handing this scenario and are not particularly worried about
      // it occurring
      this.logger.error(error)
      await this.deleteWireBankAccount(wireBankAccount.id)
      throw error
    }

    return wireBankAccount
  }

  // Should only be called internally as a part of error handling
  async deleteWireBankAccount(wireBankAccountId: string) {
    await WireBankAccountModel.query().deleteById(wireBankAccountId)
  }

  async startSubmitWireBankAccount(wireBankAccountId: string) {
    await this.submitWireBankAccountQueue.enqueue({ wireBankAccountId })
  }

  // invoked by submit-wire-bank-account bull-mq worker
  // (so may be retried)
  async submitWireBankAccountToCircle({
    wireBankAccountId,
  }: SubmitWireBankAccountData) {
    const wireBankAccount = await WireBankAccountModel.query().findById(
      wireBankAccountId
    )

    invariant(
      wireBankAccount,
      `No wire bank account found with provided ID: ${wireBankAccountId}`,
      UnrecoverableError
    )

    // this is not strictly necessary but short circuit to avoid unnecessary requests if
    // the status isn't pending
    if (wireBankAccount.status !== CircleWireBankAccountStatus.Pending) {
      return
    }

    const circleBankAccount = await this.circle.createWireBankAccount({
      idempotencyKey: wireBankAccount.idempotencyKey,
      billingDetails: wireBankAccount.billingDetails,
      bankAddress: wireBankAccount.bankAddress,
      ...(wireBankAccount.iban
        ? { iban: wireBankAccount.iban }
        : {
            accountNumber: wireBankAccount.accountNumber,
            routingNumber: wireBankAccount.routingNumber,
          }),
    } as CircleCreateWireBankAccountRequest)

    // If we were unable to communicate with circle, the method above would throw an error
    // (and a retry should eventually occur). If circle returns an explicit error response
    // (401, 404, etc), the method above returns null
    //
    // This will (usually) mean that the user has entered invalid information (e.g. bad
    // routing number), so, we delete the record from our database and throw an unrecoverable
    // error
    //
    // note: This mirrors the process implemented by the "create payment card" flow. We may
    // want to update the process at some point such that we surface the error information
    // in the response to the user. (E.g. invalid IBAN)
    if (circleBankAccount === null) {
      await this.deleteWireBankAccount(wireBankAccount.id)
    }
    invariant(
      circleBankAccount,
      'Unable to create circle bank account',
      UnrecoverableError
    )

    // If we've gotten this far, then the circle bank account was created successfully
    // Its status is (most likely) "Pending" and we'll be receiving a webhook notification
    // shortly with an updated status ("complete" or "failed")
    // The response does have some bank account details which we can fill in now
    // also, fwiw, if this function is being invoked as a retry, then status might be updated
    // already
    await WireBankAccountModel.query()
      .findById(wireBankAccount.id)
      .patch({
        externalId: circleBankAccount.id,
        description: circleBankAccount.description,
        fingerprint: circleBankAccount.fingerprint,
        trackingRef: circleBankAccount.trackingRef,
        status: circleBankAccount.status,
        riskEvaluation: circleBankAccount.riskEvaluation ?? null,
      })
  }

  async startUpdateWireBankAccountStatus(
    circleWireBankAccount: CircleWireBankAccount
  ) {
    await this.updateWireBankAccountStatusQueue.enqueue(circleWireBankAccount)
  }

  // invoked by update-wire-bank-account-status bull-mq worker
  // (so may be retried)!
  async updateWireBankAccountStatus(
    circleWireBankAccount: CircleWireBankAccount
  ) {
    const affectedRows = await WireBankAccountModel.query()
      .where({
        externalId: circleWireBankAccount.id,
      })
      .patch({
        status: circleWireBankAccount.status,
        riskEvaluation: circleWireBankAccount.riskEvaluation ?? null,
      })

    // Treating this as recoverable. Technically we might process a webhook before we've been able
    // to record the externalID, but we'd expect it to be recorded eventually, so a retry should
    // eventually find one
    invariant(
      affectedRows,
      `No wire bank account found with externalID: ${circleWireBankAccount.id}`
    )
  }

  async getWireBankAccountStatus(user: UserAccount, wireBankAccountId: string) {
    const wireBankAccount = await WireBankAccountModel.query()
      .findById(wireBankAccountId)
      .where('ownerId', user.id)

    userInvariant(wireBankAccount, 'wire bank account not found', 404)
    return { status: wireBankAccount.status }
  }

  async updateWireBankAccount(
    user: UserAccount,
    wireBankAccountId: string,
    patchData: PatchWireBankAccount
  ) {
    // Confirm bank account exists
    const wireBankAccount = await WireBankAccountModel.query()
      .findById(wireBankAccountId)
      .where({
        ownerId: user.id,
      })
    userInvariant(wireBankAccount, 'Wire bank account was not found', 404)

    const trx = await Model.startTransaction()
    try {
      if (patchData.default === true) {
        // Find any accounts marked as the default and mark false
        await WireBankAccountModel.query(trx)
          .where({ ownerId: user.id })
          .andWhere('default', true)
          .patch({
            default: false,
          })
      }

      // Note: If multiple queries for the same user are running at the same time,
      // multiple cards could be marked as the default. But this is both low consequence
      // and unlikely to occur

      // Update card as new default
      await WireBankAccountModel.query(trx)
        .where({
          id: wireBankAccountId,
          ownerId: user.id,
        })
        .patch({ default: patchData.default })

      await trx.commit()
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  async removeWireBankAccount(user: UserAccount, wireBankAccountId: string) {
    const affectedRows = await WireBankAccountModel.query()
      .where({
        ownerId: user.id,
        id: wireBankAccountId,
      })
      .patch({ isSaved: false })

    userInvariant(affectedRows, 'Wire bank account was not found', 404)
  }

  async getWireInstructionsForBankAccount(
    user: UserAccount,
    wireBankAccountId: string
  ) {
    const wireBankAccount = await WireBankAccountModel.query()
      .findById(wireBankAccountId)
      .where('ownerId', user.id)

    userInvariant(wireBankAccount, 'wire bank account not found', 404)
    userInvariant(
      wireBankAccount.status === CircleWireBankAccountStatus.Complete,
      'Bank account status is not "complete"',
      400
    )

    // Note: most circle calls are made by bull-mq workers, but this one isn't.
    // If we ever need to actually rate limit our circle calls, this code may need
    // to be updated
    const instructions = await this.circle.getWireInstructions(
      wireBankAccount.externalId
    )
    invariant(instructions, 'Circle refused to provide wire instructions')

    return instructions
  }

  async getSavedWireBankAccounts(user: UserAccount) {
    const wireBankAccounts = await WireBankAccountModel.query().where({
      isSaved: true,
      status: CircleWireBankAccountStatus.Complete,
      ownerId: user.id,
    })
    return wireBankAccounts
  }
}
