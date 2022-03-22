import {
  CirclePaymentErrorCode,
  CirclePaymentQueryType,
  CirclePaymentSourceType,
  CirclePaymentVerificationOptions,
  CreateBankAccount,
  CreateCard,
  CreatePayment,
  CreateTransferPayment,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  EventAction,
  EventEntityType,
  NotificationType,
  OwnerExternalId,
  PackType,
  PaymentBankAccountStatus,
  PaymentCardStatus,
  PaymentQuerystring,
  Payments,
  PaymentSortField,
  PaymentsQuerystring,
  PaymentStatus,
  SendBankAccountInstructions,
  SortDirection,
  ToPaymentBase,
  UpdatePayment,
  UpdatePaymentCard,
  UserAccount,
  WirePayment,
} from '@algomart/schemas'
import { CircleAdapter, CoinbaseAdapter } from '@algomart/shared/adapters'
import {
  BidModel,
  EventModel,
  PackModel,
  PaymentBankAccountModel,
  PaymentCardModel,
  PaymentModel,
  UserAccountModel,
} from '@algomart/shared/models'
import {
  convertFromUSD,
  convertToUSD,
  formatFloatToInt,
  formatIntToFloat,
  invariant,
  isGreaterThanOrEqual,
  poll,
  userInvariant,
} from '@algomart/shared/utils'
import { Configuration } from '@api/configuration'
import { logger } from '@api/configuration/logger'
import NotificationService from '@api/modules/notifications/notifications.service'
import PacksService from '@api/modules/packs/packs.service'
import { enc, SHA256 } from 'crypto-js'
import { Transaction } from 'objection'
import { v4 as uuid } from 'uuid'

export default class PaymentsService {
  logger = logger.child({ context: this.constructor.name })

  constructor(
    private readonly circle: CircleAdapter,
    private readonly coinbase: CoinbaseAdapter,
    private readonly notifications: NotificationService,
    private readonly packs: PacksService
  ) {}

  async getPublicKey() {
    try {
      const publicKey = await this.circle.getPublicKey()
      return publicKey
    } catch {
      return null
    }
  }

  async getPayments({
    locale = DEFAULT_LOCALE,
    page = 1,
    pageSize = 10,
    packId,
    packSlug,
    payerExternalId,
    payerUsername,
    sortBy = PaymentSortField.UpdatedAt,
    sortDirection = SortDirection.Ascending,
  }: PaymentsQuerystring): Promise<Payments> {
    let account: UserAccount
    userInvariant(page > 0, 'page must be greater than 0')
    userInvariant(
      pageSize > 0 || pageSize === -1,
      'pageSize must be greater than 0'
    )
    userInvariant(
      [
        PaymentSortField.UpdatedAt,
        PaymentSortField.CreatedAt,
        PaymentSortField.Status,
      ].includes(sortBy),
      'sortBy must be one of createdAt, updatedAt, or status'
    )
    userInvariant(
      [SortDirection.Ascending, SortDirection.Descending].includes(
        sortDirection
      ),
      'sortDirection must be one of asc or desc'
    )

    // Find payer
    const userIdentifier = payerExternalId || payerUsername
    const field = payerUsername ? 'username' : 'externalId'
    if (userIdentifier) {
      account = await UserAccountModel.query()
        .findOne(field, '=', userIdentifier)
        .select('id')
      userInvariant(account, 'user not found', 404)
    }

    const packIds = []
    const packLookup = new Map()

    // Add pack ID to packs array if available
    if (packId) {
      const packDetails = await this.packs.getPackById(packId)
      const { packs: packTemplates } = await this.packs.getPublishedPacks({
        templateIds: [packDetails.templateId],
      })
      const packTemplate = packTemplates.find(
        (t) => t.templateId === packDetails.templateId
      )
      if (packTemplate) {
        packIds.push(packId)
        packLookup.set(packId, {
          ...packTemplate,
          ...packDetails,
        })
      }
    }

    // Find packs and add pack IDs to array if available
    const packQuery: { locale?: string; slug?: string } = {}
    if (locale) packQuery.locale = locale
    if (packSlug) packQuery.slug = packSlug
    if (Object.keys(packQuery).length > 0) {
      const { packs: packTemplates } = await this.packs.getPublishedPacks(
        packQuery
      )
      const templateIds = packTemplates.map((p) => p.templateId)
      const templateLookup = new Map(
        packTemplates.map((p) => [p.templateId, p])
      )
      const packList = await PackModel.query()
        .whereIn('templateId', templateIds)
        .withGraphFetched('activeBid')
      packList.map((p) => {
        packIds.push(p.id)
        packLookup.set(p.id, {
          template: templateLookup.get(p.templateId),
          ...p,
          activeBid: p?.activeBid?.amount,
        })
      })
    }

    // Find payments in the database
    const query = PaymentModel.query()
    if (account?.id) query.where('payerId', '=', account.id)
    if (packIds && packIds.length > 0) {
      if (!account?.id) {
        query.whereIn('packId', packIds)
      } else {
        query.orWhereIn('packId', packIds)
      }
    }

    const { results, total } = await query
      .orderBy(sortBy, sortDirection)
      .page(page >= 1 ? page - 1 : page, pageSize)

    const payments = results.map((payment) => ({
      ...payment,
      pack: packLookup.get(payment.packId),
    }))

    return { payments, total }
  }

  async getCardStatus(cardId: string) {
    let externalId
    // Find card in database
    const foundCard = await PaymentCardModel.query().findById(cardId)

    // If a card was found, use the external ID. Otherwise check by passed in ID.
    if (foundCard) {
      userInvariant(
        foundCard.status !== PaymentCardStatus.Inactive,
        'card is not available',
        404
      )
      externalId = foundCard.externalId
    } else {
      externalId = cardId
    }

    // Retrieve record in Circle API
    const card = await this.circle.getPaymentCardById(externalId)
    userInvariant(card, 'card was not found', 404)

    return {
      status: card.status,
    }
  }

  async getCards(filters: OwnerExternalId) {
    // Find user by external ID
    userInvariant(filters.ownerExternalId, 'owner external ID is required', 400)
    const user: UserAccountModel | undefined = await UserAccountModel.query()
      .where('externalId', '=', filters.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    // Find cards in the database
    const cards = await PaymentCardModel.query()
      .where({ ownerId: user.id })
      .andWhereNot('status', PaymentCardStatus.Inactive)
    return cards
  }

  async getBankAccountStatus(bankAccountId: string) {
    // Find bank account in database
    const foundBankAccount = await PaymentBankAccountModel.query().findById(
      bankAccountId
    )

    userInvariant(foundBankAccount, 'bank account is not available', 404)
    const externalId = foundBankAccount.externalId

    // Retrieve record in Circle API
    const bankAccount = await this.circle.getPaymentBankAccountById(externalId)
    userInvariant(bankAccount, 'bank account was not found', 404)

    return {
      status: bankAccount.status,
    }
  }

  async getWireTransferInstructions(bankAccountId: string) {
    // Find bank account in database
    const foundBankAccount = await PaymentBankAccountModel.query().findById(
      bankAccountId
    )

    userInvariant(foundBankAccount, 'bank account is not available', 404)
    const externalId = foundBankAccount.externalId

    // Retrieve record in Circle API
    const bankAccount = await this.circle.getPaymentBankAccountInstructionsById(
      externalId
    )
    userInvariant(bankAccount, 'bank account instructions were not found', 404)

    return {
      ...bankAccount,
      amount: foundBankAccount.amount,
    }
  }

  async createCard(cardDetails: CreateCard, trx?: Transaction) {
    const user: UserAccountModel | undefined = await UserAccountModel.query(trx)
      .where('externalId', cardDetails.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    // Create card using Circle API
    const card = await this.circle
      .createPaymentCard({
        idempotencyKey: uuid(),
        keyId: cardDetails.keyId,
        encryptedData: cardDetails.encryptedData,
        billingDetails: cardDetails.billingDetails,
        expMonth: cardDetails.expirationMonth,
        expYear: cardDetails.expirationYear,
        metadata: cardDetails.metadata,
      })
      .catch(() => {
        return null
      })

    invariant(card, 'failed to create card')

    // Create new card in database
    if (cardDetails.saveCard && card) {
      // If default was selected, find any cards marked already as the default and mark false
      if (cardDetails.default === true) {
        await PaymentCardModel.query(trx)
          .where({ ownerId: user.id })
          .andWhere('default', true)
          .patch({
            default: false,
          })
      }
      // Circle may return the same card ID if there's duplicate info
      const newCard = await PaymentCardModel.query(trx)
        .insert({
          ...card,
          ownerId: user.id,
          default: cardDetails.default || false,
        })
        .onConflict('externalId')
        .ignore()
      if (!newCard) {
        return null
      }
      // Create events for card creation
      await EventModel.query(trx).insert({
        action: EventAction.Create,
        entityType: EventEntityType.PaymentCard,
        entityId: newCard.id,
        userAccountId: user.id,
      })

      // If the card was saved, return the card record from the database
      return newCard
    }

    // If card was not saved, return the identifier
    return { externalId: card.externalId, status: card.status }
  }

  async createBankAccount(bankDetails: CreateBankAccount, trx?: Transaction) {
    const user = await UserAccountModel.query(trx)
      .where('externalId', bankDetails.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    const { price, packId, priceInUSD } = await this.selectPackAndAssignToUser(
      bankDetails.packTemplateId,
      user.id,
      trx
    )

    // Create bank account using Circle API
    const bankAccount = await this.circle
      .createBankAccount({
        idempotencyKey: uuid(),
        accountNumber: bankDetails.accountNumber,
        routingNumber: bankDetails.routingNumber,
        billingDetails: bankDetails.billingDetails,
        bankAddress: bankDetails.bankAddress,
      })
      .catch((error) => {
        this.logger.error(error, 'failed to create bank account')
        return null
      })

    if (!bankAccount) {
      // Remove claim from payment if bank account creation doesn't work
      await this.packs.claimPack(
        {
          packId,
          claimedById: null,
          claimedAt: null,
        },
        trx
      )
      userInvariant(bankAccount, 'bank account could not be created', 400)
    }

    const newBankAccount = await PaymentBankAccountModel.query(trx)
      .insert({
        ...bankAccount,
        amount: price,
        ownerId: user.id,
      })
      .onConflict('externalId')
      .ignore()

    if (!newBankAccount) {
      userInvariant(bankAccount, 'bank account could not be added', 400)
    }

    // Create new payment in database
    const newPayment = await PaymentModel.query(trx).insert({
      externalId: null,
      payerId: user.id,
      packId: packId,
      paymentBankId: newBankAccount.id,
      paymentCardId: null,
      status: PaymentStatus.Pending,
    })

    // Create event for payment creation
    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.Payment,
      entityId: newPayment.id,
      userAccountId: user.id,
    })

    const bankAccountInstructions =
      await this.circle.getPaymentBankAccountInstructionsById(
        bankAccount.externalId
      )
    userInvariant(
      bankAccountInstructions,
      'bank account instructions were not found',
      404
    )

    // Create events for bank account creation
    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.PaymentBankAccount,
      entityId: newBankAccount.id,
      userAccountId: user.id,
    })

    if (Configuration.customerServiceEmail) {
      const packTemplate = await this.packs.getPackById(packId)
      await this.notifications.createNotification(
        {
          type: NotificationType.CSAwaitingWirePayment,
          userAccountId: user.id,
          variables: {
            packTitle: packTemplate.title,
            paymentId: newPayment.id,
            amount: priceInUSD,
          },
        },
        trx
      )
    }

    return { id: newBankAccount.id, status: bankAccount.status }
  }

  async updateCard(
    cardId: string,
    cardDetails: UpdatePaymentCard,
    trx?: Transaction
  ) {
    // Find user
    const user = await UserAccountModel.query(trx)
      .where('externalId', cardDetails.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    // Confirm card exists
    const card = await PaymentCardModel.query(trx).findById(cardId)
    userInvariant(card, 'card was not found', 404)

    if (cardDetails.default === true) {
      // Find any cards marked as the default and mark false
      await PaymentCardModel.query(trx)
        .where({ ownerId: user.id })
        .andWhere('default', true)
        .patch({
          default: false,
        })
    }

    // Update card as new default
    await PaymentCardModel.query(trx)
      .findById(cardId)
      .patch({ default: cardDetails.default })

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityType: EventEntityType.PaymentCard,
      entityId: cardId,
    })
  }

  async selectPackAndAssignToUser(
    packTemplateId: string,
    userId: string,
    trx?: Transaction
  ) {
    // Find random pack to award post-payment
    const randomPack = await this.packs.randomPackByTemplateId(
      packTemplateId,
      trx
    )
    userInvariant(randomPack?.id, 'no pack found', 404)

    // Check price is available
    const bid = randomPack.activeBidId
      ? await BidModel.query(trx)
          .select('amount')
          .findById(randomPack.activeBidId)
      : null

    const price =
      randomPack.type === PackType.Auction ? bid?.amount : randomPack.price
    userInvariant(price, 'pack must have a price')

    if (randomPack.type === PackType.Auction) {
      userInvariant(
        bid &&
          isGreaterThanOrEqual(
            bid.amount,
            randomPack.price,
            Configuration.currency // TODO: receive as argument
          ),
        'active bid must be higher than the price of the item'
      )
    }

    // Retrieve exchange rates for app currency and USD
    const exchangeRates = await this.coinbase.getExchangeRates({
      currency: Configuration.currency.code, // TODO: receive as argument
    })
    invariant(exchangeRates, 'unable to find exchange rates')

    // Convert price to USD for payment
    const amount = convertToUSD(
      price,
      exchangeRates.rates,
      Configuration.currency // TODO: receive as argument
    )
    invariant(amount !== null, 'unable to convert to currency')

    // Claim pack ASAP to ensure it's not claimed by someone else during this flow.
    // We'll later clear this out if the payment fails.
    await this.packs.claimPack(
      {
        packId: randomPack.id,
        claimedById: userId,
        claimedAt: new Date().toISOString(),
      },
      trx
    )

    return { price, priceInUSD: amount, packId: randomPack.id }
  }

  async createPayment(paymentDetails: CreatePayment, trx?: Transaction) {
    const user = await UserAccountModel.query(trx)
      .where('externalId', paymentDetails.payerExternalId)
      .first()

    userInvariant(user, 'user not found', 404)

    const { priceInUSD, packId } = await this.selectPackAndAssignToUser(
      paymentDetails.packTemplateId,
      user.id,
      trx
    )

    // If encrypted details are provided, add to request
    const encryptedDetails = {}
    const { keyId, encryptedData, cardId, metadata, description } =
      paymentDetails
    if (keyId) {
      Object.assign(encryptedDetails, { keyId })
    }

    if (encryptedData) {
      Object.assign(encryptedDetails, { encryptedData })
    }

    // Attempt to find card (cardId could be source or db ID)
    const card = await PaymentCardModel.query(trx).findById(cardId)

    // Circle only accepts loopback addresses
    const verificationHostname = Configuration.webUrl.includes('localhost')
      ? 'http://127.0.0.1:3000'
      : Configuration.webUrl

    // Base payment details
    const basePayment = {
      metadata: {
        ...metadata,
        sessionId: SHA256(user.id).toString(enc.Base64),
      },
      amount: {
        amount: priceInUSD,
        currency: DEFAULT_CURRENCY,
      },
      description,
      source: {
        id: card?.externalId || cardId,
        type: CirclePaymentSourceType.card,
      },
    }

    // Create 3DS payment
    const paymentResponse = await this.circle
      .createPayment({
        idempotencyKey: uuid(),
        ...basePayment,
        ...encryptedDetails,
        verification: CirclePaymentVerificationOptions.three_d_secure,
        verificationSuccessUrl: new URL(
          Configuration.successPath,
          verificationHostname
        ).toString(),
        verificationFailureUrl: new URL(
          Configuration.failurePath,
          verificationHostname
        ).toString(),
      })
      .catch(() => null)

    invariant(paymentResponse, 'unable to create 3DS payment')

    // Circle may return the same payment ID if there's duplicate info
    const newPayment = await PaymentModel.query(trx)
      .insert({
        externalId: paymentResponse.externalId,
        status: paymentResponse.status,
        error: paymentResponse.error,
        payerId: user.id,
        packId,
        paymentCardId: card?.id,
      })
      .onConflict('externalId')
      .ignore()

    invariant(newPayment, 'unable to create payment in database')

    // Search for payment status to confirm check is complete
    const completeWhenNotPendingForPayments = (payment: ToPaymentBase | null) =>
      !(payment?.status !== PaymentStatus.Pending)
    const foundPayment = await poll<ToPaymentBase | null>(
      async () =>
        await this.circle.getPaymentById(paymentResponse.externalId as string),
      completeWhenNotPendingForPayments,
      1000
    )
    invariant(foundPayment, 'unable to find payment')

    // Create event for payment creation
    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.Payment,
      entityId: newPayment.id,
      userAccountId: user.id,
    })

    if (
      foundPayment.status === PaymentStatus.Failed &&
      foundPayment.error === CirclePaymentErrorCode.three_d_secure_not_supported
    ) {
      // Create cvv payment with Circle if 3DS is not supported
      const cvvPayment = await this.circle
        .createPayment({
          idempotencyKey: uuid(),
          ...basePayment,
          ...encryptedDetails,
          verification: CirclePaymentVerificationOptions.cvv,
        })
        .catch(() => null)

      // Remove claim from payment if payment doesn't go through
      if (!cvvPayment) {
        await this.packs.revokePack(
          {
            packId,
            ownerId: user.id,
          },
          trx
        )
        return null
      }
      invariant(cvvPayment, 'unable to create cvv payment')

      // Update payment with new details
      const payment = await PaymentModel.query(trx).patchAndFetchById(
        newPayment.id,
        {
          externalId: cvvPayment.externalId,
          status: cvvPayment.status,
          error: cvvPayment.error,
        }
      )
      return payment
    }

    return newPayment
  }

  async findTransferByAddress(destinationAddress: string) {
    // Find merchant wallet
    const merchantWallet = await this.circle.getMerchantWallet()

    // Last 24 hours
    const newDate24HoursInPast = new Date(
      new Date().setDate(new Date().getDate() - 1)
    ).toISOString()

    // Find transfer by address in last 24 hours
    const searchParams = { from: newDate24HoursInPast.toString() }
    if (merchantWallet?.walletId)
      Object.assign(searchParams, {
        destinationWalletId: merchantWallet.walletId,
      })
    const transfer = await this.circle.getTransferForAddress(
      searchParams,
      destinationAddress
    )
    return transfer
  }

  async createTransferPayment(
    transferDetails: CreateTransferPayment,
    trx?: Transaction
  ) {
    const user = await UserAccountModel.query(trx)
      .where('externalId', transferDetails.payerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    userInvariant(transferDetails.transferId, 'transfer ID not provided', 400)

    const { packId, price } = await this.selectPackAndAssignToUser(
      transferDetails.packTemplateId,
      user.id,
      trx
    )

    // Find transfer
    const transfer = await this.circle.getTransferById(
      transferDetails.transferId
    )
    userInvariant(transfer, 'transfer not found', 404)

    // Retrieve exchange rates for app currency and USD
    const exchangeRates = await this.coinbase.getExchangeRates({
      currency: Configuration.currency.code, // TODO: receive as argument
    })
    invariant(exchangeRates, 'unable to find exchange rates')

    // Convert from USD to native currency integer
    const amount = convertFromUSD(
      transfer.amount,
      exchangeRates.rates,
      Configuration.currency // TODO: receive as argument
    )
    invariant(amount !== null, 'unable to convert to currency')
    const amountInt = formatFloatToInt(
      amount,
      Configuration.currency // TODO: receive as argument
    )

    // Check the payment amount is correct
    const isCorrectAmount = amountInt === price
    userInvariant(isCorrectAmount, 'incorrect amount was sent', 400)
    // @TODO: Handle situation better - send notification to user

    // Create new payment in database
    const newPayment = await PaymentModel.query(trx).insert({
      externalId: null,
      payerId: user.id,
      packId: packId,
      paymentCardId: null,
      paymentBankId: null,
      status: transfer?.status ? transfer.status : PaymentStatus.Pending,
      transferId: transfer?.externalId ? transfer.externalId : null,
      destinationAddress: transferDetails.destinationAddress,
    })
    userInvariant(newPayment, 'payment could not be created', 400)

    // Create event for payment creation
    await EventModel.query(trx).insert({
      action: EventAction.Create,
      entityType: EventEntityType.Payment,
      entityId: newPayment.id,
      userAccountId: user.id,
    })

    return newPayment
  }

  async generateAddress() {
    // Find the merchant wallet
    const merchantWallet = await this.circle.getMerchantWallet()
    userInvariant(merchantWallet, 'no wallet found', 404)
    // Create blockchain address
    const address = await this.circle.createBlockchainAddress({
      idempotencyKey: uuid(),
      walletId: merchantWallet.walletId,
    })
    userInvariant(address, 'wallet could not be created', 401)
    return address
  }

  async handleWirePayment(
    payment: PaymentModel,
    trx?: Transaction
  ): Promise<ToPaymentBase | null> {
    if (!payment.id || !payment.paymentBankId || !payment.packId) return null
    const payments = await this.searchAllWirePaymentsByBankId(
      payment.paymentBankId
    )
    if (!payments) return null

    // Retrieve exchange rates for app currency and USD
    const exchangeRates = await this.coinbase.getExchangeRates({
      currency: Configuration.currency.code, // TODO: receive as argument
    })
    invariant(exchangeRates, 'unable to find exchange rates')

    // Find bank account in database
    const foundBankAccount = await PaymentBankAccountModel.query().findById(
      payment.paymentBankId
    )
    userInvariant(foundBankAccount, 'bank account was not found', 404)

    // Find payment with matching source ID
    const sourcePayment = payments.find((currentPayment) => {
      // Convert price to USD for payment
      const amount = convertFromUSD(
        currentPayment.amount,
        exchangeRates.rates,
        Configuration.currency // TODO: receive as argument
      )
      invariant(amount !== null, 'unable to convert to currency')
      const amountInt = formatFloatToInt(
        amount,
        Configuration.currency // receive as argument
      )
      return amountInt === foundBankAccount.amount
    })
    if (!sourcePayment) return null

    // Update payment details
    if (payment.status !== sourcePayment.status || !payment.externalId) {
      await PaymentModel.query(trx).findById(payment.id).patch({
        externalId: sourcePayment.externalId,
        status: sourcePayment.status,
      })
      // Send Awaiting payment notification to customer service
      if (Configuration.customerServiceEmail) {
        const packTemplate = await this.packs.getPackById(payment.packId)
        await this.notifications.createNotification(
          {
            type: NotificationType.CSAwaitingWirePayment,
            userAccountId: payment.payerId,
            variables: {
              packTitle: packTemplate.title,
              amount: sourcePayment.amount,
            },
          },
          trx
        )
      }
    }

    // Send email notification to  Customer service
    if (Configuration.customerServiceEmail) {
      if (sourcePayment.status === PaymentStatus.Failed) {
        const packTemplate = await this.packs.getPackById(payment.packId)
        await this.notifications.createNotification(
          {
            type: NotificationType.CSWirePaymentFailed,
            userAccountId: payment.payerId,
            variables: {
              packTitle: packTemplate.title,
              amount: sourcePayment.amount,
            },
          },
          trx
        )
      } else if (sourcePayment.status === PaymentStatus.Paid) {
        const packTemplate = await this.packs.getPackById(payment.packId)
        await this.notifications.createNotification(
          {
            type: NotificationType.CSWirePaymentSuccess,
            userAccountId: payment.payerId,
            variables: {
              packTitle: packTemplate.title,
              amount: sourcePayment.amount,
            },
          },
          trx
        )
      }
    }

    // STATUS CHANGED
    if (
      payment.status !== sourcePayment.status && // Automated notifications to customer service
      Configuration.customerServiceEmail
    ) {
      if (sourcePayment.status === PaymentStatus.Failed) {
        const packTemplate = await this.packs.getPackById(payment.packId)
        await this.notifications.createNotification(
          {
            type: NotificationType.CSWirePaymentFailed,
            userAccountId: payment.payerId,
            variables: {
              packTitle: packTemplate.title,
              paymentId: payment.id,
              amount: sourcePayment.amount,
            },
          },
          trx
        )
      } else if (sourcePayment.status === PaymentStatus.Paid) {
        const packTemplate = await this.packs.getPackById(payment.packId)
        await this.notifications.createNotification(
          {
            type: NotificationType.CSWirePaymentSuccess,
            userAccountId: payment.payerId,
            variables: {
              packTitle: packTemplate.title,
              paymentId: payment.id,
              amount: sourcePayment.amount,
            },
          },
          trx
        )
      }
    }

    return sourcePayment
  }

  async searchAllWirePaymentsByBankId(
    bankAccountId: string
  ): Promise<WirePayment[]> {
    userInvariant(
      bankAccountId,
      'bank account identifier was not provided',
      400
    )
    // Find bank account in database
    const foundBankAccount = await PaymentBankAccountModel.query().findById(
      bankAccountId
    )
    userInvariant(foundBankAccount, 'bank account was not found', 404)

    // Get payments of wire type, since the date when the payment was created
    const dateCreated = new Date(foundBankAccount.createdAt).toISOString()
    const matchingPayments = await this.circle.getPayments({
      from: dateCreated.toString(),
      type: CirclePaymentQueryType.wire,
      source: foundBankAccount.externalId,
    })
    return matchingPayments || []
  }

  async getPaymentById(paymentId: string, args?: PaymentQuerystring) {
    const { isAdmin, isExternalId } = args
    // Find payment by ID or external ID
    const query = PaymentModel.query()
    if (isExternalId) {
      query.where({ externalId: paymentId })
    } else {
      query.findById(paymentId)
    }

    // Search for matching payment
    const payment = await query
      .withGraphFetched('payer')
      .withGraphFetched('pack')
      .first()
    userInvariant(payment, 'payment not found', 404)

    // If admin, return additional pack details
    if (isAdmin) {
      const pack = payment.pack
      invariant(pack?.templateId, 'pack template not found')
      const { packs: packTemplates } = await this.packs.getPublishedPacks({
        templateIds: [pack.templateId],
      })
      const packTemplate = packTemplates[0]
      return {
        ...payment,
        pack: {
          ...pack,
          template: packTemplate,
        },
      }
    }
    return payment
  }

  async updatePayment(
    paymentId: string,
    updatedDetails: UpdatePayment,
    trx?: Transaction
  ) {
    const payment = await PaymentModel.query(trx).findById(paymentId)
    userInvariant(payment, 'payment not found', 404)

    // Update payment with new details
    await PaymentModel.query(trx).findById(paymentId).patch(updatedDetails)

    await EventModel.query(trx).insert({
      action: EventAction.Update,
      entityType: EventEntityType.Payment,
      entityId: paymentId,
    })

    return payment
  }

  async removeCardById(cardId: string, trx?: Transaction) {
    // Confirm card exists
    const card = await PaymentCardModel.query(trx).findById(cardId)
    userInvariant(card, 'card was not found', 404)

    // Remove card
    await PaymentCardModel.query(trx)
      .findById(cardId)
      .patch({ status: PaymentCardStatus.Inactive })

    await EventModel.query(trx).insert({
      action: EventAction.Delete,
      entityType: EventEntityType.PaymentCard,
      entityId: cardId,
    })
  }

  async sendWireInstructions(
    details: SendBankAccountInstructions,
    trx?: Transaction
  ) {
    const user = await UserAccountModel.query(trx)
      .where('externalId', details.ownerExternalId)
      .first()
    userInvariant(user, 'no user found', 404)

    // Find bank account in database
    const foundBankAccount = await PaymentBankAccountModel.query().findById(
      details.bankAccountId
    )
    userInvariant(foundBankAccount, 'bank account is not available', 404)

    // Get wire instructions
    const bankAccountInstructions = await this.getWireTransferInstructions(
      details.bankAccountId
    )
    userInvariant(
      bankAccountInstructions,
      'bank account instructions were not found',
      404
    )

    const payment = await PaymentModel.query().findOne({
      paymentBankId: details.bankAccountId,
    })
    userInvariant(
      payment && payment.packId,
      'associated payment was not found',
      404
    )

    // Get pack template details
    const packTemplate = await this.packs.getPackById(payment.packId)
    userInvariant(packTemplate, 'pack template was not found', 404)

    // Send bank account instructions to user
    await this.notifications.createNotification(
      {
        type: NotificationType.WireInstructions,
        userAccountId: user.id,
        variables: {
          amount: formatIntToFloat(
            foundBankAccount.amount,
            Configuration.currency // TODO: receive as argument
          ),
          packTitle: packTemplate.title,
          packSlug: packTemplate.slug,
          trackingRef: bankAccountInstructions.trackingRef,
          beneficiaryName: bankAccountInstructions.beneficiary.name,
          beneficiaryAddress1: bankAccountInstructions.beneficiary.address1,
          beneficiaryAddress2: bankAccountInstructions.beneficiary.address2,
          beneficiaryBankName:
            bankAccountInstructions.beneficiaryBank.name || '',
          beneficiaryBankSwiftCode:
            bankAccountInstructions.beneficiaryBank.swiftCode || '',
          beneficiaryBankRoutingNumber:
            bankAccountInstructions.beneficiaryBank.routingNumber,
          beneficiaryBankAccountingNumber:
            bankAccountInstructions.beneficiaryBank.accountNumber,
          beneficiaryBankAddress:
            bankAccountInstructions.beneficiaryBank.address || '',
          beneficiaryBankCity:
            bankAccountInstructions.beneficiaryBank.city || '',
          beneficiaryBankPostalCode:
            bankAccountInstructions.beneficiaryBank.postalCode || '',
          beneficiaryBankCountry:
            bankAccountInstructions.beneficiaryBank.country || '',
        },
      },
      trx
    )

    return true
  }

  async updatePaymentStatuses(trx?: Transaction) {
    const pendingPayments = await PaymentModel.query(trx)
      // Pending, Confirmed, and ActionRequired are non-final statuses
      .whereIn('status', [
        PaymentStatus.Pending,
        PaymentStatus.ActionRequired,
        PaymentStatus.Confirmed,
      ])
      // Prioritize pending payments
      .orderBy('status', 'desc')
      .limit(10)

    if (pendingPayments.length === 0) return 0
    let updatedPayments = 0

    await Promise.all(
      pendingPayments.map(async (payment) => {
        let status: PaymentStatus | undefined

        // Card flow
        if (payment.externalId) {
          const circlePayment = await this.circle.getPaymentById(
            payment.externalId
          )
          invariant(
            circlePayment,
            `external payment ${payment.externalId} not found`
          )

          if (payment.status !== circlePayment.status) {
            await PaymentModel.query(trx).patchAndFetchById(payment.id, {
              status: circlePayment.status,
              action: circlePayment.action,
              error: circlePayment.error,
            })
            if (circlePayment.status === PaymentStatus.Failed) {
              await this.packs.revokePack(
                {
                  packId: payment.packId,
                  ownerId: payment.payerId,
                },
                trx
              )
            }
            status = circlePayment.status
            updatedPayments++
          }
        }
        // Wire transfer flow
        else if (payment.paymentBankId) {
          const wirePayment = await this.handleWirePayment(payment, trx)
          if (wirePayment) {
            status = wirePayment.status
            updatedPayments++
          }
        }
        // Crypto flow
        else if (payment.destinationAddress) {
          const transfer = payment.transferId
            ? await this.circle.getTransferById(payment.transferId)
            : await this.findTransferByAddress(payment.destinationAddress)
          if (
            transfer &&
            (payment.status !== transfer.status || !payment.transferId)
          ) {
            await PaymentModel.query(trx).patchAndFetchById(payment.id, {
              status: transfer.status,
              transferId: transfer.externalId,
            })
            status = transfer.status
            updatedPayments++
          }
        }

        // If the new payment status is resolved as Paid:
        if (status === PaymentStatus.Paid && payment.packId) {
          const packTemplate = await this.packs.getPackById(payment.packId)
          await this.notifications.createNotification(
            {
              type: NotificationType.PaymentSuccess,
              userAccountId: payment.payerId,
              variables: {
                packTitle: packTemplate.title,
              },
            },
            trx
          )
        }
        // If the new payment status is resolved as Failed:
        if (status === PaymentStatus.Failed) {
          const packTemplate = await this.packs.getPackById(payment.packId)
          await this.notifications.createNotification(
            {
              type: NotificationType.PaymentFailed,
              userAccountId: payment.payerId,
              variables: {
                packTitle: packTemplate.title,
              },
            },
            trx
          )
        }
      })
    )

    return updatedPayments
  }

  async updatePaymentBankStatuses(trx?: Transaction) {
    const pendingPaymentBanks = await PaymentBankAccountModel.query(trx)
      .where('status', PaymentBankAccountStatus.Pending)
      .limit(10)

    if (pendingPaymentBanks.length === 0) return 0
    let updatedPaymentCards = 0

    await Promise.all(
      pendingPaymentBanks.map(async (bank) => {
        const circleBankAccount = await this.circle.getPaymentBankAccountById(
          bank.externalId
        )
        invariant(
          circleBankAccount,
          `external bank account ${bank.externalId} not found`
        )

        if (bank.status !== circleBankAccount.status) {
          await PaymentBankAccountModel.query(trx).patchAndFetchById(bank.id, {
            status: circleBankAccount.status,
          })
          updatedPaymentCards++
        }
      })
    )

    return updatedPaymentCards
  }

  async updatePaymentCardStatuses(trx?: Transaction) {
    const pendingPaymentCards = await PaymentCardModel.query(trx)
      .where('status', PaymentCardStatus.Pending)
      .limit(10)

    if (pendingPaymentCards.length === 0) return 0
    let updatedPaymentCards = 0

    await Promise.all(
      pendingPaymentCards.map(async (paymentCard) => {
        const circlePaymentCard = await this.circle.getPaymentCardById(
          paymentCard.externalId
        )
        invariant(
          circlePaymentCard,
          `external payment card ${paymentCard.externalId} not found`
        )

        if (paymentCard.status !== circlePaymentCard.status) {
          await PaymentCardModel.query(trx).patchAndFetchById(paymentCard.id, {
            status: circlePaymentCard.status,
          })
          updatedPaymentCards++
        }
      })
    )

    return updatedPaymentCards
  }

  async getCurrency() {
    return Configuration.currency
  }
}
