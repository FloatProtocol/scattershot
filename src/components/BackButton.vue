<template>
  <router-link :to="to" class="text-gray">
    <Icon name="back" size="22" class="v-align-middle" />
    {{ text }}
  </router-link>
</template>

<script>
export default {
  props: ['text', 'to']
};
</script>
