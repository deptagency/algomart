# Configuring Firebase

Firebase is used to configure authentication in the front-end app,
allowing users a plethora of options for logging in to our app
and creating accounts.

Now that we have a GCP project and custom domains set up,
we can fully configure Firebase, which will give us several things:

- A publicly-viewable "config" object for our client-side web app
- Another service account for server-side auth middleware

For this tutorial, we assume that we want to offer users several strategies for signing on...

- Email & password signup
- Google SSO

... but you are free to choose your own sign-on strategies.

## Table of Contents

- [Initialize Firebase](#initializing-firebase)
- [Set up authentication](#set-up-authentication)
- [Enable storage](#enable-storage)
- [Configure the web app](#configure-the-web-app)

## Initializing Firebase

Visit console.firebase.google.com to get started.
We will want to select "Add project".

> ![new instance](./images/01-add-project.png)

Next, search for and select the name of the GCP project we
[previously created](../configure-gcp/README.md#create-the-project)
and click "Continue".

> ![find project](./images/02-select.png)

> ![continue project](./images/03-confirm.png)

Take note of the "a few things to remember" -
especially the warning that **if you delete your Firebase project,
it will delete the associated GCP project**.
Then click "Continue".

> ![warnings](./images/04-continue.png)

Now decide on whether or not you want to enable analytics
and click "Continue".

> ![enable analytics](./images/05-analytics.png)

## Set up authentication

From the project overview, select "Authentication" from the
sidebar menu.

> ![select authentication](./images/06-overview.png)

Then click "Get started" to... get started.

> ![get started](./images/07-authentication.png)

Next, select "Email/Password".

> ![select email & password](./images/08-get-started.png)

We will choose not to allow password-less sign-on,
but feel free to do so.
Select "Enable" and then click "Save".

> ![save email & password](./images/09-email-password.png)

To add another strategy, for instance Google SSO,
select "Add new provider" and follow the instructions.

> ![add another provider](./images/10-add-new.png)

When you are done configuring log-in options,
now add the same domain used for the web front-end
when [configuring DNS for domain-mapping(../registering-domains/README.md)
as an authorized domain.

Following the previous tutorial, we would click "Add domain",
fill in dev.example.com, and click "Add".

> ![add authorized domain](./images/11-auth-domain.png)

## Enable storage

Next we need to configure storage rules.
In the sidebar menu, select "Storage" and then
click "Get started".

> ![storage get started](./images/12-storage.png)

We cannot alter the rules here, so just click "Next".

> ![next modal](./images/13-storage-next.png)

Now select a region for storage and click "Done".
It probably makes sense to select the same region that your
base GCP project is in.

> ![select region](./images/14-storage-location.png)

Next, select the "Rules" tab.

> ![select rules](./images/15-storage-overview.png)

Now copy the following rules...

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /assets {
      allow read, write;
      match /{allPaths=**} {
        // Allow access by all users
        allow read, write;
      }
    }
	match /users/{uid}/{profileImage} {
      allow read, write;
    }
  }
}
```

... and paste into the editor field and click "Publish".

> ![publish rules](./images/16-storage-rules.png)

## Configure the web app

In the sidebar menu, select "Project settings".

> ![select project settings](./images/17-select-settings.png)

Scroll to the bottom of the page and select the "</>" button
to configure a new web app.

> ![add web app](./images/18-your-apps.png)

Add a nickname for the web app and select "Register app".

> ![register app](./images/19-add-web.png)

Next, copy the highlighted public, client-side config object
and save somewhere - we will need this later when configuring Github Secrets.

After saving the configuration details, select "Continue to console".

> ![copy config](./images/20-config.png)

Once more, go into "Project settings", select the
"Service accounts" tab, and then click
"Generate new private key".

> ![generate private key](./images/21-generate-service-account.png)

Click "Generate key" and then save the resulting JSON somewhere -
we'll need this as well when configuring Github Secrets.

> ![save private key](./images/22-save-key.png)

If you then visit console.cloud.google.com and click through
to "IAM & Admin -> Service Accounts" you should see a new
service account linked to Firebase.

> ![firebase service account](./images/23-service-accounts.png)
