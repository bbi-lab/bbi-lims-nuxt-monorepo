import { defineRelations } from 'drizzle-orm'

// lims-layer tables
import { users, userGroups, userGroupMemberships, passwordResetTokens } from 'lims-layer/server/db/schema/user'
import { plateTypes } from 'lims-layer/shared/db/schema/plateTypes'

// sge tables
import { genes } from 'lims-layer/shared/db/schema/gene'
import { ensemblRefseqIds } from '#shared/db/schema/ensembl-refseq-ids'
import { targets } from '#shared/db/schema/target'
import { regions } from '#shared/db/schema/region'
import { cycles } from '#shared/db/schema/cycle'
import { projects } from '#shared/db/schema/project'
import { pellets } from '#shared/db/schema/pellet'
import { lots } from '#shared/db/schema/lots'
import { reagents } from '#shared/db/schema/reagents'
import { dna, rna } from '#shared/db/schema/nucleic-acid'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { wellables, wellContents, wellContentSources, wells } from 'lims-layer/shared/db/schema/well'
import {
  amplificationPrimers, homologyArmPrimers, homologyArmPrimerTargets,
  homologyArmPuc19Primers, indexPrimers, linearizationPrimers,
  preseq1Primers, preseq1PrimerTargets, preseq2Primers,
  rnaPreseq1Primers, rnaPreseq1PrimerTargets, rnaPreseq2Primers,
  rnaPreseq2PrimerTargets, rnaRtPrimers,
} from '#shared/db/schema/primer'
import { haPuc19Plasmids, sgRnaPlasmids, sgRnaPlasmidTargets, snvLibPlasmids } from '#shared/db/schema/plasmid'
import {
  clonalHas, clonalHaTargets, haPcrProducts, haPuc19GibsonProducts, haPuc19PcrProducts,
  sgeOligoLots, sgeOligos, sgRnaOligos, sgRnaOligoTargets,
  snvLibAmpProducts, snvLibGibsonProducts, snvLibGoldenGateProducts, snvLibLinProducts,
} from '#shared/db/schema/oligos'
import { pcrTypes } from '#shared/db/schema/pcrTypes'
import { pcrExperiments, pcrExperimentTargets, pcr1ExperimentMasterMixVolumes, pcr2ExperimentMasterMixVolumes } from '#shared/db/schema/pcr-experiment'
import { haCloningExperiments, haCloningExperimentTargets, sgRnaCloningExperiments, snvLibCloningExperiments } from '#shared/db/schema/plasmid-experiment'
import { extractionExperiments, extractionLotUsage } from '#shared/db/schema/extraction-experiment'
import { transfectExperiments, transfectLotUsage, transfectTargets } from '#shared/db/schema/transfect-experiment'
import { sequencingRuns, sequencingRunSamples, sequencingRunExternalSamples } from '#shared/db/schema/sequencing-run'
import { externalSamples } from '#shared/db/schema/external-samples'
import { viewHaPuc19GibsonProductsWithCalcs, viewPlatesWithWellCounts, viewSequencingRunAllSamples, viewSnvLibGibsonProducts } from '#shared/db/schema/views'

export const relations = defineRelations({
  // lims-layer tables
  users,
  userGroups,
  userGroupMemberships,
  passwordResetTokens,
  plateTypes,

  // sge tables
  genes,
  ensemblRefseqIds,
  targets,
  regions,
  cycles,
  projects,
  pellets,
  lots,
  reagents,
  dna,
  rna,
  plates,
  wells,
  wellContents,
  wellables,
  wellContentSources,
  amplificationPrimers,
  homologyArmPrimers,
  homologyArmPrimerTargets,
  homologyArmPuc19Primers,
  indexPrimers,
  linearizationPrimers,
  preseq1Primers,
  preseq1PrimerTargets,
  preseq2Primers,
  rnaPreseq1Primers,
  rnaPreseq1PrimerTargets,
  rnaPreseq2Primers,
  rnaPreseq2PrimerTargets,
  rnaRtPrimers,
  haPuc19Plasmids,
  sgRnaPlasmids,
  sgRnaPlasmidTargets,
  snvLibPlasmids,
  clonalHas,
  clonalHaTargets,
  haPcrProducts,
  haPuc19GibsonProducts,
  haPuc19PcrProducts,
  sgeOligoLots,
  sgeOligos,
  sgRnaOligos,
  sgRnaOligoTargets,
  snvLibAmpProducts,
  snvLibGibsonProducts,
  snvLibGoldenGateProducts,
  snvLibLinProducts,
  pcrTypes,
  pcrExperiments,
  pcrExperimentTargets,
  pcr1ExperimentMasterMixVolumes,
  pcr2ExperimentMasterMixVolumes,
  haCloningExperiments,
  haCloningExperimentTargets,
  sgRnaCloningExperiments,
  snvLibCloningExperiments,
  extractionExperiments,
  extractionLotUsage,
  transfectExperiments,
  transfectLotUsage,
  transfectTargets,
  sequencingRuns,
  sequencingRunSamples,
  sequencingRunExternalSamples,
  externalSamples,

  // sge views
  viewHaPuc19GibsonProductsWithCalcs,
  viewPlatesWithWellCounts,
  viewSequencingRunAllSamples,
  viewSnvLibGibsonProducts,
}, (r) => ({
  // ── lims-layer relations ──────────────────────────────────────────────────
  users: {
    userGroupMemberships: r.many.userGroupMemberships(),
  },
  userGroups: {
    userGroupMemberships: r.many.userGroupMemberships(),
  },
  userGroupMemberships: {
    userGroup: r.one.userGroups({
      from: r.userGroupMemberships.userGroupId,
      to: r.userGroups.id,
    }),
    user: r.one.users({
      from: r.userGroupMemberships.userId,
      to: r.users.id,
    }),
  },
  plates: {
    wells: r.many.wells(),
    plateTypeRef: r.one.plateTypes({
      from: r.plates.plateType,
      to: r.plateTypes.value,
    }),
    pcrExperiments: r.many.pcrExperiments(),
    sgRnaCloningExperiments: r.many.sgRnaCloningExperiments(),
  },
  plateTypes: {
    plates: r.many.plates(),
  },
  wells: {
    plate: r.one.plates({
      from: r.wells.plateId,
      to: r.plates.id,
    }),
    wellContents: r.many.wellContents(),
  },
  wellContents: {
    well: r.one.wells({
      from: r.wellContents.wellId,
      to: r.wells.id,
    }),
    wellable: r.one.wellables({
      from: r.wellContents.wellableId,
      to: r.wellables.id,
    }),
    wellContentSources: r.many.wellContentSources(),
  },
  wellables: {
    wellContents: r.many.wellContents(),
    amplificationPrimer: r.one.amplificationPrimers({
      from: r.wellables.id,
      to: r.amplificationPrimers.id,
    }),
    linearizationPrimer: r.one.linearizationPrimers({
      from: r.wellables.id,
      to: r.linearizationPrimers.id,
    }),
    homologyArmPrimer: r.one.homologyArmPrimers({
      from: r.wellables.id,
      to: r.homologyArmPrimers.id,
    }),
    homologyArmPuc19Primer: r.one.homologyArmPuc19Primers({
      from: r.wellables.id,
      to: r.homologyArmPuc19Primers.id,
    }),
    preseq1Primer: r.one.preseq1Primers({
      from: r.wellables.id,
      to: r.preseq1Primers.id,
    }),
    preseq2Primer: r.one.preseq2Primers({
      from: r.wellables.id,
      to: r.preseq2Primers.id,
    }),
    rnaPreseq1Primer: r.one.rnaPreseq1Primers({
      from: r.wellables.id,
      to: r.rnaPreseq1Primers.id,
    }),
    rnaPreseq2Primer: r.one.rnaPreseq2Primers({
      from: r.wellables.id,
      to: r.rnaPreseq2Primers.id,
    }),
    rnaRtPrimer: r.one.rnaRtPrimers({
      from: r.wellables.id,
      to: r.rnaRtPrimers.id,
    }),
    indexPrimer: r.one.indexPrimers({
      from: r.wellables.id,
      to: r.indexPrimers.id,
    }),
    dna: r.one.dna({
      from: r.wellables.id,
      to: r.dna.id,
    }),
    rna: r.one.rna({
      from: r.wellables.id,
      to: r.rna.id,
    }),
    pellet: r.one.pellets({
      from: r.wellables.id,
      to: r.pellets.id,
    }),
    sgRnaPlasmid: r.one.sgRnaPlasmids({
      from: r.wellables.id,
      to: r.sgRnaPlasmids.id,
    }),
    snvLibPlasmid: r.one.snvLibPlasmids({
      from: r.wellables.id,
      to: r.snvLibPlasmids.id,
    }),
    sgRnaOligo: r.one.sgRnaOligos({
      from: r.wellables.id,
      to: r.sgRnaOligos.id,
    }),
    externalSample: r.one.externalSamples({
      from: r.wellables.id,
      to: r.externalSamples.id,
    }),
    haPcrProduct: r.one.haPcrProducts({
      from: r.wellables.id,
      to: r.haPcrProducts.id,
    }),
    haPuc19PcrProduct: r.one.haPuc19PcrProducts({
      from: r.wellables.id,
      to: r.haPuc19PcrProducts.id,
    }),
    haPuc19GibsonProduct: r.one.haPuc19GibsonProducts({
      from: r.wellables.id,
      to: r.haPuc19GibsonProducts.id,
    }),
    haPuc19Plasmid: r.one.haPuc19Plasmids({
      from: r.wellables.id,
      to: r.haPuc19Plasmids.id,
    }),
    snvLibAmpProduct: r.one.snvLibAmpProducts({
      from: r.wellables.id,
      to: r.snvLibAmpProducts.id,
    }),
    snvLibLinProduct: r.one.snvLibLinProducts({
      from: r.wellables.id,
      to: r.snvLibLinProducts.id,
    }),
    snvLibGibsonProduct: r.one.snvLibGibsonProducts({
      from: r.wellables.id,
      to: r.snvLibGibsonProducts.id,
    }),
    clonalHa: r.one.clonalHas({
      from: r.wellables.id,
      to: r.clonalHas.id,
    }),
  },
  wellContentSources: {
    wellContent: r.one.wellContents({
      from: r.wellContentSources.wellContentId,
      to: r.wellContents.id,
    }),
    sourceWell: r.one.wells({
      from: r.wellContentSources.sourceWellId,
      to: r.wells.id,
    }),
    createdByUser: r.one.users({
      from: r.wellContentSources.createdBy,
      to: r.users.id,
    }),
  },
  // ── sge domain relations ──────────────────────────────────────────────────
  genes: {
    regions: r.many.regions(),
    rnaRtPrimers: r.many.rnaRtPrimers(),
    // The gene's MANE Select transcript, matched on its RefSeq accession
    ensemblRefseqId: r.one.ensemblRefseqIds({
      from: r.genes.transcriptsAccession,
      to: r.ensemblRefseqIds.maneSelectRefseqAcc,
    }),
  },
  ensemblRefseqIds: {
    genes: r.many.genes(),
  },
  regions: {
    gene: r.one.genes({
      from: r.regions.geneId,
      to: r.genes.id,
    }),
    targets: r.many.targets(),
  },
  targets: {
    project: r.one.projects({
      from: r.targets.projectId,
      to: r.projects.id,
    }),
    region: r.one.regions({
      from: r.targets.regionId,
      to: r.regions.id,
    }),
    transfectTargets: r.many.transfectTargets(),
    amplificationPrimers: r.many.amplificationPrimers(),
    linearizationPrimers: r.many.linearizationPrimers(),
    preseq1PrimerTargets: r.many.preseq1PrimerTargets(),
    preseq2Primers: r.many.preseq2Primers(),
    sgRnaPlasmidTargets: r.many.sgRnaPlasmidTargets(),
    snvLibPlasmids: r.many.snvLibPlasmids(),
  },
  projects: {
    targets: r.many.targets(),
  },
  cycles: {
    transfectExperiments: r.many.transfectExperiments(),
  },
  transfectExperiments: {
    technician: r.one.users({
      from: r.transfectExperiments.technicianId,
      to: r.users.id,
    }),
    cycle: r.one.cycles({
      from: r.transfectExperiments.cycleId,
      to: r.cycles.id,
    }),
    transfectTargets: r.many.transfectTargets(),
    transfectLotUsage: r.many.transfectLotUsage(),
  },
  transfectTargets: {
    experiment: r.one.transfectExperiments({
      from: r.transfectTargets.experimentId,
      to: r.transfectExperiments.id,
    }),
    target: r.one.targets({
      from: r.transfectTargets.targetId,
      to: r.targets.id,
    }),
    snvLib: r.one.snvLibPlasmids({
      from: r.transfectTargets.snvLibPlasmidId,
      to: r.snvLibPlasmids.id,
    }),
    sgRna: r.one.sgRnaPlasmids({
      from: r.transfectTargets.sgRnaPlasmidId,
      to: r.sgRnaPlasmids.id,
    }),
    pellets: r.many.pellets(),
    pcrExperimentTargets: r.many.pcrExperimentTargets(),
  },
  transfectLotUsage: {
    experiment: r.one.transfectExperiments({
      from: r.transfectLotUsage.experimentId,
      to: r.transfectExperiments.id,
    }),
    lot: r.one.lots({
      from: r.transfectLotUsage.lotId,
      to: r.lots.id,
    }),
  },
  pcrTypes: {
    pcrExperiments: r.many.pcrExperiments(),
  },
  pcrExperiments: {
    technician: r.one.users({
      from: r.pcrExperiments.technicianId,
      to: r.users.id,
    }),
    plate: r.one.plates({
      from: r.pcrExperiments.plateId,
      to: r.plates.id,
    }),
    pcrTypeRef: r.one.pcrTypes({
      from: r.pcrExperiments.pcrType,
      to: r.pcrTypes.value,
    }),
    pcrExperimentTargets: r.many.pcrExperimentTargets(),
    pcr1ExperimentMasterMixVolumes: r.many.pcr1ExperimentMasterMixVolumes(),
    pcr2ExperimentMasterMixVolumes: r.many.pcr2ExperimentMasterMixVolumes(),
  },
  pcrExperimentTargets: {
    pcrExperiment: r.one.pcrExperiments({
      from: r.pcrExperimentTargets.pcrExperimentId,
      to: r.pcrExperiments.id,
    }),
    transfectTarget: r.one.transfectTargets({
      from: r.pcrExperimentTargets.transfectTargetId,
      to: r.transfectTargets.id,
    }),
  },
  pcr1ExperimentMasterMixVolumes: {
    pcrExperiment: r.one.pcrExperiments({
      from: r.pcr1ExperimentMasterMixVolumes.pcrExperimentId,
      to: r.pcrExperiments.id,
    }),
  },
  pcr2ExperimentMasterMixVolumes: {
    pcrExperiment: r.one.pcrExperiments({
      from: r.pcr2ExperimentMasterMixVolumes.pcrExperimentId,
      to: r.pcrExperiments.id,
    }),
  },
  extractionExperiments: {
    technician: r.one.users({
      from: r.extractionExperiments.technicianId,
      to: r.users.id,
    }),
    dna: r.many.dna(),
    rna: r.many.rna(),
    extractionLotUsage: r.many.extractionLotUsage(),
  },
  extractionLotUsage: {
    experiment: r.one.extractionExperiments({
      from: r.extractionLotUsage.experimentId,
      to: r.extractionExperiments.id,
    }),
    lot: r.one.lots({
      from: r.extractionLotUsage.lotId,
      to: r.lots.id,
    }),
  },
  pellets: {
    harvestedBy: r.one.users({
      from: r.pellets.harvestedById,
      to: r.users.id,
    }),
    transfectTarget: r.one.transfectTargets({
      from: r.pellets.transfectTargetId,
      to: r.transfectTargets.id,
    }),
    wellable: r.one.wellables({
      from: r.pellets.id,
      to: r.wellables.id,
    }),
    dna: r.many.dna(),
    rna: r.many.rna(),
  },
  dna: {
    extractionExperiment: r.one.extractionExperiments({
      from: r.dna.extractionExperimentId,
      to: r.extractionExperiments.id,
    }),
    pellet: r.one.pellets({
      from: r.dna.pelletId,
      to: r.pellets.id,
    }),
    wellable: r.one.wellables({
      from: r.dna.id,
      to: r.wellables.id,
    }),
  },
  rna: {
    extractionExperiment: r.one.extractionExperiments({
      from: r.rna.extractionExperimentId,
      to: r.extractionExperiments.id,
    }),
    pellet: r.one.pellets({
      from: r.rna.pelletId,
      to: r.pellets.id,
    }),
    wellable: r.one.wellables({
      from: r.rna.id,
      to: r.wellables.id,
    }),
  },
  lots: {
    reagent: r.one.reagents({
      from: r.lots.reagentId,
      to: r.reagents.id,
    }),
    sgeOligoLots: r.many.sgeOligoLots(),
  },
  sequencingRuns: {
    samples: r.many.sequencingRunSamples(),
    externalSamples: r.many.sequencingRunExternalSamples(),
  },
  sequencingRunSamples: {
    sequencingRun: r.one.sequencingRuns({
      from: r.sequencingRunSamples.sequencingRunId,
      to: r.sequencingRuns.id,
    }),
    dna: r.one.dna({
      from: r.sequencingRunSamples.dnaId,
      to: r.dna.id,
    }),
    rna: r.one.rna({
      from: r.sequencingRunSamples.rnaId,
      to: r.rna.id,
    }),
    indexPrimer1: r.one.indexPrimers({
      from: r.sequencingRunSamples.indexPrimer1Id,
      to: r.indexPrimers.id,
      alias: 'indexPrimer1',
    }),
    indexPrimer2: r.one.indexPrimers({
      from: r.sequencingRunSamples.indexPrimer2Id,
      to: r.indexPrimers.id,
      alias: 'indexPrimer2',
    }),
    sourceWell: r.one.wells({
      from: r.sequencingRunSamples.sourceWellId,
      to: r.wells.id,
    }),
  },
  externalSamples: {
    wellable: r.one.wellables({
      from: r.externalSamples.id,
      to: r.wellables.id,
    }),
    indexPrimer1: r.one.indexPrimers({
      from: r.externalSamples.indexPrimer1Id,
      to: r.indexPrimers.id,
      alias: 'indexPrimer1',
    }),
    indexPrimer2: r.one.indexPrimers({
      from: r.externalSamples.indexPrimer2Id,
      to: r.indexPrimers.id,
      alias: 'indexPrimer2',
    }),
    sequencingRuns: r.many.sequencingRunExternalSamples(),
  },
  sequencingRunExternalSamples: {
    externalSample: r.one.externalSamples({
      from: r.sequencingRunExternalSamples.externalSampleId,
      to: r.externalSamples.id,
    }),
    sequencingRun: r.one.sequencingRuns({
      from: r.sequencingRunExternalSamples.sequencingRunId,
      to: r.sequencingRuns.id,
    }),
    indexPrimer1: r.one.indexPrimers({
      from: r.sequencingRunExternalSamples.indexPrimer1Id,
      to: r.indexPrimers.id,
      alias: 'indexPrimer1',
    }),
    indexPrimer2: r.one.indexPrimers({
      from: r.sequencingRunExternalSamples.indexPrimer2Id,
      to: r.indexPrimers.id,
      alias: 'indexPrimer2',
    }),
    sourceWell: r.one.wells({
      from: r.sequencingRunExternalSamples.sourceWellId,
      to: r.wells.id,
    }),
  },
  haCloningExperiments: {
    haCloningExperimentTargets: r.many.haCloningExperimentTargets(),
    haPcrProducts: r.many.haPcrProducts(),
  },
  haCloningExperimentTargets: {
    target: r.one.targets({
      from: r.haCloningExperimentTargets.targetId,
      to: r.targets.id,
    }),
    haCloningExperiment: r.one.haCloningExperiments({
      from: r.haCloningExperimentTargets.haCloningExperimentId,
      to: r.haCloningExperiments.id,
    }),
  },
  haPcrProducts: {
    performedBy: r.one.users({
      from: r.haPcrProducts.performedById,
      to: r.users.id,
    }),
    haCloningExperiment: r.one.haCloningExperiments({
      from: r.haPcrProducts.haCloningExperimentId,
      to: r.haCloningExperiments.id,
    }),
    haPrimerForward: r.one.homologyArmPrimers({
      from: r.haPcrProducts.haPrimerForwardId,
      to: r.homologyArmPrimers.id,
      alias: 'haPrimerForward',
    }),
    haPrimerReverse: r.one.homologyArmPrimers({
      from: r.haPcrProducts.haPrimerReverseId,
      to: r.homologyArmPrimers.id,
      alias: 'haPrimerReverse',
    }),
    wellable: r.one.wellables({
      from: r.haPcrProducts.id,
      to: r.wellables.id,
    }),
    haPuc19PcrProducts: r.many.haPuc19PcrProducts(),
  },
  haPuc19PcrProducts: {
    cleanedBy: r.one.users({
      from: r.haPuc19PcrProducts.cleanedById,
      to: r.users.id,
    }),
    haPcrProduct: r.one.haPcrProducts({
      from: r.haPuc19PcrProducts.haPcrProductId,
      to: r.haPcrProducts.id,
    }),
    haPuc19PrimerForward: r.one.homologyArmPuc19Primers({
      from: r.haPuc19PcrProducts.haPuc19PrimerForwardId,
      to: r.homologyArmPuc19Primers.id,
      alias: 'haPuc19PrimerForward',
    }),
    haPuc19PrimerReverse: r.one.homologyArmPuc19Primers({
      from: r.haPuc19PcrProducts.haPuc19PrimerReverseId,
      to: r.homologyArmPuc19Primers.id,
      alias: 'haPuc19PrimerReverse',
    }),
    wellable: r.one.wellables({
      from: r.haPuc19PcrProducts.id,
      to: r.wellables.id,
    }),
    haPuc19GibsonProducts: r.many.haPuc19GibsonProducts(),
  },
  haPuc19GibsonProducts: {
    preppedBy: r.one.users({
      from: r.haPuc19GibsonProducts.preppedById,
      to: r.users.id,
    }),
    haPuc19PcrProduct: r.one.haPuc19PcrProducts({
      from: r.haPuc19GibsonProducts.haPuc19PcrProductId,
      to: r.haPuc19PcrProducts.id,
    }),
    wellable: r.one.wellables({
      from: r.haPuc19GibsonProducts.id,
      to: r.wellables.id,
    }),
    haPuc19Plasmids: r.many.haPuc19Plasmids(),
  },
  haPuc19Plasmids: {
    preppedBy: r.one.users({
      from: r.haPuc19Plasmids.preppedById,
      to: r.users.id,
      alias: 'preppedBy',
    }),
    colonyPickedBy: r.one.users({
      from: r.haPuc19Plasmids.colonyPickedById,
      to: r.users.id,
      alias: 'colonyPickedBy',
    }),
    transformedBy: r.one.users({
      from: r.haPuc19Plasmids.transformedById,
      to: r.users.id,
      alias: 'transformedBy',
    }),
    haPuc19GibsonProduct: r.one.haPuc19GibsonProducts({
      from: r.haPuc19Plasmids.haPuc19GibsonProductId,
      to: r.haPuc19GibsonProducts.id,
    }),
    wellable: r.one.wellables({
      from: r.haPuc19Plasmids.id,
      to: r.wellables.id,
    }),
  },
  clonalHas: {
    wellable: r.one.wellables({
      from: r.clonalHas.id,
      to: r.wellables.id,
    }),
    clonalHaTargets: r.many.clonalHaTargets(),
    snvLibCloningExperiments: r.many.snvLibCloningExperiments(),
    snvLibGoldenGateProducts: r.many.snvLibGoldenGateProducts(),
  },
  clonalHaTargets: {
    clonalHa: r.one.clonalHas({
      from: r.clonalHaTargets.clonalHaId,
      to: r.clonalHas.id,
    }),
    target: r.one.targets({
      from: r.clonalHaTargets.targetId,
      to: r.targets.id,
    }),
  },
  sgRnaPlasmids: {
    wellable: r.one.wellables({
      from: r.sgRnaPlasmids.id,
      to: r.wellables.id,
    }),
    sgRnaPlasmidTargets: r.many.sgRnaPlasmidTargets(),
  },
  sgRnaPlasmidTargets: {
    target: r.one.targets({
      from: r.sgRnaPlasmidTargets.targetId,
      to: r.targets.id,
    }),
    sgRnaPlasmid: r.one.sgRnaPlasmids({
      from: r.sgRnaPlasmidTargets.sgRnaPlasmidId,
      to: r.sgRnaPlasmids.id,
    }),
  },
  snvLibPlasmids: {
    target: r.one.targets({
      from: r.snvLibPlasmids.targetId,
      to: r.targets.id,
    }),
    snvLibCloningExperiment: r.one.snvLibCloningExperiments({
      from: r.snvLibPlasmids.snvLibCloningExperimentId,
      to: r.snvLibCloningExperiments.id,
    }),
    wellable: r.one.wellables({
      from: r.snvLibPlasmids.id,
      to: r.wellables.id,
    }),
  },
  sgRnaCloningExperiments: {
    technician: r.one.users({
      from: r.sgRnaCloningExperiments.technicianId,
      to: r.users.id,
    }),
    plate: r.one.plates({
      from: r.sgRnaCloningExperiments.plateId,
      to: r.plates.id,
    }),
  },
  snvLibCloningExperiments: {
    target: r.one.targets({
      from: r.snvLibCloningExperiments.targetId,
      to: r.targets.id,
    }),
    clonalHa: r.one.clonalHas({
      from: r.snvLibCloningExperiments.clonalHaId,
      to: r.clonalHas.id,
    }),
    snvLibAmpProducts: r.many.snvLibAmpProducts(),
    snvLibLinProducts: r.many.snvLibLinProducts(),
    snvLibGibsonProducts: r.many.snvLibGibsonProducts(),
    snvLibPlasmids: r.many.snvLibPlasmids(),
    snvLibGoldenGateProducts: r.many.snvLibGoldenGateProducts(),
  },
  snvLibAmpProducts: {
    cleanedBy: r.one.users({
      from: r.snvLibAmpProducts.cleanedById,
      to: r.users.id,
    }),
    snvLibCloningExperiment: r.one.snvLibCloningExperiments({
      from: r.snvLibAmpProducts.snvLibCloningExperimentId,
      to: r.snvLibCloningExperiments.id,
    }),
    ampPrimerForward: r.one.amplificationPrimers({
      from: r.snvLibAmpProducts.ampPrimerForwardId,
      to: r.amplificationPrimers.id,
      alias: 'ampPrimerForward',
    }),
    ampPrimerReverse: r.one.amplificationPrimers({
      from: r.snvLibAmpProducts.ampPrimerReverseId,
      to: r.amplificationPrimers.id,
      alias: 'ampPrimerReverse',
    }),
    sgeOligo: r.one.sgeOligos({
      from: r.snvLibAmpProducts.sgeOligoId,
      to: r.sgeOligos.id,
    }),
    wellable: r.one.wellables({
      from: r.snvLibAmpProducts.id,
      to: r.wellables.id,
    }),
  },
  snvLibLinProducts: {
    dpn1DigestBy: r.one.users({
      from: r.snvLibLinProducts.dpn1DigestById,
      to: r.users.id,
      alias: 'dpn1DigestBy',
    }),
    gelExtractedBy: r.one.users({
      from: r.snvLibLinProducts.gelExtractedById,
      to: r.users.id,
      alias: 'gelExtractedBy',
    }),
    snvLibCloningExperiment: r.one.snvLibCloningExperiments({
      from: r.snvLibLinProducts.snvLibCloningExperimentId,
      to: r.snvLibCloningExperiments.id,
    }),
    linPrimerForward: r.one.linearizationPrimers({
      from: r.snvLibLinProducts.linPrimerForwardId,
      to: r.linearizationPrimers.id,
      alias: 'linPrimerForward',
    }),
    linPrimerReverse: r.one.linearizationPrimers({
      from: r.snvLibLinProducts.linPrimerReverseId,
      to: r.linearizationPrimers.id,
      alias: 'linPrimerReverse',
    }),
    haPuc19Plasmid: r.one.haPuc19Plasmids({
      from: r.snvLibLinProducts.haPuc19PlasmidId,
      to: r.haPuc19Plasmids.id,
    }),
    wellable: r.one.wellables({
      from: r.snvLibLinProducts.id,
      to: r.wellables.id,
    }),
  },
  snvLibGibsonProducts: {
    gibsonBy: r.one.users({
      from: r.snvLibGibsonProducts.gibsonById,
      to: r.users.id,
      alias: 'gibsonBy',
    }),
    cleanedBy: r.one.users({
      from: r.snvLibGibsonProducts.cleanedById,
      to: r.users.id,
      alias: 'cleanedBy',
    }),
    transformedBy: r.one.users({
      from: r.snvLibGibsonProducts.transformedById,
      to: r.users.id,
      alias: 'transformedBy',
    }),
    preppedBy: r.one.users({
      from: r.snvLibGibsonProducts.preppedById,
      to: r.users.id,
      alias: 'preppedBy',
    }),
    snvLibCloningExperiment: r.one.snvLibCloningExperiments({
      from: r.snvLibGibsonProducts.snvLibCloningExperimentId,
      to: r.snvLibCloningExperiments.id,
    }),
    wellable: r.one.wellables({
      from: r.snvLibGibsonProducts.id,
      to: r.wellables.id,
    }),
  },
  snvLibGoldenGateProducts: {
    snvLibCloningExperiment: r.one.snvLibCloningExperiments({
      from: r.snvLibGoldenGateProducts.snvLibCloningExperimentId,
      to: r.snvLibCloningExperiments.id,
    }),
    wellable: r.one.wellables({
      from: r.snvLibGoldenGateProducts.id,
      to: r.wellables.id,
    }),
    snvLibAmpProduct: r.one.snvLibAmpProducts({
      from: r.snvLibGoldenGateProducts.snvLibAmpProductId,
      to: r.snvLibAmpProducts.id,
    }),
    clonalHa: r.one.clonalHas({
      from: r.snvLibGoldenGateProducts.clonalHaId,
      to: r.clonalHas.id,
    }),
  },
  sgeOligos: {
    target: r.one.targets({
      from: r.sgeOligos.targetId,
      to: r.targets.id,
    }),
    snvLibAmpProducts: r.many.snvLibAmpProducts(),
    sgeOligoLots: r.many.sgeOligoLots(),
  },
  sgeOligoLots: {
    sgeOligo: r.one.sgeOligos({
      from: r.sgeOligoLots.sgeOligoId,
      to: r.sgeOligos.id,
    }),
    lot: r.one.lots({
      from: r.sgeOligoLots.lotId,
      to: r.lots.id,
    }),
  },
  sgRnaOligos: {
    wellable: r.one.wellables({
      from: r.sgRnaOligos.id,
      to: r.wellables.id,
    }),
    sgRnaOligoTargets: r.many.sgRnaOligoTargets(),
  },
  sgRnaOligoTargets: {
    target: r.one.targets({
      from: r.sgRnaOligoTargets.targetId,
      to: r.targets.id,
    }),
    sgRnaOligo: r.one.sgRnaOligos({
      from: r.sgRnaOligoTargets.sgRnaOligoId,
      to: r.sgRnaOligos.id,
    }),
  },
  amplificationPrimers: {
    target: r.one.targets({
      from: r.amplificationPrimers.targetId,
      to: r.targets.id,
    }),
    wellable: r.one.wellables({
      from: r.amplificationPrimers.id,
      to: r.wellables.id,
    }),
  },
  linearizationPrimers: {
    target: r.one.targets({
      from: r.linearizationPrimers.targetId,
      to: r.targets.id,
    }),
    wellable: r.one.wellables({
      from: r.linearizationPrimers.id,
      to: r.wellables.id,
    }),
  },
  homologyArmPrimers: {
    wellable: r.one.wellables({
      from: r.homologyArmPrimers.id,
      to: r.wellables.id,
    }),
    targets: r.many.homologyArmPrimerTargets(),
  },
  homologyArmPrimerTargets: {
    target: r.one.targets({
      from: r.homologyArmPrimerTargets.targetId,
      to: r.targets.id,
    }),
    homologyArmPrimer: r.one.homologyArmPrimers({
      from: r.homologyArmPrimerTargets.homologyArmPrimerId,
      to: r.homologyArmPrimers.id,
    }),
  },
  homologyArmPuc19Primers: {
    homologyArmPrimer: r.one.homologyArmPrimers({
      from: r.homologyArmPuc19Primers.homologyArmPrimerId,
      to: r.homologyArmPrimers.id,
    }),
    wellable: r.one.wellables({
      from: r.homologyArmPuc19Primers.id,
      to: r.wellables.id,
    }),
  },
  indexPrimers: {
    wellable: r.one.wellables({
      from: r.indexPrimers.id,
      to: r.wellables.id,
    }),
  },
  preseq1Primers: {
    wellable: r.one.wellables({
      from: r.preseq1Primers.id,
      to: r.wellables.id,
    }),
    preseq1PrimerTargets: r.many.preseq1PrimerTargets(),
  },
  preseq1PrimerTargets: {
    target: r.one.targets({
      from: r.preseq1PrimerTargets.targetId,
      to: r.targets.id,
    }),
    preseq1Primer: r.one.preseq1Primers({
      from: r.preseq1PrimerTargets.preseq1PrimerId,
      to: r.preseq1Primers.id,
    }),
  },
  preseq2Primers: {
    target: r.one.targets({
      from: r.preseq2Primers.targetId,
      to: r.targets.id,
    }),
    wellable: r.one.wellables({
      from: r.preseq2Primers.id,
      to: r.wellables.id,
    }),
  },
  rnaPreseq1Primers: {
    wellable: r.one.wellables({
      from: r.rnaPreseq1Primers.id,
      to: r.wellables.id,
    }),
    rnaPreseq1PrimerTargets: r.many.rnaPreseq1PrimerTargets(),
  },
  rnaPreseq1PrimerTargets: {
    target: r.one.targets({
      from: r.rnaPreseq1PrimerTargets.targetId,
      to: r.targets.id,
    }),
    rnaPreseq1Primer: r.one.rnaPreseq1Primers({
      from: r.rnaPreseq1PrimerTargets.rnaPreseq1PrimerId,
      to: r.rnaPreseq1Primers.id,
    }),
  },
  rnaPreseq2Primers: {
    wellable: r.one.wellables({
      from: r.rnaPreseq2Primers.id,
      to: r.wellables.id,
    }),
    rnaPreseq2PrimerTargets: r.many.rnaPreseq2PrimerTargets(),
  },
  rnaPreseq2PrimerTargets: {
    target: r.one.targets({
      from: r.rnaPreseq2PrimerTargets.targetId,
      to: r.targets.id,
    }),
    rnaPreseq2Primer: r.one.rnaPreseq2Primers({
      from: r.rnaPreseq2PrimerTargets.rnaPreseq2PrimerId,
      to: r.rnaPreseq2Primers.id,
    }),
  },
  rnaRtPrimers: {
    wellable: r.one.wellables({
      from: r.rnaRtPrimers.id,
      to: r.wellables.id,
    }),
    gene: r.one.genes({
      from: r.rnaRtPrimers.geneId,
      to: r.genes.id,
    }),
  },
}))
