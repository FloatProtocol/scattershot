import { getAddress, isAddress } from '@ethersproject/address';
import { loadBPool, loadPoolTokens, getBptSymbol } from '@/_balancer/utils';

export default class Pool {
  public chainId: number;
  public provider: any;
  public address: string;
  public checksum: string;
  public bpool?: any;
  public poolTokens?: any;
  public bptSymbol?: string;

  constructor(chainId: number, provider, address: string) {
    this.chainId = chainId;
    this.provider = provider;
    this.address = address.toLowerCase();
    this.checksum = isAddress(this.address) ? getAddress(this.address) : '';
  }

  async loadBPool() {
    this.bpool = await loadBPool(this.chainId, this.provider, this.checksum);
    this.poolTokens = await loadPoolTokens(
      this.chainId,
      this.provider,
      this.checksum,
      this.bpool.currentTokens
    );
    this.bptSymbol = getBptSymbol(this.poolTokens);
  }
}
