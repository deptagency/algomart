import {} from '@algomart/schemas'
import { HttpResponse, HttpTransport } from '@algomart/shared/utils'
import pino from 'pino'

interface VaultAdapterOptions {
  address: string
  transitPath: string
  encryptionKeyName: string
  gcpServiceAccountEmail: string
  gcpAuthRoleName: string
}

export class VaultAdapter {
  http: HttpTransport
  logger: pino.Logger<unknown>

  constructor(
    readonly options: VaultAdapterOptions,
    logger: pino.Logger<unknown>
  ) {
    this.logger = logger.child({ context: this.constructor.name })
    this.http = new HttpTransport()
  }

  // Retrieve JWT from GCP to exchange for a vault token
  // If we need to interact with GCP more in the future we could make a gcp-adapter
  async getJwtFromGcp(): Promise<string> {
    const metadataEndpoint = `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/${this.options.gcpServiceAccountEmail}/identity`
    const reply: HttpResponse<string> = await this.http.get(metadataEndpoint, {
      headers: { 'Metadata-Flavor': 'Google' },
      params: {
        audience: `vault/${this.options.gcpAuthRoleName}`,
        format: 'full',
      },
    })
    const jwt = reply.data
    return jwt
  }

  // TODO: this currently always makes 2 network requests.
  // one to GCP to get a JWT and then one to Vault to get a vault token
  // The GCP JWT's actually don't expire for an hour though, so we could
  // add some caching/refresh logic here to speed things up in the future
  async getVaultToken(): Promise<string> {
    const jwt = await this.getJwtFromGcp()
    const reply: HttpResponse<{ auth: { client_token: string } }> =
      await this.http.post(`${this.options.address}v1/auth/gcp/login`, {
        role: this.options.gcpAuthRoleName,
        jwt,
      })
    const token = reply.data.auth.client_token
    return token
  }

  // the arrow function syntax here is because we need to pass these
  // functions around as parameters without loosing "this"
  encryptMnemonic = async (mnemonic: string) => {
    const token = await this.getVaultToken()
    const response: HttpResponse<{
      data: { ciphertext: string; key_version: number }
    }> = await this.http.post(
      `${this.options.address}${this.options.transitPath}encrypt/${this.options.encryptionKeyName}`,
      { plaintext: Buffer.from(mnemonic).toString('base64') },
      { headers: { 'X-Vault-Token': token } }
    )
    const encrypted = response.data.data.ciphertext
    return encrypted
  }

  decryptMnemonic = async (encryptedMnemonic: string) => {
    const token = await this.getVaultToken()
    const response: HttpResponse<{
      data: { plaintext: string; key_version: number }
    }> = await this.http.post(
      `${this.options.address}${this.options.transitPath}decrypt/${this.options.encryptionKeyName}`,
      { ciphertext: encryptedMnemonic },
      { headers: { 'X-Vault-Token': token } }
    )
    const encryptedB64 = response.data.data.plaintext
    const encrypted = Buffer.from(encryptedB64, 'base64').toString()
    return encrypted
  }
}
