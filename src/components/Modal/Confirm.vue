<template>
  <UiModal :open="open" v-if="open" @close="$emit('close')" class="d-flex">
    <template v-slot:header>
      <h3>{{ $t('confirmVote') }}</h3>
    </template>
    <div class="d-flex flex-column flex-auto">
      <h4 class="m-4 mb-0 text-center">
        {{ $tc('sureToVote', [options]) }}
        <br />
        {{ $t('cannotBeUndone') }}
      </h4>
      <div class="m-4 p-4 border rounded-2 text-white">
        <div class="d-flex">
          <span v-text="$t('option')" class="flex-auto text-gray mr-1" />
          {{ options }}
        </div>
        <div class="d-flex">
          <span v-text="$t('snapshot')" class="flex-auto text-gray mr-1" />
          <a
            :href="
              _explorer(space.network, proposal.msg.payload.snapshot, 'block')
            "
            target="_blank"
            class="float-right"
          >
            {{ _n(proposal.msg.payload.snapshot, '0,0') }}
            <Icon name="external-link" class="ml-1" />
          </a>
        </div>
        <div class="d-flex">
          <span v-text="$t('votingPower')" class="flex-auto text-gray mr-1" />
          <span
            class="tooltipped tooltipped-nw"
            :aria-label="
              scores
                .map((score, index) => `${_n(score)} ${symbols[index]}`)
                .join(' + ')
            "
          >
            {{ _n(totalScore) }}
            {{ _shorten(space.symbol, 'symbol') }}
          </span>
        </div>
      </div>
    </div>
    <template v-slot:footer>
      <div class="col-6 float-left pr-2">
        <UiButton @click="$emit('close')" type="button" class="width-full">
          {{ $t('cancel') }}
        </UiButton>
      </div>
      <div class="col-6 float-left pl-2">
        <UiButton
          :disabled="loading"
          :loading="loading"
          @click="handleSubmit"
          type="submit"
          class="width-full button--submit"
        >
          {{ $t('proposal.vote') }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  props: [
    'open',
    'space',
    'proposal',
    'id',
    'selectedChoice',
    'allocations',
    'snapshot',
    'totalScore',
    'scores'
  ],
  emits: ['reload', 'close'],
  data() {
    return {
      loading: false
    };
  },
  computed: {
    symbols() {
      return this.space.strategies.map(strategy => strategy.params.symbol);
    },
    options() {
      return Object.entries(this.allocations)
        .sort(([, a], [, b]) => b - a)
        .map(([choice]) => this.proposal.msg.payload.choices[choice - 1])
        .join(' / ');
    }
  },
  methods: {
    ...mapActions(['send']),
    async handleSubmit() {
      this.loading = true;
      await this.send({
        space: this.space.key,
        type: 'vote',
        payload: {
          proposal: this.id,
          choice: this.allocations,
          metadata: {}
        }
      });
      this.$emit('reload');
      this.$emit('close');
      this.loading = false;
    }
  }
};
</script>
