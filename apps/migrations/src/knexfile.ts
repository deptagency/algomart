import 'dotenv/config'
import { Knex } from 'knex'
import path from 'node:path'

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    extension: 'ts',
    directory: path.join(__dirname, 'migrations'),
  },
}

export default config
