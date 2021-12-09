import { useCallback, useRef, useState } from 'react'

import Button from '@/components/button'
import { useUntransferredPacks } from '@/hooks/use-untransferred-packs'
import DefaultLayout from '@/layouts/default-layout'
import { AlgorandAdapter, ChainType, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'

const algorand = new AlgorandAdapter(ChainType.TestNet)

const formatAccount = (account: string) =>
  `${account.slice(0, 6)}...${account.slice(-6)}`

export default function Demo() {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState<string>('')
  const connectorReference = useRef<IConnector>()
  const { data: untransferred } = useUntransferredPacks()

  console.log(untransferred)

  const connect = useCallback(async () => {
    setConnected(false)

    const connector = (connectorReference.current = new WalletConnectAdapter(
      algorand
    ))

    connector.subscribe('update_accounts', (accounts: string[]) => {
      setAccount(accounts[0])
      setConnected(true)
    })

    await connector.connect()
  }, [])

  const disconnect = useCallback(async () => {
    const connector = connectorReference.current
    if (connector) {
      await connector.disconnect()
      setConnected(false)
      setAccount('')
    }
  }, [])

  return (
    <DefaultLayout noPanel>
      {connected ? (
        <>
          <p>{formatAccount(account)}</p>
          <Button onClick={disconnect}>Disconnect</Button>
        </>
      ) : (
        <Button onClick={connect}>Connect</Button>
      )}
    </DefaultLayout>
  )
}
