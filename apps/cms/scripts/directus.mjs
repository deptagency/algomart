import { Directus } from '@directus/sdk'

export async function configureDirectus() {
  const client = new Directus(process.env.PUBLIC_URL)

  await client.auth.login({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  })

  return client
}
