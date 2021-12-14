import type WalletConnect from '@walletconnect/client'
import { IInternalEvent } from '@walletconnect/types'
import type { Transaction } from 'algosdk'

import { AlgorandAdapter, IConnector } from './algorand-adapter'
import { EventEmitter } from './event-emitter'

const BRIDGE_URL = 'https://bridge.walletconnect.org'
const SIGNING_METHOD = 'algo_signTxn'

export class WalletConnectAdapter extends EventEmitter implements IConnector {
  private _connector: WalletConnect | null = null
  public connected = false

  constructor(public readonly algorand: AlgorandAdapter) {
    super()
  }

  private async initialize() {
    const { default: WalletConnect } = await import('@walletconnect/client')
    const { default: QRCodeModal } = await import(
      'algorand-walletconnect-qrcode-modal'
    )

    this._connector = new WalletConnect({
      bridge: BRIDGE_URL,
      qrcodeModal: QRCodeModal,
      signingMethods: [SIGNING_METHOD],
    })

    this.subscribeToEvents()
  }

  private subscribeToEvents() {
    if (!this._connector) throw new Error('WalletConnect not initialized')

    this._connector.on('session_update', (error, payload) => {
      if (error) throw error
      const { accounts } = payload.params[0]
      console.log('session_update payload:', payload)
      this.onSessionUpdate(accounts)
    })

    this._connector.on('connect', (error, payload) => {
      if (error) throw error
      this.onConnect(payload)
    })

    this._connector.on('disconnect', (error) => {
      if (error) throw error
      this.onDisconnect()
    })

    if (this._connector.connected) {
      const { accounts } = this._connector
      this.connected = true
      this.onSessionUpdate(accounts)
    }
  }

  private onSessionUpdate(accounts: string[]) {
    this.emit('update_accounts', accounts)
  }

  private onConnect(event: IInternalEvent) {
    this.connected = true
    const { accounts } = event.params[0]
    this.onSessionUpdate(accounts)
    this.emit('connect')
  }

  private onDisconnect() {
    this.connected = false
    this.emit('disconnect')
  }

  public async connect() {
    if (!this._connector) await this.initialize()
    if (!this._connector) throw new Error('WalletConnect failed to initialize')
    if (this._connector.connected) return
    await this._connector.createSession()
  }

  public async disconnect() {
    if (!this._connector) throw new Error('WalletConnect not initialized')
    await this._connector.killSession()
  }

  public async signTransaction(transaction: Transaction, message?: string) {
    if (!this._connector) throw new Error('WalletConnect not initialized')

    const { formatJsonRpcRequest } = await import('@json-rpc-tools/utils')

    const request = formatJsonRpcRequest(SIGNING_METHOD, [
      [
        {
          txn: Buffer.from(
            await this.algorand.encodeUnsignedTransaction(transaction)
          ).toString('base64'),
          message,
        },
      ],
    ])

    const [encodedSignedTxn]: string[] =
      await this._connector.sendCustomRequest(request)

    const txn = new Uint8Array(Buffer.from(encodedSignedTxn, 'base64'))
    await this.algorand.sendRawTransaction(txn)
    return txn
  }
}
