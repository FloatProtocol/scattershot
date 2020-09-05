<template>
  <div>
    <div class="border-bottom px-4 pb-4 mb-4">
      <UiButton
        :key="i"
        v-for="(c, i) in contracts"
        @click="form.contract = i"
        :class="form.contract === i && 'button--active'"
        class="mr-2"
      >
        {{ c.contractName }}
      </UiButton>
      <UiButton class="float-right width-full" style="max-width: 420px;">
        <input
          v-model="form.address"
          type="text"
          class="input width-full"
          placeholder="0x123..."
        />
      </UiButton>
    </div>

    <Container>
      <div :key="i" v-for="(item, i) in contract.abi" class="d-inline-block mr-4">
        <a @click="form.command = i" v-text="item.name" />
        <UiLabel class="mr-2">{{ item.type }}</UiLabel>
        <UiLabel v-if="item.stateMutability" class="mr-2">
          {{ item.stateMutability }}
        </UiLabel>
      </div>
      <div v-if="command">
        <h4 v-text="command.name" class="mb-2"/>
        <div>
          <div :key="i" v-for="(input, i) in command.inputs">
            {{ input.name }}
          </div>
        </div>
      </div>
    </Container>

  </div>
</template>

<script>
import contracts from '@/sign/abi';
import Container from '@/components/Container';

export default {
  components: { Container },
  data() {
    return {
      form: {
        contract: Object.keys(contracts)[0],
        address: null,
        command: null
      },
      contracts
    };
  },
  computed: {
    contract() {
      return this.contracts[this.form.contract];
    },
    command() {
      return this.contract.abi[this.form.command];
    }
  }
};
</script>
