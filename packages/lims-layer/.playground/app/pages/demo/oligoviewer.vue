<script setup>

</script>

<template>
    <div class="p-4">
        <OligoViewer
            name="MRAS_block1_WT"
            :data="[
                { label: 'AMP primer (F)', type: 'AMP primer', sequence: 'GCATAAAGTTGACAGGCCAG' },
                { label: 'BsaI (+1)', type: 'BsaI', sequence: 'GGTCTCT' },
                { label: 'overhang', type: 'overhang', sequence: 'CGTC' },
                { label: 'SapI (+1)', type: 'SapI', sequence: 'GCTCTTCC' },
                { label: 'Tile (WT)', type: 'tile WT', sequence: 'ATGGCCACATCAGCCGTCCCATCCGACAACCTTCCCACATACAAATTGGTCGTGGTTGGGGATGGAGGGGTGGGTAAGTCAGCCCTTACTATCCAATTCTTCCAAAAAATCTTCGTGCCCGACTACGATCCGACCATTGAAGACAGTTACCTGA' },
                { label: 'BsaI (+1) revcomp', type: 'BsaI', sequence: 'AGAGACC' },
                { label: 'AMP primer (R)', type: 'AMP primer', sequence: 'CCGATAGTTCCAGCTAGCAT' },
            ]" />
    </div>
</template>
