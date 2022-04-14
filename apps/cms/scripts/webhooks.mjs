#!/usr/bin/env node

export async function setupWebhooks(directus, name, url, collections) {
  console.log('- Webhooks')

  if (!url) {
    console.warn('No url provided for webhook, skipping webhooks setup')
    return
  }

  const { data: data } = await directus.items('directus_webhooks').readByQuery({
    filter: {
      url: {
        _eq: url,
      },
    },
  });

  const webhook = data[0];
  if (webhook === undefined) {
    await directus.items('directus_webhooks').createOne({
      name: name,
      method: 'POST',
      url: url,
      status: 'active',
      actions: ['create', 'update', 'delete'],
      collections: collections,
      headers: null
    });
  } else {
    await directus.items('directus_webhooks').updateOne(webhook.id, {
      name: name,
      method: 'POST',
      url: url,
      status: 'active',
      actions: ['create', 'update', 'delete'],
      collections: collections,
      headers: null
    });
  }
}
