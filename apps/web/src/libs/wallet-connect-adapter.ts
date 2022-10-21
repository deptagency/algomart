import { WalletTransaction } from '@algomart/shared/algorand'
import type { PeraWalletConnect } from '@perawallet/connect'

import { AlgorandAdapter, IConnector } from './algorand-adapter'

const BRIDGE_URL = 'https://a.bridge.walletconnect.org/'
const SIGNING_METHOD = 'algo_signTxn'

export class WalletConnectAdapter extends EventTarget implements IConnector {
  private _peraWallet: PeraWalletConnect | null = null
  public connected = false

  constructor(public readonly algorand: AlgorandAdapter) {
    super()
  }

  private async setupPeraWallet() {
    if (!this._peraWallet) {
      const { PeraWalletConnect } = await import('@perawallet/connect')
      this._peraWallet = new PeraWalletConnect({
        bridge: BRIDGE_URL,
      })
    }
  }

  private async initialize() {
    await this.setupPeraWallet()
    await this._peraWallet.connect()

    this.subscribeToEvents()
  }

  private subscribeToEvents() {
    if (!this._peraWallet.connector)
      throw new Error('WalletConnect not initialized')
    this._peraWallet.connector.on('session_update', (error, payload) => {
      if (error) throw error
      const { accounts } = payload.params[0]
      this.onSessionUpdate(accounts)
    })

    this._peraWallet.connector.on('connect', (error, payload) => {
      if (error) throw error
      this.onConnect(payload)
    })

    this._peraWallet.connector.on('disconnect', (error) => {
      if (error) throw error
      this.onDisconnect()
    })

    if (this._peraWallet.connector.connected) {
      const { accounts } = this._peraWallet.connector
      this.connected = true
      this.onSessionUpdate(accounts)
    }
  }

  private onSessionUpdate(accounts: string[]) {
    this.dispatchEvent(new CustomEvent('update_accounts', { detail: accounts }))
  }

  private onConnect(event: { params: { accounts: string[] }[] }) {
    this.connected = true
    const { accounts } = event.params[0]
    this.onSessionUpdate(accounts)
    this.dispatchEvent(new CustomEvent('connect'))
  }

  private onDisconnect() {
    this.connected = false
    this.dispatchEvent(new CustomEvent('disconnect'))
  }

  public async reconnect() {
    await this.setupPeraWallet()

    return await this._peraWallet.reconnectSession()
  }

  public async connect() {
    if (!this._peraWallet) await this.initialize()
    if (!this._peraWallet) throw new Error('WalletConnect failed to initialize')
    if (this._peraWallet.connector.connected) return
    await this._peraWallet.connector.createSession()
  }

  public async disconnect() {
    if (!this._peraWallet) throw new Error('WalletConnect not initialized')
    await this._peraWallet.connector.killSession()
  }

  public async signTransaction(
    unsignedTransactions: WalletTransaction[],
    skipSubmit?: boolean
  ): Promise<(Uint8Array | null)[]> {
    try {
      if (!this._peraWallet) throw new Error('WalletConnect not initialized')

      const { formatJsonRpcRequest } = await import('@json-rpc-tools/utils')

      const request = formatJsonRpcRequest(SIGNING_METHOD, [
        unsignedTransactions,
      ])

      const encodedSignedTxns: string[] =
        await this._peraWallet.connector.sendCustomRequest(request)

      const txns = encodedSignedTxns.map((txn) => {
        if (!txn) return null
        return new Uint8Array(Buffer.from(txn, 'base64'))
      })

      // Send signed transaction to the Algorand network
      if (!skipSubmit) {
        await this.algorand.sendRawTransaction(txns)
      }

      return txns
    } catch (error) {
      this.onDisconnect()
      throw error
    }
  }
}
