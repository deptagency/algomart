The API was deployed with a `CMS_ACCESS_TOKEN` environment variable,
and the CMS should have an initial admin user created from the
`ADMIN_EMAIL` and `ADMIN_PASSWORD` variables during the initial deploy.

Now we need to log into the CMS websitem, visit the User Directory,
and click the empty thumbnail for the newly-created user.

> ![user directory](./images/cms-admin-key-01.png)

Next, we need to copy the value of the `CMS_ACCESS_TOKEN` API environment variable,
paste it into the "Token" field, and click the green checkmark to save.

> ![user directory](./images/cms-admin-key-02.png)

Assigning the token to this user allows the API to make authenticated and authorized
requests against the CMS.
Without this step, API background tasks that look for pack templates, etc. will fail
to run, meaning we cannot create assets on the blockchain.
