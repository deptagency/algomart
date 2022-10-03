import {
  createContext,
  MutableRefObject,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

import { AppConfig } from '@/config'
import { AlgorandAdapter, IConnector } from '@/libs/algorand-adapter'
import { WalletConnectAdapter } from '@/libs/wallet-connect-adapter'

interface WalletConnectContextProps {
  account: string
  connected: boolean
  connector: MutableRefObject<IConnector>
  handleConnect: () => Promise<void>
  handleDisconnect: () => Promise<void>
}

const WalletConnectContext = createContext<WalletConnectContextProps | null>(
  null
)

export const useWalletConnectContext = () => {
  const walletConnectContext = useContext(WalletConnectContext)
  if (!walletConnectContext) throw new Error('WalletConnectProvider missing')
  return walletConnectContext
}

export const WalletConnectProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState('')
  const connector = useRef<IConnector>()

  const handleConnect = useCallback(async () => {
    setConnected(false)

    const algorand = new AlgorandAdapter(AppConfig.chainType)
    connector.current = new WalletConnectAdapter(algorand)
    connector.current.addEventListener(
      'update_accounts',
      (event: CustomEvent) => {
        const accounts = event.detail as string[]
        setAccount(accounts[0])
        setConnected(true)
      }
    )

    await connector.current.connect()
  }, [])

  const handleDisconnect = useCallback(async () => {
    if (connector.current) {
      await connector.current.disconnect()
      setConnected(false)
      setAccount('')
    }
  }, [])

  const value = useMemo(
    () => ({
      account,
      connected,
      connector,
      handleConnect,
      handleDisconnect,
    }),
    [account, connected, connector, handleConnect, handleDisconnect]
  )

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  )
}
