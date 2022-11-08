import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandTransaction', (table) => {
    table.index('groupId')
  })
  await knex.schema.alterTable('Bid', (table) => {
    table.index('packId')
    table.index('userAccountId')
  })
  await knex.schema.alterTable('Collectible', (table) => {
    table.index('latestTransferTransactionId')
    table.index('ownerId')
    table.index('packId')
  })
  await knex.schema.alterTable('CollectibleAuction', (table) => {
    table.index('collectibleId')
    table.index('transactionId')
    table.index('userAccountId')
  })
  await knex.schema.alterTable('CollectibleAuctionBid', (table) => {
    table.index('collectibleAuctionId')
    table.index('transactionId')
    table.index('userAccountId')
  })
  await knex.schema.alterTable('CollectibleOwnership', (table) => {
    table.unique(['collectibleId', 'ownerId'])
  })
  await knex.schema.alterTable('CollectibleShowcase', (table) => {
    table.unique(['collectibleId', 'ownerId'])
  })
  await knex.schema.alterTable('Event', (table) => {
    table.index('userAccountId')
  })
  await knex.schema.alterTable('Notification', (table) => {
    table.index('userAccountId')
  })
  await knex.schema.alterTable('Pack', (table) => {
    table.index('activeBidId')
    table.index('ownerId')
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.index('packId')
    table.index('payerId')
    table.index('paymentBankId')
    table.index('paymentCardId')
  })
  await knex.schema.alterTable('PaymentBankAccount', (table) => {
    table.index('ownerId')
  })
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.index('ownerId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('AlgorandTransaction', (table) => {
    table.dropIndex('groupId')
  })
  await knex.schema.alterTable('Bid', (table) => {
    table.dropIndex('packId')
    table.dropIndex('userAccountId')
  })
  await knex.schema.alterTable('Collectible', (table) => {
    table.dropIndex('latestTransferTransactionId')
    table.dropIndex('ownerId')
    table.dropIndex('packId')
  })
  await knex.schema.alterTable('CollectibleAuction', (table) => {
    table.dropIndex('collectibleId')
    table.dropIndex('transactionId')
    table.dropIndex('userAccountId')
  })
  await knex.schema.alterTable('CollectibleAuctionBid', (table) => {
    table.dropIndex('collectibleAuctionId')
    table.dropIndex('transactionId')
    table.dropIndex('userAccountId')
  })
  await knex.schema.alterTable('CollectibleOwnership', (table) => {
    table.dropUnique(['ownerId', 'collectibleId'])
  })
  await knex.schema.alterTable('CollectibleShowcase', (table) => {
    table.dropUnique(['ownerId', 'collectibleId'])
  })
  await knex.schema.alterTable('Event', (table) => {
    table.dropIndex('userAccountId')
  })
  await knex.schema.alterTable('Notification', (table) => {
    table.dropIndex('userAccountId')
  })
  await knex.schema.alterTable('Pack', (table) => {
    table.dropIndex('activeBidId')
    table.dropIndex('ownerId')
  })
  await knex.schema.alterTable('Payment', (table) => {
    table.dropIndex('packId')
    table.dropIndex('payerId')
    table.dropIndex('paymentBankId')
    table.dropIndex('paymentCardId')
  })
  await knex.schema.alterTable('PaymentBankAccount', (table) => {
    table.dropIndex('ownerId')
  })
  await knex.schema.alterTable('PaymentCard', (table) => {
    table.dropIndex('ownerId')
  })
}
