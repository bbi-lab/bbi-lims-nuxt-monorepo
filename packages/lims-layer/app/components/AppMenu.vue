<script setup>
import _ from 'lodash'
import { Icon } from '#components'

const { user } = useUserSession()

const DnaIcon = h(Icon, { name: 'mdi:dna', class: 'm-1' })
const PhGridNineFill = h(Icon, { name: 'ph:grid-nine-fill', class: 'm-1' })

const model = ref([
    {
        label: 'Menu',
        items: [
            { label: 'Home', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Genes', iconComponent: DnaIcon, to: '/genes' },
            { label: 'Plates', iconComponent: PhGridNineFill, to: '/plates' },
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
])

const menuItems = computed(() => model.value.filter(item => !item.hidden))
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in menuItems" :key="item">
            <app-menu-item v-if="!item.separator" :item="item" :index="i"/>
            <li v-if="item.separator" class="menu-separator"/>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
