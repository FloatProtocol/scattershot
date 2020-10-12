<template>
  <Container :slim="true">
    <div class="px-4 px-md-0 mb-3">
      <router-link :to="{ name: 'proposals' }" class="text-gray">
        <Icon name="back" size="22" class="v-align-middle" />
        Pools
      </router-link>
    </div>
    <div>
      <div class="col-12 col-lg-8 float-left pr-0 pr-lg-5">
        <div class="px-4 px-md-0">
          <template v-if="loaded">
            <h1 class="mb-2">BPT</h1>
          </template>
          <template v-else>
            <div
              class="bg-gray-9 rounded-1 anim-pulse mb-3"
              style="width: 100%; height: 34px;"
            />
            <div
              class="bg-gray-9 rounded-1 anim-pulse mb-3"
              style="width: 40%; height: 34px;"
            />
            <div
              class="bg-gray-9 rounded-1 anim-pulse mb-4"
              style="width: 65px; height: 28px;"
            />
          </template>
        </div>
      </div>
      <div v-if="loaded" class="col-12 col-lg-4 float-left">
        <Block title="Information">
          <div class="mb-1">
            <b>Controller</b>
            <User :address="pool.bpool.controller" class="float-right" />
          </div>
          <div class="mb-1">
            <b>Swap fee</b>
            <span
              v-text="`${$n(pool.bpool.swapFee)}%`"
              class="float-right text-white"
            />
          </div>
          <div class="mb-1">
            <b>Snapshot</b>
            <a
              :href="_explorer(12345, 'block')"
              target="_blank"
              class="float-right"
            >
              {{ $n(12345.789) }}
              <Icon name="external-link" class="ml-1" />
            </a>
          </div>
        </Block>
      </div>
    </div>
  </Container>
</template>

<script>
import balancer from '@/_balancer';
import getProvider from '@/helpers/provider';

export default {
  data() {
    return {
      id: this.$route.params.id,
      loading: false,
      loaded: false
    };
  },
  methods: {
    async loadPool() {
      const chainId = this.web3.network.chainId;
      this.pool = new balancer.Pool(chainId, getProvider(chainId), this.id);
      await this.pool.loadBPool();
    }
  },
  async created() {
    this.loading = true;
    await this.loadPool();
    this.loading = false;
    this.loaded = true;
  }
};
</script>
