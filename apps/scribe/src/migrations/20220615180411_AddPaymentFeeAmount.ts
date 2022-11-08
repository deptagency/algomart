import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.bigInteger('amount').defaultTo(0).notNullable()
    table.bigInteger('fees').defaultTo(0).notNullable()
    table.bigInteger('total').defaultTo(0).notNullable()
  })

  // Based on the current implementation of `calculateCreditCardFees`
  // amount is set to payload.amount, with fallback to 0
  // fee is set in two stages, first based on the amount * 2.9% + ¢30 (3.9% for non-US)
  // then an additional fee amount is added based on the initial fee
  // finally, total is the sum of amount and fees
  //
  // For crypto payments, amount is just copied over from UserAccountTransfer
  await knex.raw(`
    -- Set amount from payload for card payments
    UPDATE "Payment"
    SET "amount" = coalesce(("payload"->>'amount')::bigint, 0)
    WHERE "payload" IS NOT NULL
      AND "paymentCardId" IS NOT NULL;

    -- Set amount from transfer for crypto payments
    UPDATE "Payment" p
    SET "amount" = t."amount"
    FROM "UserAccountTransfer" t
    WHERE p."id" = t."entityId"
      AND t."entityType" = 'payment';

    -- Set base fee for card payments (no fee for crypto payments)
    UPDATE "Payment" p
    SET "fees" = "amount" * (CASE c."countryCode" WHEN 'US' THEN 0.029 ELSE 0.039 END) + (CASE "amount" WHEN 0 THEN 0 ELSE 30 END)
    FROM "PaymentCard" c
    WHERE p."payload" IS NOT NULL
      AND p."paymentCardId" = c."id";

    -- Add delta fee for card payments
    UPDATE "Payment" p
    SET "fees" = "fees" + "fees" * (CASE c."countryCode" WHEN 'US' THEN 0.029 ELSE 0.039 END)
    FROM "PaymentCard" c
    WHERE p."payload" IS NOT NULL
      AND p."paymentCardId" = c."id";

    -- Set total
    UPDATE "Payment" SET "total" = "amount" + "fees";
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('Payment', (table) => {
    table.dropColumns('amount', 'fees', 'total')
  })
}
