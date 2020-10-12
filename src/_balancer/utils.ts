import { formatUnits } from '@ethersproject/units';
import { multicall } from '@bonustrack/snapshot.js/src/utils';
import abi from './abi';

/**
 * Load Balancer pool
 * @param chainId
 * @param provider
 * @param address
 */
export async function loadBPool(chainId: number, provider, address: string) {
  const calls = [
    'getController',
    'getTotalDenormalizedWeight',
    'getCurrentTokens',
    'isFinalized',
    'isPublicSwap',
    'name',
    'decimals',
    'symbol',
    'getSwapFee',
    'totalSupply'
  ].map(call => (Array.isArray(call) ? call : [call, []]));
  const res = await multicall(
    chainId,
    provider,
    abi['BPool'],
    calls.map(call => [address, call[0], call[1]])
  );
  const bpool = Object.fromEntries(res.map(([item], i) => [calls[i][0], item]));
  bpool.controller = bpool.getController;
  bpool.totalDenormalizedWeight = formatUnits(
    bpool.getTotalDenormalizedWeight.toString(),
    18
  );
  bpool.currentTokens = bpool.getCurrentTokens;
  bpool.swapFee = formatUnits(bpool.getSwapFee.toString(), 16);
  [
    'getController',
    'getTotalDenormalizedWeight',
    'getCurrentTokens',
    'getSwapFee'
  ].map(item => delete bpool[item]);
  return bpool;
}

/**
 * Load pool underlying tokens
 * @param chainId
 * @param provider
 * @param address
 * @param tokens
 */
export async function loadPoolTokens(
  chainId: number,
  provider,
  address: string,
  tokens: string[]
) {
  const calls = [
    ['balanceOf', [address]],
    'name',
    'decimals',
    'symbol',
    'totalSupply'
  ].map(call => (Array.isArray(call) ? call : [call, []]));
  const res = await multicall(
    chainId,
    provider,
    abi['BPool'],
    tokens
      .map(token => calls.map(call => [token, call[0], call[1] || []]))
      .reduce((a, b) => [...a, ...b])
  );
  return Object.fromEntries(
    tokens.map((token, i) => [
      token,
      Object.fromEntries(
        calls.map((call, callIndex) => [
          call[0],
          ...res[callIndex + i * calls.length]
        ])
      )
    ])
  );
}

/**
 * Get BPT symbol from pool tokens
 * @param poolTokens
 */
export function getBptSymbol(poolTokens: any): string {
  return Object.values(poolTokens).reduce(
    (a: string, b: any) => `${a ? `${a} +` : ''} 20% ${b.symbol}`,
    ''
  );
}
