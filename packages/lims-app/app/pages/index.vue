<script setup>
const config = useRuntimeConfig()
</script>

<template>
    <div className="card">
        <div class="font-semibold text-xl mb-4">{{ config.public.appName }}</div>
        <p>Use this page to start from scratch and place your custom LIMS content.</p>
    </div>
</template>
