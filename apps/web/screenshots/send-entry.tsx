import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@/app/globals.css';
import { AppearanceProvider } from '@/components/appearance-provider';
import { AmountInput, ReviewSheet } from '@wdk-starter/wdk-ui';

// Renders the real Send-flow primitives the SendDialog composes (AmountInput
// with fiat⇄crypto + Max, then ReviewSheet) so the imagery matches the app.
function SendDemo() {
  const [amount, setAmount] = useState('0.5');
  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary, #b3a79f)', marginBottom: 6 }}>Amount</div>
        <AmountInput value={amount} onChange={setAmount} symbol="ETH" usdPrice={3140} max="1.25" />
      </div>
      <ReviewSheet
        title="Send ETH"
        rows={[
          { label: 'To', value: '0x70997970…dc79C8', mono: true },
          { label: 'Amount', value: `${amount} ETH` },
          { label: 'Value', value: '$1,570.00' },
          { label: 'Network', value: 'Ethereum' },
        ]}
        confirmLabel="Confirm & send"
        onConfirm={() => {}}
        onCancel={() => {}}
        note="Double-check the recipient and network — on-chain sends can’t be reversed."
      />
    </div>
  );
}
createRoot(document.getElementById('root')!).render(
  <AppearanceProvider><SendDemo /></AppearanceProvider>,
);
