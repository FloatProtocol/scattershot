<template>
  <div>
    <UiButton
      v-for="(c, i) in param.components"
      :key="i"
      class="width-full d-flex mb-3"
    >
      <input
        type="text"
        class="input width-full"
        :placeholder="startCase(c.name)"
      />
      <UiLabel style="margin-top: 11px;" class="mr-n2">
        {{ c.type }}
      </UiLabel>
    </UiButton>
  </div>
</template>

<script>
import startCase from 'lodash/startCase';

export default {
  props: ['value', 'param'],
  data() {
    return {
      input: {}
    };
  },
  methods: {
    startCase
  }
};
</script>
