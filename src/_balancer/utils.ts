import { formatUnits } from '@ethersproject/units';
import { multicall } from '@bonustrack/snapshot.js/src/utils';
import abi from './abi';

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
  bpool.swapFee = formatUnits(bpool.getSwapFee.toString(), 18);
  [
    'getController',
    'getTotalDenormalizedWeight',
    'getCurrentTokens',
    'getSwapFee'
  ].map(item => delete bpool[item]);
  return bpool;
}

export async function loadPoolTokens(
  chainId: number,
  provider,
  address: string,
  tokens: string[]
) {
  const calls = tokens
    .map(token =>
      [
        ['balanceOf', [address]],
        ['name'],
        ['decimals'],
        ['symbol'],
        ['totalSupply']
      ].map(call => [token, call[0], call[1] || []]))
    .reduce((a, b) => [...a, ...b]);
  const res = await multicall(chainId, provider, abi['BPool'], calls);
  const poolTokens = Object.fromEntries(res.map(([item], i) => [i, item]));
  console.log('Pool tokens', poolTokens);
  return poolTokens;
}
