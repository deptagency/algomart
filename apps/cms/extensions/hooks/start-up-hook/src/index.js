import { spawn } from 'node:child_process'

export default ({ init }, { services, getSchema, database: knex }) => {
	const { UsersService, ActivityService } = services

	init('app.after', async () => {
    const schema = await getSchema();

    await configureAdminUser(schema)
    await seedApplication(schema)
	})

  async function configureAdminUser(schema) {
		const usersService = new UsersService({
			database: knex,
			schema: schema,
			accountability: { admin: true }
		})

		const adminUser = await usersService.readByQuery({
			filter: {
				_and: [
					{ email: { _eq: process.env.ADMIN_EMAIL } }
				],
			},
		})

		if (adminUser && adminUser.length > 0) {
			await knex('directus_users').where({ id: adminUser[0].id }).update({ token: process.env.CMS_ACCESS_TOKEN })
		}
		else {
			console.error('The default admin user does not exist!!')
		}
  }

  /**
   * Checks if dev environment
   *
   * If so, does logical check to see if the database has any data in it yet
   * If it doesn't, runs seeder which prompts user if they wish to continue seeding
   * @param {*} schema
   * @returns void
   */
  async function seedApplication(schema) {
    if (!process.env.PUBLIC_URL.includes('http://localhost')) {
      return
    }

    const activityService = new ActivityService({
      database: knex,
      schema: schema,
      accountability: { admin: true }
    })
    const activity = await activityService.readByQuery({
      filter: {
        collection: {
          _ncontains: 'directus_'
        }
      }
    })

    if (!activity || activity.length === 0) {
      const seeder = spawn(
        'npm',
        ['run', 'seed'],
        {
          stdio: 'inherit',
        }
      )

      process.on('SIGTERM', () => {
        console.log('SIGTERM')
        seeder.kill()
        process.exit(128 + 15)
      })

      process.on('exit', (code) => {
        console.log('exit')
        process.exit(code)
      })

      seeder.on('error', (error) => {
        console.log(error)
      })

      seeder.on('exit', (code) => {
        const exitMessage = `seeder exited with code: ${code}`
        if (code === 0) {
          console.log(exitMessage)
        } else {
          console.warn(exitMessage)
        }
      })
    } else {
      console.log('Directus activity found, not prompting for seed.')
    }
  }
}
