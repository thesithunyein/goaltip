import type { ReactNode } from 'react';
export function WalletProvider({ children }: { children: ReactNode }) { return <>{children}</>; }
const SAMPLE_TXS = [
  { hash: '0x9f2a1c4e7b8d3f5a6c0e1b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a', chainId: 'ethereum', to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', amount: '50000000', symbol: 'USDt', ts: 1719500000000, status: 'success' },
  { hash: '0x1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d', chainId: 'ethereum', to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', amount: '12500000', symbol: 'USDt', ts: 1719493000000, status: 'pending' },
];
export function useWallet() {
  return {
    phase: 'unlocked', chainId: 'ethereum', setChainId: () => {},
    accountIndex: 0, setAccountIndex: () => {},
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    addressLoading: false, balance: 1250000000000000000n, balanceLoading: false,
    usdValue: '$3,140.00', refreshBalance: async () => {}, lock: async () => {},
    generateMnemonic: async () => '', validateMnemonic: async () => true,
    createVault: async () => {}, unlock: async () => {}, reset: async () => {}, send: async () => '',
    transactions: SAMPLE_TXS,
  } as never;
}
