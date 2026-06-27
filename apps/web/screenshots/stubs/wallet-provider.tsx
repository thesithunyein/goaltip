import type { ReactNode } from 'react';
export function WalletProvider({ children }: { children: ReactNode }) { return <>{children}</>; }
export function useWallet() {
  return {
    phase: 'unlocked', chainId: 'ethereum', setChainId: () => {},
    accountIndex: 0, setAccountIndex: () => {},
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    addressLoading: false, balance: 1250000000000000000n, balanceLoading: false,
    usdValue: '$3,140.00', refreshBalance: async () => {}, lock: async () => {},
    generateMnemonic: async () => '', validateMnemonic: async () => true,
    createVault: async () => {}, unlock: async () => {}, reset: async () => {}, send: async () => '',
    transactions: [],
  } as never;
}
