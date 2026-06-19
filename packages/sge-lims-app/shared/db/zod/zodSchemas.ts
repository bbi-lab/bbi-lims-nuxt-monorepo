import { projects } from '../schema/project'
import { targets } from '../schema/target'
import { regions } from '../schema/region'
import { cycles } from '../schema/cycle'
import { transfectExperiments, transfectLotUsage, transfectTargets } from '../schema/transfect-experiment'
import { haCloningExperiments, sgRnaCloningExperiments, snvLibCloningExperiments } from '../schema/plasmid-experiment'
import { extractionExperiments, extractionLotUsage } from '../schema/extraction-experiment'
import { pcr1ExperimentMasterMixVolumes, pcr2ExperimentMasterMixVolumes, pcrExperiments } from '../schema/pcr-experiment'
import { pcrTypes } from '../schema/pcrTypes'
import { pellets } from '../schema/pellet'
import { createSchemaFactory } from 'drizzle-orm/zod'
import { z } from 'zod'

// Coerce date columns (timestamp -> z.coerce.date()) so that ISO date strings —
// from HTTP request bodies on the server and from DatePicker/edit-form values on
// the client — validate against date fields without per-field preprocess helpers.
// Coerced dates are still detected as `date` by the SmartForm field builder, so
// they render a DatePicker.
const { createSelectSchema, createInsertSchema } = createSchemaFactory({ coerce: { date: true } })
import { lots } from '../schema/lots'
import { reagents } from '../schema/reagents'
import { haPuc19Plasmids, sgRnaPlasmids, snvLibPlasmids } from '../schema/plasmid'
import { dna, rna } from '../schema/nucleic-acid'
import { amplificationPrimers, homologyArmPrimers, homologyArmPuc19Primers, indexPrimers, linearizationPrimers, preseq1Primers, preseq2Primers, rnaRtPrimers, rnaPreseq1Primers, rnaPreseq2Primers } from '../schema/primer'
import { sequencingRuns, sequencingRunSamples, sequencingRunExternalSamples } from '../schema/sequencing-run'
import { clonalHas, haPcrProducts, haPuc19GibsonProducts, haPuc19PcrProducts, sgeOligoLots, sgeOligos, sgRnaOligos, snvLibAmpProducts, snvLibGibsonProducts, snvLibGoldenGateProducts, snvLibLinProducts } from '../schema/oligos'
import { externalSamples } from '../schema/external-samples'
import { viewHaPuc19GibsonProductsWithCalcs, viewSnvLibGibsonProducts, viewPlatesWithWellCounts, viewSequencingRunAllSamples } from '../schema/views'

// tables
const selectProjectSchema = createSelectSchema(projects)
const insertProjectSchema = selectProjectSchema.omit({id: true})
const updateProjectSchema = insertProjectSchema

const selectTargetSchema = createSelectSchema(targets)
const insertTargetSchema = selectTargetSchema.omit({id: true}).merge(
    z.object({
     skipPositions: z.bigint({ coerce: true }).array().nullable(),
     fixedEdits: z.string().refine((value) => /^g[.][0-9]+[ACGT]>[ACGT]$/.test(value ?? ""), 'HGVS format required').array().nullable()
    }
))
const updateTargetSchema = insertTargetSchema

const selectRegionSchema = createSelectSchema(regions)
const insertRegionSchema = createSelectSchema(regions, {
    ampliconStart: z.bigint({ coerce: true }).nullable(),
    ampliconEnd: z.bigint({ coerce: true }).nullable(),
    snvLibraryStart: z.bigint({ coerce: true }).nullable(),
    snvLibraryEnd: z.bigint({ coerce: true }).nullable(),
}).omit({id: true}).partial()
const updateRegionSchema = insertRegionSchema

const selectCycleSchema = createSelectSchema(cycles)
const insertCycleSchema = selectCycleSchema.omit({id: true})
const updateCycleSchema = insertCycleSchema

const selectTransfectExperimentsSchema = createSelectSchema(transfectExperiments)
const insertTransfectExperimentsSchema = selectTransfectExperimentsSchema.omit({id: true, transfectionCount: true, technicianId: true})
const updateTransfectExperimentsSchema = insertTransfectExperimentsSchema

const selectTransfectTargetsSchema = createSelectSchema(transfectTargets)
const insertTransfectTargetsSchema = createSelectSchema(transfectTargets).omit({id: true}).partial()
const updateTransfectTargetsSchema = insertTransfectTargetsSchema

const selectTransfectLotUsageSchema = createSelectSchema(transfectLotUsage)
const insertTransfectLotUsageSchema = selectTransfectLotUsageSchema.omit({id: true}).partial()
const updateTransfectLotUsageSchema = insertTransfectLotUsageSchema

const selectSgRnaCloningExperimentsSchema = createSelectSchema(sgRnaCloningExperiments)
const insertSgRnaCloningExperimentsSchema = selectSgRnaCloningExperimentsSchema.omit({id: true})
const updateSgRnaCloningExperimentsSchema = insertSgRnaCloningExperimentsSchema

const selectHaCloningExperimentsSchema = createSelectSchema(haCloningExperiments)
const insertHaCloningExperimentsSchema = selectHaCloningExperimentsSchema.omit({id: true}).merge(
    z.object({
        haCloningExperimentTargets: z.object({ targetId: z.string() }).array().nonempty("Target(s) required"),
    }
))
const updateHaCloningExperimentsSchema = selectHaCloningExperimentsSchema.omit({id: true})

const selectHaPcrProductsSchema = createSelectSchema(haPcrProducts)
const insertHaPcrProductsSchema = selectHaPcrProductsSchema.omit({id: true})
const updateHaPcrProductsSchema = insertHaPcrProductsSchema

const selectHaPuc19PcrProductsSchema = createSelectSchema(haPuc19PcrProducts)
const insertHaPuc19PcrProductsSchema = selectHaPuc19PcrProductsSchema.omit({id: true})
const updateHaPuc19PcrProductsSchema = insertHaPuc19PcrProductsSchema

const selectHaPuc19GibsonProductsSchema = createSelectSchema(haPuc19GibsonProducts)
const insertHaPuc19GibsonProductsSchema = selectHaPuc19GibsonProductsSchema.omit({id: true})
const updateHaPuc19GibsonProductsSchema = insertHaPuc19GibsonProductsSchema

const selectHaPuc19PlasmidsSchema = createSelectSchema(haPuc19Plasmids)
const insertHaPuc19PlasmidsSchema = selectHaPuc19PlasmidsSchema.omit({id: true})
const updateHaPuc19PlasmidsSchema = insertHaPuc19PlasmidsSchema

const selectClonalHasSchema = createSelectSchema(clonalHas)
const insertClonalHasSchema = selectClonalHasSchema.omit({id: true})
const updateClonalHasSchema = insertClonalHasSchema

const selectSnvLibCloningExperimentsSchema = createSelectSchema(snvLibCloningExperiments)
const insertSnvLibCloningExperimentsSchema = selectSnvLibCloningExperimentsSchema.omit({id: true})
const updateSnvLibCloningExperimentsSchema = insertSnvLibCloningExperimentsSchema

const selectSgeOligosSchema = createSelectSchema(sgeOligos, {sequence: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable()})
const insertSgeOligosSchema = selectSgeOligosSchema.omit({id: true})
const updateSgeOligosSchema = insertSgeOligosSchema

const selectSgeOligoLotsSchema = createSelectSchema(sgeOligoLots)
const insertSgeOligoLotsSchema = selectSgeOligoLotsSchema.omit({id: true})
const updateSgeOligoLotsSchema = insertSgeOligoLotsSchema

const selectSnvLibAmpProductsSchema = createSelectSchema(snvLibAmpProducts)
const insertSnvLibAmpProductsSchema = selectSnvLibAmpProductsSchema.omit({id: true})
const updateSnvLibAmpProductsSchema = insertSnvLibAmpProductsSchema

const selectSnvLibLinProductsSchema = createSelectSchema(snvLibLinProducts)
const insertSnvLibLinProductsSchema = selectSnvLibLinProductsSchema.omit({id: true})
const updateSnvLibLinProductsSchema = insertSnvLibLinProductsSchema

const selectSnvLibGibsonProductsSchema = createSelectSchema(snvLibGibsonProducts, {benchlingLink: z.string().regex(new RegExp(/^https?:\/\/[^\s\/$.?#].[^\s]*$/i)).nullable()})
const insertSnvLibGibsonProductsSchema = selectSnvLibGibsonProductsSchema.omit({id: true})
const updateSnvLibGibsonProductsSchema = insertSnvLibGibsonProductsSchema

const selectSnvLibGoldenGateProductsSchema = createSelectSchema(snvLibGoldenGateProducts)
const insertSnvLibGoldenGateProductsSchema = selectSnvLibGoldenGateProductsSchema.omit({id: true})
const updateSnvLibGoldenGateProductsSchema = insertSnvLibGoldenGateProductsSchema

const selectPcrTypeSchema = createSelectSchema(pcrTypes)

const selectPcrExperimentsSchema = createSelectSchema(pcrExperiments)
const insertPcrExperimentsSchema = selectPcrExperimentsSchema.omit({id: true})
const updatePcrExperimentsSchema = insertPcrExperimentsSchema

const pcr1ExperimentMasterMixVolumesSchema = createSelectSchema(pcr1ExperimentMasterMixVolumes)
const insertPcr1ExperimentMasterMixVolumesSchema = pcr1ExperimentMasterMixVolumesSchema.omit({id: true})
const updatePcr1ExperimentMasterMixVolumesSchema = insertPcr1ExperimentMasterMixVolumesSchema
// For the preseq-1 volume-calcs sub-page where pcrExperimentId is set by context
const updatePcr1ExperimentMasterMixVolumesInExperimentSchema = insertPcr1ExperimentMasterMixVolumesSchema.omit({pcrExperimentId: true})

const pcr2ExperimentMasterMixVolumesSchema = createSelectSchema(pcr2ExperimentMasterMixVolumes)
const insertPcr2ExperimentMasterMixVolumesSchema = pcr2ExperimentMasterMixVolumesSchema.omit({id: true})
const updatePcr2ExperimentMasterMixVolumesSchema = insertPcr2ExperimentMasterMixVolumesSchema
// For the preseq-2 volume-calcs sub-page where pcrExperimentId is set by context
const updatePcr2ExperimentMasterMixVolumesInExperimentSchema = insertPcr2ExperimentMasterMixVolumesSchema.omit({pcrExperimentId: true})

const selectExtractionExperimentsSchema = createSelectSchema(extractionExperiments)
const insertExtractionExperimentsSchema = selectExtractionExperimentsSchema.omit({id: true})
const updateExtractionExperimentsSchema = insertExtractionExperimentsSchema

const selectExtractionLotUsageSchema = createSelectSchema(extractionLotUsage)
const insertExtractionLotUsageSchema = selectExtractionLotUsageSchema.omit({id: true}).partial()
const updateExtractionLotUsageSchema = insertExtractionLotUsageSchema

const selectSequencingRunsSchema = createSelectSchema(sequencingRuns)
const insertSequencingRunsSchema = selectSequencingRunsSchema.omit({id: true}).partial()
const updateSequencingRunsSchema = insertSequencingRunsSchema

const selectSequencingRunSamples = createSelectSchema(sequencingRunSamples)
const insertSequencingRunSamples = selectSequencingRunSamples.omit({id: true, createdAt: true, indexPrimer1Id: true, indexPrimer2Id: true, sourceWellId: true}).partial()
const updateSequencingRunSamples = insertSequencingRunSamples
// For the sequencing-run detail sub-page where sequencingRunId/dnaId/rnaId are set by context
const updateSequencingRunSamplesInRunSchema = insertSequencingRunSamples.omit({sequencingRunId: true, dnaId: true, rnaId: true})

const selectExternalSamples = createSelectSchema(externalSamples)
const insertExternalSamples = createSelectSchema(externalSamples, {
    customIndexSeq1: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable().optional(),
    customIndexSeq2: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable().optional(),
    indexPrimer1Id: z.string().uuid().nullable().optional(),
    indexPrimer2Id: z.string().uuid().nullable().optional(),
}).omit({id: true, createdAt: true}).partial()
const updateExternalSamples = insertExternalSamples

const selectSequencingRunExternalSamples = createSelectSchema(sequencingRunExternalSamples)
// For the sequencing-run detail sub-page where sequencingRunId and index fields are set by context
const updateSequencingRunExternalSamplesInRunSchema = createSelectSchema(sequencingRunExternalSamples, {
    customIndexSeq1: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable(),
    customIndexSeq2: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable(),
}).omit({id: true, sequencingRunId: true, customIndexSeq1: true, customIndexSeq2: true, createdAt: true, externalSampleId: true, indexPrimer1Id: true, indexPrimer2Id: true, sourceWellId: true}).partial()
const insertSequencingRunExternalSamples = createSelectSchema(sequencingRunExternalSamples, {
    customIndexSeq1: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable(),
    customIndexSeq2: z.string().regex(new RegExp(/^[ACGT]*$/i)).nullable(),
}).omit({id: true}).partial()
const updateSequencingRunExternalSamples = insertSequencingRunExternalSamples

const selectPelletsSchema = createSelectSchema(pellets)
const insertPelletsSchema = selectPelletsSchema.omit({id: true}).partial()
const updatePelletsSchema = insertPelletsSchema

const selectLotsSchema = createSelectSchema(lots)
const insertLotsSchema = selectLotsSchema.omit({id: true})
const updateLotsSchema = insertLotsSchema

const selectReagentsSchema = createSelectSchema(reagents)
const insertReagentsSchema = createSelectSchema(reagents).omit({id: true})
const updateReagentsSchema = insertReagentsSchema

const selectSgRnaPlasmidsSchema = createSelectSchema(sgRnaPlasmids)
const insertSgRnaPlasmidsSchema = createSelectSchema(sgRnaPlasmids, {externalLink: z.string().regex(new RegExp(/^https?:\/\/[^\s\/$.?#].[^\s]*$/i)).nullable()}).omit({id: true})
const updateSgRnaPlasmidsSchema = insertSgRnaPlasmidsSchema

const selectSnvLibPlasmidsSchema = createSelectSchema(snvLibPlasmids)
const insertSnvLibPlasmidsSchema = createSelectSchema(snvLibPlasmids, {externalLink: z.string().regex(new RegExp(/^https?:\/\/[^\s\/$.?#].[^\s]*$/i)).nullable()}).omit({id: true})
const updateSnvLibPlasmidsSchema = insertSnvLibPlasmidsSchema

const selectSgRnaOligosSchema = createSelectSchema(sgRnaOligos)
const insertSgRnaOligosSchema = createSelectSchema(sgRnaOligos).omit({id: true})
const updateSgRnaOligosSchema = insertSgRnaOligosSchema

const selectDnaSchema = createSelectSchema(dna)
const insertDnaSchema = createSelectSchema(dna).omit({id: true}).partial()
const updateDnaSchema = insertDnaSchema
// For the extraction-experiment detail sub-page where extractionExperimentId is set by context
const insertDnaInExperimentSchema = insertDnaSchema.omit({extractionExperimentId: true})
const updateDnaInExperimentSchema = insertDnaInExperimentSchema

const selectRnaSchema = createSelectSchema(rna)
const insertRnaSchema = createSelectSchema(rna).omit({id: true}).partial()
const updateRnaSchema = insertRnaSchema
// For the extraction-experiment detail sub-page where extractionExperimentId is set by context
const insertRnaInExperimentSchema = insertRnaSchema.omit({extractionExperimentId: true})
const updateRnaInExperimentSchema = insertRnaInExperimentSchema

const selectAmplificationPrimerSchema = createSelectSchema(amplificationPrimers)
const insertAmplificationPrimerSchema = createSelectSchema(amplificationPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i))}).omit({id: true})
const updateAmplificationPrimerSchema = insertAmplificationPrimerSchema

const selectHomologyArmPrimerSchema = createSelectSchema(homologyArmPrimers)
const insertHomologyArmPrimerSchema = createSelectSchema(homologyArmPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]*$/i))}).omit({id: true})
const updateHomologyArmPrimerSchema = insertHomologyArmPrimerSchema

const selectHomologyArmPuc19PrimerSchema = createSelectSchema(homologyArmPuc19Primers)
const insertHomologyArmPuc19PrimerSchema = createInsertSchema(homologyArmPuc19Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]*$/i)).optional()}).omit({id: true})
const updateHomologyArmPuc19PrimerSchema = insertHomologyArmPuc19PrimerSchema.partial()

const selectLinearizationPrimerSchema = createSelectSchema(linearizationPrimers)
const insertLinearizationPrimerSchema = createSelectSchema(linearizationPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i))}).omit({id: true})
const updateLinearizationPrimerSchema = insertLinearizationPrimerSchema

const selectIndexPrimerSchema = createSelectSchema(indexPrimers)
const insertIndexPrimerSchema = createInsertSchema(indexPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), indexSequence: z.string().regex(new RegExp(/^[ACGT]+$/i)) }).omit({id: true})
const updateIndexPrimerSchema = insertIndexPrimerSchema

const selectpreseq1PrimerSchema = createSelectSchema(preseq1Primers)
const insertpreseq1PrimerSchema = createInsertSchema(preseq1Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i))}).omit({id: true})
const updatepreseq1PrimerSchema = insertpreseq1PrimerSchema

const selectpreseq2PrimerSchema = createSelectSchema(preseq2Primers)
const insertpreseq2PrimerSchema = createInsertSchema(preseq2Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), adapterSequence: z.string().regex(new RegExp(/^[ACGT]+$/i))}).omit({id: true})
const updatepreseq2PrimerSchema = insertpreseq2PrimerSchema

const selectRnaRtPrimerSchema = createSelectSchema(rnaRtPrimers)
const insertRnaRtPrimerSchema = createInsertSchema(rnaRtPrimers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i))}).omit({id: true})
const updateRnaRtPrimerSchema = insertRnaRtPrimerSchema

const selectRnaPreseq1PrimerSchema = createSelectSchema(rnaPreseq1Primers)
const insertRnaPreseq1PrimerSchema = createInsertSchema(rnaPreseq1Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i))}).omit({id: true})
const updateRnaPreseq1PrimerSchema = insertRnaPreseq1PrimerSchema

const selectRnaPreseq2PrimerSchema = createSelectSchema(rnaPreseq2Primers)
const insertRnaPreseq2PrimerSchema = createInsertSchema(rnaPreseq2Primers, {sequence: z.string().regex(new RegExp(/^[ACGT]+$/i)), adapterSequence: z.string().regex(new RegExp(/^[ACGT]+$/i))}).omit({id: true})
const updateRnaPreseq2PrimerSchema = insertRnaPreseq2PrimerSchema

// views
const selectViewSequencingRunAllSamplesSchema = createSelectSchema(viewSequencingRunAllSamples)
const selectViewHaPuc19GibsonProductsWithCalcsSchema = createSelectSchema(viewHaPuc19GibsonProductsWithCalcs)
const selectViewSnvLibGibsonProductsSchema = createSelectSchema(viewSnvLibGibsonProducts)

// export all schemas
export const schemas = {
    // tables
    projects: {
        select: selectProjectSchema,
        insert: insertProjectSchema,
        update: updateProjectSchema,
    },
    targets: {
        select: selectTargetSchema,
        insert: insertTargetSchema,
        update: updateTargetSchema,
    },
    regions: {
        select: selectRegionSchema,
        insert: insertRegionSchema,
        update: updateRegionSchema,
    },
    cycles: {
        select: selectCycleSchema,
        insert: insertCycleSchema,
        update: updateCycleSchema,
    },
    transfectExperiments: {
        select: selectTransfectExperimentsSchema,
        insert: insertTransfectExperimentsSchema,
        update: updateTransfectExperimentsSchema,
    },
    transfectTargets: {
        select: selectTransfectTargetsSchema,
        insert: insertTransfectTargetsSchema,
        update: updateTransfectTargetsSchema,
    },
    transfectLotUsage: {
        select: selectTransfectLotUsageSchema,
        insert: insertTransfectLotUsageSchema,
        update: updateTransfectLotUsageSchema,
    },
    sgRnaCloningExperiments: {
        select: selectSgRnaCloningExperimentsSchema,
        insert: insertSgRnaCloningExperimentsSchema,
        update: updateSgRnaCloningExperimentsSchema,
    },
    haCloningExperiments: {
        select: selectHaCloningExperimentsSchema,
        insert: insertHaCloningExperimentsSchema,
        update: updateHaCloningExperimentsSchema,
    },
    haPcrProducts: {
        select: selectHaPcrProductsSchema,
        insert: insertHaPcrProductsSchema,
        update: updateHaPcrProductsSchema,
    },
    haPuc19PcrProducts: {
        select: selectHaPuc19PcrProductsSchema,
        insert: insertHaPuc19PcrProductsSchema,
        update: updateHaPuc19PcrProductsSchema,
    },
    haPuc19GibsonProducts: {
        select: selectHaPuc19GibsonProductsSchema,
        insert: insertHaPuc19GibsonProductsSchema,
        update: updateHaPuc19GibsonProductsSchema,
    },
    haPuc19Plasmids: {
        select: selectHaPuc19PlasmidsSchema,
        insert: insertHaPuc19PlasmidsSchema,
        update: updateHaPuc19PlasmidsSchema,
    },
    clonalHas: {
        select: selectClonalHasSchema,
        insert: insertClonalHasSchema,
        update: updateClonalHasSchema,
    },
    snvLibCloningExperiments: {
        select: selectSnvLibCloningExperimentsSchema,
        insert: insertSnvLibCloningExperimentsSchema,
        update: updateSnvLibCloningExperimentsSchema,
    },
    sgeOligos: {
        select: selectSgeOligosSchema,
        insert: insertSgeOligosSchema,
        update: updateSgeOligosSchema,
    },
    sgeOligoLots: {
        select: selectSgeOligoLotsSchema,
        insert: insertSgeOligoLotsSchema,
        update: updateSgeOligoLotsSchema,
    },
    snvLibAmpProducts: {
        select: selectSnvLibAmpProductsSchema,
        insert: insertSnvLibAmpProductsSchema,
        update: updateSnvLibAmpProductsSchema,
    },
    snvLibLinProducts: {
        select: selectSnvLibLinProductsSchema,
        insert: insertSnvLibLinProductsSchema,
        update: updateSnvLibLinProductsSchema,
    },
    snvLibGibsonProducts: {
        select: selectSnvLibGibsonProductsSchema,
        insert: insertSnvLibGibsonProductsSchema,
        update: updateSnvLibGibsonProductsSchema,
    },
    snvLibGoldenGateProducts: {
        select: selectSnvLibGoldenGateProductsSchema,
        insert: insertSnvLibGoldenGateProductsSchema,
        update: updateSnvLibGoldenGateProductsSchema,
    },
    pcrTypes: {
        select: selectPcrTypeSchema,
    },
    pcrExperiments: {
        select: selectPcrExperimentsSchema,
        insert: insertPcrExperimentsSchema,
        update: updatePcrExperimentsSchema,
    },
    pcr1ExperimentMasterMixVolumes: {
        select: pcr1ExperimentMasterMixVolumesSchema,
        insert: insertPcr1ExperimentMasterMixVolumesSchema,
        update: updatePcr1ExperimentMasterMixVolumesSchema,
        updateInExperiment: updatePcr1ExperimentMasterMixVolumesInExperimentSchema,
    },
    pcr2ExperimentMasterMixVolumes: {
        select: pcr2ExperimentMasterMixVolumesSchema,
        insert: insertPcr2ExperimentMasterMixVolumesSchema,
        update: updatePcr2ExperimentMasterMixVolumesSchema,
        updateInExperiment: updatePcr2ExperimentMasterMixVolumesInExperimentSchema,
    },
    sequencingRuns: {
        select: selectSequencingRunsSchema,
        insert: insertSequencingRunsSchema,
        update: updateSequencingRunsSchema,
    },
    sequencingRunSamples: {
        select: selectSequencingRunSamples,
        insert: insertSequencingRunSamples,
        update: updateSequencingRunSamples,
        updateInRun: updateSequencingRunSamplesInRunSchema,
    },
    externalSamples: {
        select: selectExternalSamples,
        insert: insertExternalSamples,
        update: updateExternalSamples,
    },
    sequencingRunExternalSamples: {
        select: selectSequencingRunExternalSamples,
        insert: insertSequencingRunExternalSamples,
        update: updateSequencingRunExternalSamples,
        updateInRun: updateSequencingRunExternalSamplesInRunSchema,
    },
    extractionExperiments: {
        select: selectExtractionExperimentsSchema,
        insert: insertExtractionExperimentsSchema,
        update: updateExtractionExperimentsSchema,
    },
    extractionLotUsage: {
        select: selectExtractionLotUsageSchema,
        insert: insertExtractionLotUsageSchema,
        update: updateExtractionLotUsageSchema,
    },
    sgRnaPlasmids: {
        select: selectSgRnaPlasmidsSchema,
        insert: insertSgRnaPlasmidsSchema,
        update: updateSgRnaPlasmidsSchema,
    },
    snvLibPlasmids: {
        select: selectSnvLibPlasmidsSchema,
        insert: insertSnvLibPlasmidsSchema,
        update: updateSnvLibPlasmidsSchema,
    },
    dna: {
        select: selectDnaSchema,
        insert: insertDnaSchema,
        update: updateDnaSchema,
        insertInExperiment: insertDnaInExperimentSchema,
        updateInExperiment: updateDnaInExperimentSchema,
    },
    rna: {
        select: selectRnaSchema,
        insert: insertRnaSchema,
        update: updateRnaSchema,
        insertInExperiment: insertRnaInExperimentSchema,
        updateInExperiment: updateRnaInExperimentSchema,
    },
    sgRnaOligos: {
        select: selectSgRnaOligosSchema,
        insert: insertSgRnaOligosSchema,
        update: updateSgRnaOligosSchema,
    },
    pellets: {
        select: selectPelletsSchema,
        insert: insertPelletsSchema,
        update: updatePelletsSchema,
    },
    lots: {
        select: selectLotsSchema,
        insert: insertLotsSchema,
        update: updateLotsSchema,
    },
    reagents: {
        select: selectReagentsSchema,
        insert: insertReagentsSchema,
        update: updateReagentsSchema,
    },
    amplificationPrimers: {
        select: selectAmplificationPrimerSchema,
        insert: insertAmplificationPrimerSchema,
        update: updateAmplificationPrimerSchema,
    },
    homologyArmPrimers: {
        select: selectHomologyArmPrimerSchema,
        insert: insertHomologyArmPrimerSchema,
        update: updateHomologyArmPrimerSchema,
    },
    homologyArmPuc19Primers: {
        select: selectHomologyArmPuc19PrimerSchema,
        insert: insertHomologyArmPuc19PrimerSchema,
        update: updateHomologyArmPuc19PrimerSchema,
    },
    linearizationPrimers: {
        select: selectLinearizationPrimerSchema,
        insert: insertLinearizationPrimerSchema,
        update: updateLinearizationPrimerSchema,
    },
    indexPrimers: {
        select: selectIndexPrimerSchema,
        insert: insertIndexPrimerSchema,
        update: updateIndexPrimerSchema,
    },
    preseq1Primers: {
        select: selectpreseq1PrimerSchema,
        insert: insertpreseq1PrimerSchema,
        update: updatepreseq1PrimerSchema,
    },
    preseq2Primers: {
        select: selectpreseq2PrimerSchema,
        insert: insertpreseq2PrimerSchema,
        update: updatepreseq2PrimerSchema,
    },
    rnaRtPrimers: {
        select: selectRnaRtPrimerSchema,
        insert: insertRnaRtPrimerSchema,
        update: updateRnaRtPrimerSchema,
    },
    rnaPreseq1Primers: {
        select: selectRnaPreseq1PrimerSchema,
        insert: insertRnaPreseq1PrimerSchema,
        update: updateRnaPreseq1PrimerSchema,
    },
    rnaPreseq2Primers: {
        select: selectRnaPreseq2PrimerSchema,
        insert: insertRnaPreseq2PrimerSchema,
        update: updateRnaPreseq2PrimerSchema,
    },
    // views
    viewSequencingRunAllSamples: {
        select: selectViewSequencingRunAllSamplesSchema
    },
    viewHaPuc19GibsonProductsWithCalcs: {
        select: selectViewHaPuc19GibsonProductsWithCalcsSchema
    },
    viewSnvLibGibsonProducts: {
        select: selectViewSnvLibGibsonProductsSchema
    },
}
