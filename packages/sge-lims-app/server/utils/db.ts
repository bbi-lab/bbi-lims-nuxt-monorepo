import { drizzle } from 'drizzle-orm/node-postgres'

// Reuse the lims-layer pool — avoids a second connection pool to the same DB.
import { pool, schema as baseSchema } from 'lims-layer/server/utils/db'

// The lims-layer exports a generic `view_plates_with_well_counts`; sge defines its
// own richer version under the same name (see below). Drop the layer's so only the
// sge view is registered in the runtime schema.
const { viewPlatesWithWellCounts: _layerPlatesView, ...layerSchema } = baseSchema

// sge tables
import { genes } from 'lims-layer/shared/db/schema/gene'
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

import { relations } from '../db/relations/relations'

// Combined schema: lims-layer tables + sge-specific tables and views.
export const sgeSchema = {
  ...layerSchema,

  // sge tables
  genes,
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
}

// Named `sgeDb` / `useSgeDrizzle` to avoid auto-import collision with
// the base `db` / `useDrizzle` exported by lims-layer. Any server route
// that queries SGE tables must call `useSgeDrizzle()` instead of `useDrizzle()`.
export const sgeDb = drizzle({ client: pool, relations })

export function useSgeDrizzle() {
  return sgeDb
}
