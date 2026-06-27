import { createRoot } from 'react-dom/client';
import '@/app/globals.css';
import { AppearanceProvider } from '@/components/appearance-provider';
import { AssetDetail } from '@/components/asset-detail';

createRoot(document.getElementById('root')!).render(
  <AppearanceProvider>
    <AssetDetail
      token={{ symbol: 'USDt', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 }}
      chainId="ethereum"
      address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
      onSend={() => {}}
      onReceive={() => {}}
      onClose={() => {}}
    />
  </AppearanceProvider>,
);
