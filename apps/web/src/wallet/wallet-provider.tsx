'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { disposeWalletApi, getWalletApi, type WalletApi } from './wallet-client'
import { DEFAULT_CHAIN_ID, getChain, familyOf } from './chains'

export type WalletPhase = 'loading' | 'no-vault' | 'locked' | 'unlocked' | 'error'

export interface TxRecord {
  readonly hash: string
  readonly chainId: string
  readonly to: string
  readonly amount: string
  readonly symbol: string
  readonly ts: number
  readonly status: 'submitted' | 'failed'
}

export interface WalletContextValue {
  phase: WalletPhase
  error?: string
  chainId: string
  setChainId: (id: string) => void
  accountIndex: number
  setAccountIndex: (i: number) => void
  address?: string
  addressLoading: boolean
  balance?: bigint
  balanceLoading: boolean
  /** Formatted USD value of the native balance (e.g. "$1,234.56"), if priced. */
  usdValue?: string
  refreshBalance: () => Promise<void>
  generateMnemonic: () => Promise<string>
  validateMnemonic: (mnemonic: string) => Promise<boolean>
  createVault: (mnemonic: string, password: string) => Promise<void>
  unlock: (password: string) => Promise<void>
  lock: () => Promise<void>
  reset: () => Promise<void>
  /** Sends the native asset on the active chain (any family); returns the tx hash. */
  send: (to: string, amountBase: bigint) => Promise<string>
  transactions: readonly TxRecord[]
}

const WalletContext = createContext<WalletContextValue | null>(null)

const encoder = new TextEncoder()

export function WalletProvider ({ children }: { children: React.ReactNode }) {
  const apiRef = useRef<WalletApi | null>(null)
  const [phase, setPhase] = useState<WalletPhase>('loading')
  const [error, setError] = useState<string | undefined>(undefined)
  const [chainId, setChainId] = useState<string>(DEFAULT_CHAIN_ID)
  const [accountIndex, setAccountIndex] = useState(0)
  const [address, setAddress] = useState<string | undefined>(undefined)
  const [addressLoading, setAddressLoading] = useState(false)
  const [balance, setBalance] = useState<bigint | undefined>(undefined)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [usdValue, setUsdValue] = useState<string | undefined>(undefined)
  const [transactions, setTransactions] = useState<readonly TxRecord[]>([])

  const api = useCallback((): WalletApi => {
    if (!apiRef.current) apiRef.current = getWalletApi()
    return apiRef.current
  }, [])

  // On mount: does a vault exist? A fresh page = worker has no in-memory key,
  // so an existing vault starts 'locked'.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const hasStored = await api().vault_hasStored()
        if (cancelled) return
        setPhase(hasStored ? 'locked' : 'no-vault')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setPhase('error')
      }
    })()
    return () => { cancelled = true }
  }, [api])

  // Derive the address whenever the active chain/account changes while unlocked.
  useEffect(() => {
    if (phase !== 'unlocked') { setAddress(undefined); return }
    let cancelled = false
    setAddressLoading(true)
    ;(async () => {
      try {
        const family = familyOf(chainId)
        const addr = family === 'solana'
          ? await api().account_getSolanaAddress(chainId as never, accountIndex)
          : family === 'bitcoin'
            ? await api().account_getBtcAddress(chainId as never, accountIndex)
            : family === 'ton'
              ? await api().account_getTonAddress(chainId as never, accountIndex)
              : family === 'tron'
                ? await api().account_getTronAddress(chainId as never, accountIndex)
                : await api().account_getEvmAddress(chainId as never, accountIndex)
        if (!cancelled) setAddress(addr as string)
      } catch {
        if (!cancelled) setAddress(undefined)
      } finally {
        if (!cancelled) setAddressLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [phase, chainId, accountIndex, api])

  const refreshBalance = useCallback(async () => {
    if (phase !== 'unlocked' || !address) return
    setBalanceLoading(true)
    try {
      const family = familyOf(chainId)
      // Bitcoin/TON/Tron expose balance on the account (UTXO / native client);
      // EVM + Solana read it through the RPC adapter by address.
      const bal = family === 'bitcoin'
        ? await api().account_getBtcBalance(chainId as never, accountIndex)
        : family === 'ton'
          ? await api().account_getTonBalance(chainId as never, accountIndex)
          : family === 'tron'
            ? await api().account_getTronBalance(chainId as never, accountIndex)
            : await api().rpc_getBalance(chainId as never, address)
      setBalance(BigInt(bal))
    } catch {
      setBalance(undefined)
    } finally {
      setBalanceLoading(false)
    }
  }, [phase, address, chainId, accountIndex, api])

  // Refresh balance when address/chain settles.
  useEffect(() => { void refreshBalance() }, [refreshBalance])

  // Fiat (USD) value of the native balance, via CoinGecko pricing in the worker.
  useEffect(() => {
    if (phase !== 'unlocked' || balance === undefined) { setUsdValue(undefined); return }
    let cancelled = false
    ;(async () => {
      try {
        const chain = getChain(chainId)
        const price = await api().pricing_getUsdPrice(chain.symbol)
        if (cancelled) return
        if (price == null) { setUsdValue(undefined); return }
        const human = Number(balance) / 10 ** chain.decimals
        setUsdValue((human * price).toLocaleString('en-US', { style: 'currency', currency: 'USD' }))
      } catch {
        if (!cancelled) setUsdValue(undefined)
      }
    })()
    return () => { cancelled = true }
  }, [phase, balance, chainId, api])

  const generateMnemonic = useCallback(() => api().bip39_generateMnemonic(), [api])
  const validateMnemonic = useCallback((m: string) => api().bip39_validateMnemonic(m), [api])

  const createVault = useCallback(async (mnemonic: string, password: string) => {
    await api().vault_store(password, encoder.encode(mnemonic))
    await api().vault_load(password)
    setPhase('unlocked')
  }, [api])

  const unlock = useCallback(async (password: string) => {
    await api().vault_load(password) // throws on wrong password
    setPhase('unlocked')
  }, [api])

  const lock = useCallback(async () => {
    await api().lock()
    setAddress(undefined)
    setBalance(undefined)
    setPhase('locked')
  }, [api])

  const reset = useCallback(async () => {
    await api().vault_clear()
    disposeWalletApi()
    apiRef.current = null
    setTransactions([])
    setAddress(undefined)
    setBalance(undefined)
    setPhase('no-vault')
  }, [api])

  const send = useCallback(async (to: string, amountBase: bigint) => {
    const chain = getChain(chainId)
    const family = familyOf(chainId)
    const hash = family === 'solana'
      ? await api().account_sendSolanaTransaction(chainId as never, accountIndex, to, amountBase)
      : family === 'bitcoin'
        ? await api().account_sendBtcTransaction(chainId as never, accountIndex, to, amountBase)
        : family === 'ton'
          ? await api().account_sendTonTransaction(chainId as never, accountIndex, to, amountBase)
          : family === 'tron'
            ? await api().account_sendTronTransaction(chainId as never, accountIndex, to, amountBase)
            : await api().account_sendTransaction(chainId as never, accountIndex, { to, value: amountBase })
    const record: TxRecord = {
      hash: hash as string,
      chainId,
      to,
      amount: amountBase.toString(),
      symbol: chain.symbol,
      ts: Date.now(),
      status: 'submitted'
    }
    setTransactions((prev) => [record, ...prev])
    void refreshBalance()
    return hash as string
  }, [api, chainId, accountIndex, refreshBalance])

  const value = useMemo<WalletContextValue>(() => ({
    phase,
    error,
    chainId,
    setChainId,
    accountIndex,
    setAccountIndex,
    address,
    addressLoading,
    balance,
    balanceLoading,
    usdValue,
    refreshBalance,
    generateMnemonic,
    validateMnemonic,
    createVault,
    unlock,
    lock,
    reset,
    send,
    transactions
  }), [phase, error, chainId, accountIndex, address, addressLoading, balance, balanceLoading, usdValue, refreshBalance, generateMnemonic, validateMnemonic, createVault, unlock, lock, reset, send, transactions])

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet (): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>')
  return ctx
}
