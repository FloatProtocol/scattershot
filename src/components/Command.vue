<template>
  <div>
    <div :key="i" v-for="(input, i) in command.inputs" class="mb-3">
      <div class="mb-2">
        <h4 class="d-inline-block mr-2" v-text="startCase(input.name)" />
      </div>
      <ParamsTuple
        v-if="input.type === 'tuple'"
        :param="input"
        v-model="params[i]"
        @input="$emit('input', params)"
      />
      <ParamsAddress
        v-else-if="input.type === 'address'"
        :param="input"
        v-model="params[i]"
        @input="$emit('input', params)"
      />
      <ParamsUint256
        v-else-if="input.type === 'uint256'"
        :param="input"
        v-model="params[i]"
        @input="$emit('input', params)"
      />
      <ParamsString
        v-else
        :param="input"
        v-model="params[i]"
        @input="$emit('input', params)"
      />
    </div>
  </div>
</template>

<script>
import startCase from 'lodash/startCase';

export default {
  props: ['command'],
  data() {
    return {
      params: []
    };
  },
  methods: {
    startCase
  }
};
</script>
