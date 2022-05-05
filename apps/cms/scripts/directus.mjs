import { Directus } from '@directus/sdk'

export async function setupSDK(config) {
  const directus = new Directus(process.env.PUBLIC_URL);

  // But, we need to authenticate if data is private
  let authenticated = false;

  // Try to authenticate with token if exists
  await directus.auth
    .refresh()
    .then(() => {
      authenticated = true;
    })
    .catch(() => { });

  // Let's login in case we don't have token or it is invalid / expired
  while (!authenticated) {
    await directus.auth
      .login(config)
      .then(() => {
        authenticated = true;
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  }

  return directus
}

export async function setAccessToken(directus) {
  const me = await directus.users.me.read();

  await directus.users.updateOne(me.id, {
    token: process.env.ADMIN_ACCESS_TOKEN,
  });
}

export async function setFilePermission(directus) {
  const permissions = (await directus.items('directus_permissions').readByQuery({
    filter: {
      collection: {
        _eq: 'directus_files'
      }
    }
  })).data[0];

  if (permissions === undefined) {
    await directus.items('directus_permissions').createOne({
      role: null,
      collection: 'directus_files',
      action: 'read',
      permissions: {},
      validation: {},
      presets: null,
      fields: ['*']
    })
  } else {
    await directus.items('directus_permissions').updateOne(permissions.id, {
      role: null,
      collection: 'directus_files',
      action: 'read',
      permissions: {},
      validation: {},
      presets: null,
      fields: ['*']
    })
  }
}
