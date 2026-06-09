<script setup>
import _ from 'lodash'
import { Icon } from '#components'
const { user } = useUserSession()

const DnaIcon = h(Icon, { name: 'mdi:dna', class: 'm-1' })
const PhGridNineFill = h(Icon, { name: 'ph:grid-nine-fill', class: 'm-1' })
const TilesIcon = h(Icon, { name: 'fluent-mdl2:tiles', class: 'm-1' })
const TileVariantsIcon = h(Icon, { name: 'mdi:compare-horizontal', class: 'm-1' })
const OligosIcon = h(Icon, { name: 'icon-park-outline:comb', class: 'm-1' })
const BeakerOutlineIcon = h(Icon, { name: 'mdi:beaker-outline', class: 'm-1' })

const model = ref([
    {
        label: 'Menu',
        items: [
            { label: 'Home', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Projects', icon: 'pi pi-fw pi-briefcase', to: '/projects' },
            { label: 'Plates', iconComponent: PhGridNineFill, to: '/plates' },
            {
                label: 'Reference',
                iconComponent: DnaIcon,
                items: [
                    { label: 'Genes', to: '/genes' },
                    { label: 'Transcripts', to: '/transcripts' },
                ]
            },
            {
                label: 'Planning/Design',
                iconComponent: TilesIcon,
                items: [
                    { label: 'Superblocks', to: '/planning/superblocks' },
                    { label: 'Tiles', to: '/planning/tiles' },
                    { label: 'Tile Variants', to: '/planning/tile-variants' },
                ]
            },
            {
                label: 'Oligos',
                iconComponent: OligosIcon,
                items: [
                    { label: 'Retriever Primers', to: '/oligos/primers/retriever-primers' },
                    { label: 'LABEL-seq Index Primers', to: '/oligos/primers/labelseq-index-primers' },
                    { label: 'Nextera Index Primers', to: '/oligos/primers/nextera-index-primers' },
                ]
            },
            {
                label: 'Reagents',
                iconComponent: BeakerOutlineIcon,
                items: [
                    { label: 'Restriction Enzymes', to: '/reagents/restriction-enzymes' },
                ]
            }
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
