<template>
  <div>
    <div class="px-4 pb-3 border-bottom">
      <UiButton
        :key="i"
        v-for="(c, i) in contracts"
        @click="setContract(i)"
        :class="form.contract === i && 'button--active'"
        class="mr-2 mb-2"
      >
        {{ c.contractName }}
      </UiButton>
      <UiButton class="float-right width-full" style="max-width: 420px;">
        <input
          v-model.trim="form.address"
          type="text"
          class="input width-full"
          placeholder="0x123..."
        />
      </UiButton>
    </div>
    <div class="px-4 py-4 border-bottom mb-4">
      <UiButton
        :key="i"
        v-for="(c, i) in commands"
        @click="setCommand(c.name)"
        :class="form.command === c.name && 'button--active'"
        class="mr-2 mb-2"
      >
        {{ c.name }}
      </UiButton>
    </div>
    <Container>
      <form @submit.prevent="handleSubmit" v-if="command">
        <div class="mx-auto" style="max-width: 420px;">
          <h3 v-text="command.name" class="mb-3" />
          <div :key="i" v-for="(input, i) in command.inputs" class="mb-3">
            <div class="mb-2">
              <h4 class="d-inline-block mr-2">{{ input.name }}</h4>
              <UiLabel>{{ input.type }}</UiLabel>
            </div>
            <div>
              <div v-if="input.type === 'tuple'">
                <UiButton
                  :key="i"
                  v-for="(component, i) in input.components"
                  class="width-full mb-2"
                >
                  <input
                    type="text"
                    class="input width-full"
                    :placeholder="component.name"
                  />
                </UiButton>
              </div>
              <UiButton v-else class="width-full">
                <input
                  v-model.trim="form.params[i]"
                  type="text"
                  class="input width-full"
                  placeholder="0x123..."
                />
              </UiButton>
            </div>
          </div>
          <UiButton type="submit" class="width-full button--submit mt-2">
            Submit
          </UiButton>
        </div>
      </form>
    </Container>
  </div>
</template>

<script>
import contracts from '@/sign/abi';
import { Contract } from '@ethersproject/contracts';
import { Web3Provider } from '@ethersproject/providers';
import { getAddress } from '@ethersproject/address';

const setup = {
  CRPFactory: {
    addresses: [
      {
        address: '0x17e8705E85aE8E3df7C5E4d3EEd94000FB30C483',
        name: 'Balancer smart pool factory'
      }
    ]
  },
  IERC20: {
    addresses: [
      {
        address: '0x1528F3FCc26d13F7079325Fb78D9442607781c8C',
        name: 'DAI'
      },
      {
        address: '0xd0A1E359811322d97991E03f863a0C30C2cF029C',
        name: 'WETH'
      }
    ]
  }
};

export default {
  data() {
    return {
      form: {
        address: '0x1528F3FCc26d13F7079325Fb78D9442607781c8C',
        contract: this.$route.query.contract || Object.keys(contracts)[0],
        command: this.$route.query.command,
        params: []
      },
      contracts,
      setup
    };
  },
  computed: {
    contract() {
      return this.contracts[this.form.contract];
    },
    commands() {
      return this.contract.abi.filter(
        command =>
          command.type === 'function' &&
          !['view', 'pure'].includes(command.stateMutability)
      );
    },
    command() {
      return this.commands.filter(
        command => command.name === this.form.command
      )[0];
    }
  },
  methods: {
    setContract(key) {
      if (key === this.form.contract) return;
      this.form.contract = key;
      this.$router.push({
        path: this.$router.currentRoute.path,
        query: {
          contract: key
        }
      });
    },
    setCommand(key) {
      if (key === this.form.command) return;
      this.form.command = key;
      this.$router.push({
        path: this.$router.currentRoute.path,
        query: {
          contract: this.form.contract,
          command: key
        }
      });
    },
    async handleSubmit() {
      try {
        const web3 = new Web3Provider(this.$auth.provider);
        const signer = web3.getSigner();
        const contract = new Contract(
          getAddress(this.form.address),
          this.contract.abi,
          web3
        );
        const contractWithSigner = contract.connect(signer);
        const overrides = {};
        const gasLimitNumber = await contractWithSigner.estimateGas[
          this.command.name
        ](...this.form.params, overrides);
        const gasLimit = gasLimitNumber.toNumber();
        overrides.gasLimit = Math.floor(gasLimit * 1.1);
        const tx = await contractWithSigner[this.command.name](
          ...this.form.params,
          overrides
        );
        await tx.wait();
        console.log('Success', tx);
      } catch (e) {
        console.log('Error', e);
      }
    }
  }
};
</script>
