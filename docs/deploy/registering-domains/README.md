    - Google Webmaster Central property ownership
      - CNAME record setup
      - Adding the service account as an owner
      - CNAME records for each subdomain

---

While domain mapping is a simple and clean way to assign custom domain names
to each Cloud Run service, complete with SSL certs, etc,
it is still a beta offering and
[is not available](https://cloud.google.com/run/docs/mapping-custom-domains#limitations)
in most regions.

If you want to set up a project in an unsupported region (or you want more control
over the proxy), you will need to
[set up load balancers](https://cloud.google.com/load-balancing/docs/https/setting-up-https-serverless)
manually.

---

This setup assumes
[domain mapping](https://cloud.google.com/run/docs/mapping-custom-domains)
will be used to assign custom host names to the Cloud Run services.
If load balancers [need to be](#explicit-load-balancers) set up, then the DNS setup will differ.

No matter what registrar was used to register your custom domain,
the service account that Terraform uses needs to be a **verified owner**
of the domain via Google Webmaster.

[verified owner of the domain](https://cloud.google.com/run/docs/mapping-custom-domains#adding_verified_domain_owners_to_other_users_or_service_accounts)

using the email address generated during service account creation.
This email can be found in either the "IAM -> Service Accounts" dashboard or
under the `client_email` property of the service account JSON key.

We need to create 3 different CNAME records.
With Cloud Run domain mapping, they'll all point to the same location.
For custom load balancers, you'll need to use their IP addresses instead.

For instance, assuming we want the services mapped to the following host names...

| Service |              Host name |
| ------- | ---------------------: |
| API     | `api.nfty.example.com` |
| CMS     | `cms.nfty.example.com` |
| Web     |     `nfty.example.com` |

... then we'll want CNAME records for all three of those host names mapped to `ghs.googlehosted.com.` (note the trailing period).

> ![CNAME records](./docs/cname-records.png)

The Cloud Run domain mapping resource templates will do the rest of the work
to associate the services with their respectiving mappings.

> Note: The CNAME records can be created either before or after the Cloud Run services
> are set up. Domain mapping via terraform will be 'successful' in either case,
> but the custom domain resources in Cloud Run will not work until the records
> are created.
