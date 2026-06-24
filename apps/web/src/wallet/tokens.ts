/**
 * Token registry for the template dashboard — the headline Tether assets (USDt,
 * XAUt) and their ERC-20 contract addresses per chain. Mirrors the extension's
 * registry; adding a token is one entry here. (Plasma's canonical USD₮ is omitted
 * until a verified mainnet contract address is wired.)
 */

export interface TokenInfo {
  readonly symbol: string
  readonly address: string
  readonly decimals: number
}

const TOKENS: Record<string, readonly TokenInfo[]> = {
  ethereum: [
    { symbol: 'USDt', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    { symbol: 'XAUt', address: '0x68749665FF8D2d112Fa859AA293F07A622782F38', decimals: 6 },
  ],
  'polygon-mainnet': [
    { symbol: 'USDt', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
  ],
  'arbitrum-mainnet': [
    { symbol: 'USDt', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  ],
}

/** Returns the known tokens for a chain (empty if none configured). */
export function tokensFor (chainId: string): readonly TokenInfo[] {
  return TOKENS[chainId] ?? []
}
