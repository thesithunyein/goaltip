// Screenshot harness stub for the worklet client: most methods resolve to
// undefined so a dialog renders its chrome without a live wallet. A few read-only
// methods return sample data so the asset-detail page shows a populated balance.
const RETURNS: Record<string, unknown> = {
  rpc_getTokenBalance: '125000000', // 125.000000 (6dp)
  pricing_getUsdPrice: 1.0,
};
const api = new Proxy({}, { get: (_t, prop: string) => async () => RETURNS[prop] });
export function getWalletApi() { return api as never; }
export function disposeWalletApi() {}
