<script setup>
const model = ref([
    {
        label: 'Menu',
        items: [
            { label: 'Home', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Login', icon: 'pi pi-fw pi-home', to: '/login' },
            { label: 'Register', icon: 'pi pi-fw pi-home', to: '/register' },
            { label: 'Access Denied', icon: 'pi pi-fw pi-home', to: '/access-denied' }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
            <li v-if="item.separator" class="menu-separator"></li>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
