<script setup lang="ts">
const { myLayer } = useAppConfig()
const date = ref<Date | null>(null)
console.log(myLayer)

</script>

<template>
  <div>
    <h1>Hello World!</h1>
    <pre>{{ myLayer }}</pre>
    <DatePicker v-model="date" />
  </div>
</template>
