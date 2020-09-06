<template>
  <UiButton class="d-flex width-full">
    <input
      v-model.trim="input"
      @input="$emit('input', input)"
      type="text"
      class="input width-full"
    />
    <UiLabel style="margin-top: 11px;" class="mr-n2">
      {{ param.type }}
    </UiLabel>
  </UiButton>
</template>

<script>
export default {
  props: ['value', 'param'],
  data() {
    return {
      input: ''
    };
  }
};
</script>
