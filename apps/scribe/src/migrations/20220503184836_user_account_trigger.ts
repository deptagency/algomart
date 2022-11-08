import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // When a transfer completes, update the new balance on the transfer and on the userAccount
  await knex.schema.raw(`
    CREATE FUNCTION update_account_balance() RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF OLD.status <> 'complete' AND NEW.status = 'complete' THEN
          NEW.balance = NEW.amount + (SELECT balance from "UserAccount" where id = NEW."userAccountId");
          UPDATE "UserAccount" SET balance = NEW.balance WHERE id = NEW."userAccountId";
        END IF;
        RETURN NEW;
      END
      $$;
  `)

  // Trigger to call the above function before an update on the UserAccountTransfer table
  await knex.schema.raw(`
    CREATE TRIGGER user_account_balance_update BEFORE UPDATE ON "UserAccountTransfer"
      FOR EACH ROW EXECUTE FUNCTION update_account_balance()
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    DROP TRIGGER user_account_balance_update on "UserAccountTransfer"
  `)
  await knex.schema.raw(`
    DROP FUNCTION update_account_balance()
  `)
}
