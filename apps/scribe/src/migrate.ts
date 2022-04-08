import Knex from 'knex'
import config from './configuration/knex-config'

type KnexMigrationCommand =
  | 'up'
  | 'latest'
  | 'make'
  | 'down'
  | 'rollback'
  | 'list'
  | 'status'
  | 'currentVersion'

async function main(argv: string[]) {
  const knex = Knex(config())

  try {
    const command = argv[2] as KnexMigrationCommand
    console.log(`knex migrate:${command}`, ...argv.slice(3))
    let result: unknown

    switch (command) {
      case 'up':
        result = await knex.migrate.up()
        break
      case 'down':
        result = await knex.migrate.down()
        break
      case 'latest':
        result = await knex.migrate.latest()
        break
      case 'rollback':
        result = await knex.migrate.rollback()
        break
      case 'make':
        result = await knex.migrate.make(argv[3])
        break
      case 'list':
        result = await knex.migrate.list()
        break
      case 'status':
        result = await knex.migrate.status()
        break
      case 'currentVersion':
        result = await knex.migrate.currentVersion()
        break
    }

    console.log(result)
  } catch (error) {
    console.error(error)
  } finally {
    await knex.destroy()
  }
}

main(process.argv)
