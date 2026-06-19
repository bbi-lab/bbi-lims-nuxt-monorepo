<script setup>
import _ from 'lodash'
import { Icon } from '#components'
const { user } = useUserSession()

const DnaIcon = h(Icon, { name: 'mdi:dna', class: 'm-1' })
const DotsTriangleIcon = h(Icon, { name: 'mdi:dots-triangle', class: 'm-1' })
const MoleculeIcon = h(Icon, { name: 'mdi:molecule', class: 'm-1' })
const OligosIcon = h(Icon, { name: 'fluent:molecule-16-filled', class: 'm-1' })
const PhGridNineFill = h(Icon, { name: 'ph:grid-nine-fill', class: 'm-1' })
const ExperimentIcon = h(Icon, { name: 'icon-park-solid:experiment', class: 'm-1' })
const BeakerOutlineIcon = h(Icon, { name: 'mdi:beaker-outline', class: 'm-1' })
const RunIcon = h(Icon, { name: 'fluent:run-16-filled', class: 'm-1' })
const MagicIcon = h(Icon, { name: 'mdi:magic', class: 'm-1' })

const model = ref([
    {
        label: 'Menu',
        items: [
            { label: 'Home', icon: 'pi pi-fw pi-home', to: '/' },
            { label: 'Projects', icon: 'pi pi-fw pi-briefcase', to: '/projects' },
            { label: 'Cycles', icon: 'pi pi-fw pi-spinner-dotted', to: '/cycles' },
            { label: 'Targets', icon: 'pi pi-fw pi-bullseye', to: '/targets' },
            { label: 'Genes', iconComponent: DnaIcon, to: '/genes' },
            { label: 'Regions', icon: 'pi pi-fw pi-map', to: '/regions' },
            {
                label: 'Plasmids',
                icon: 'pi pi-fw pi-spinner',
                items: [
                    { label: 'sgRNA', to: '/sg-rna-plasmids' },
                    { label: 'SNV Library', to: '/snv-lib-plasmids' },
                    { label: 'HA pUC19', to: '/ha-puc-19-plasmids' },
                ]
            },
            { label: 'Pellets', iconComponent: DotsTriangleIcon, to: '/pellets' },
            {
                label: 'Nucleic Acids',
                iconComponent: MoleculeIcon,
                items: [
                    { label: 'DNA', to: '/dna' },
                    { label: 'RNA', to: '/rna' },
                ]
            },
            {
                label: 'Oligos',
                iconComponent: OligosIcon,
                items: [
                    { label: 'sgRNA', to: '/sg-rna-oligos' },
                    { label: 'SGE Oligos', to: '/sge-oligos' },
                    { label: 'Clonal HA', to: '/clonal-has' },
                    { label: 'HA products', items: [
                        { label: 'HA PCR products', to: '/ha-pcr-products' },
                        { label: 'HA pUC19 PCR products', to: '/ha-puc-19-pcr-products' },
                        { label: 'HA pUC19 Gibson products', to: '/ha-puc-19-gibson-products' },
                    ]},
                    { label: 'SNVlib products', items: [
                        { label: 'SNVlib AMP products', to: '/snv-lib-amp-products' },
                        { label: 'SNVlib LIN products', to: '/snv-lib-lin-products' },
                        { label: 'SNVlib Gibson products', to: '/snv-lib-gibson-products' },
                        { label: 'SNVlib Golden Gate products', to: '/snv-lib-golden-gate-products' },
                    ]},
                    { label: 'Primers', items: [
                        { label: 'Amplification primers', to: '/amplification-primers' },
                        { label: 'Linearization primers', to: '/linearization-primers' },
                        { label: 'Homology Arm primers', to: '/homology-arm-primers' },
                        { label: 'Homology Arm pUC19 primers', to: '/homology-arm-puc-19-primers' },
                        { label: 'DNA PreSeq 1 primers', to: '/preseq-1-primers' },
                        { label: 'DNA PreSeq 2 primers', to: '/preseq-2-primers' },
                        { label: 'RNA RT primers', to: '/rna-rt-primers' },
                        { label: 'RNA PreSeq 1 primers', to: '/rna-preseq-1-primers' },
                        { label: 'RNA PreSeq 2 primers', to: '/rna-preseq-2-primers' },
                        { label: 'Index primers', to: '/index-primers' },
                    ]},
                ]
            },
            { label: 'Plates/Storage', iconComponent: PhGridNineFill, to: '/plates' },
            {
                label: 'Experiments',
                iconComponent: ExperimentIcon,
                items: [
                    { label: 'sgRNA Cloning', to: '/sg-rna-cloning-experiments' },
                    { label: 'HA Cloning', to: '/ha-cloning-experiments' },
                    { label: 'SNV Library Cloning', to: '/snv-lib-cloning-experiments' },
                    { label: 'Transfection', to: '/transfect-experiments' },
                    { label: 'Extraction', to: '/extraction-experiments' },
                    { label: 'PCR', to: '/pcr-experiments' },
                ]
            },
            {
                label: 'Reagents',
                iconComponent: BeakerOutlineIcon,
                items: [
                    { label: 'Lots', to: '/lots' },
                    { label: 'Reagent List', to: '/reagents' },
                ]
            },
            {
                label: 'Sequencing',
                iconComponent: RunIcon,
                items: [
                    { label: 'Internal Samples', to: '/internal-samples' },
                    { label: 'External Samples', to: '/external-samples' },
                    { label: 'Sequencing Runs', to: '/sequencing-runs' },
                ]
            },
            {
                label: 'External',
                icon: 'pi pi-fw pi-external-link',
                items: [
                    { label: 'UCSC In-silico PCR', url: 'https://genome.ucsc.edu/cgi-bin/hgPcr', target: '_blank' },
                    { label: 'UCSC Blat', url: 'https://genome.ucsc.edu/cgi-bin/hgBlat', target: '_blank' },
                    { label: 'Primer3', url: 'https://bioinfo.ut.ee/primer3-0.4.0', target: '_blank' },
                ]
            },
            { label: 'Experimental', class: 'italic', iconComponent: MagicIcon,
                items: [
                    { label: 'JBrowse', to: '/experimental/jbrowse' },
                ]
            },
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
