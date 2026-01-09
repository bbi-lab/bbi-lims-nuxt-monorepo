<script setup>
import _ from 'lodash'
const { user } = useUserSession()

const model = ref([
    {
        label: 'Menu',
        items: [
            { label: 'Home', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Login', icon: 'pi pi-fw pi-home', to: '/login' },
            { label: 'Register', icon: 'pi pi-fw pi-home', to: '/register' },
            { label: 'Access Denied', icon: 'pi pi-fw pi-home', to: '/access-denied' }
        ]
    },
    {
        label: 'Admin',
        hidden: !_.get(user?.value, 'isAdmin'),
        items: [
            { label: 'Users', icon: 'pi pi-fw pi-user', to: '/admin/users' },
            { label: 'Groups', icon: 'pi pi-fw pi-users', to: '/admin/user-groups' },
        ]
    },
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"/>
            <li v-if="item.separator" class="menu-separator"/>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
