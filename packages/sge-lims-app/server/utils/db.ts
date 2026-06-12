import { drizzle } from 'drizzle-orm/node-postgres'

// Reuse the lims-layer pool — avoids a second connection pool to the same DB.
import { pool, schema as baseSchema } from '../../../lims-layer/server/utils/db'

// sge tables
import { genes } from '#shared/db/schema/sge/gene'
import { targets } from '#shared/db/schema/sge/target'
import { regions } from '#shared/db/schema/sge/region'
import { cycles } from '#shared/db/schema/sge/cycle'
import { projects } from '#shared/db/schema/sge/project'
import { pellets } from '#shared/db/schema/sge/pellet'
import { lots } from '#shared/db/schema/sge/lots'
import { reagents } from '#shared/db/schema/sge/reagents'
import { dna, rna } from '#shared/db/schema/sge/nucleic-acid'
import { plates } from '#shared/db/schema/sge/plate'
import { wellables, wellContents, wellContentSources, wells } from '#shared/db/schema/sge/well'
import {
  amplificationPrimers, homologyArmPrimers, homologyArmPrimerTargets,
  homologyArmPuc19Primers, indexPrimers, linearizationPrimers,
  preseq1Primers, preseq1PrimerTargets, preseq2Primers,
  rnaPreseq1Primers, rnaPreseq1PrimerTargets, rnaPreseq2Primers,
  rnaPreseq2PrimerTargets, rnaRtPrimers,
} from '#shared/db/schema/sge/primer'
import { haPuc19Plasmids, sgRnaPlasmids, sgRnaPlasmidTargets, snvLibPlasmids } from '#shared/db/schema/sge/plasmid'
import {
  clonalHas, clonalHaTargets, haPcrProducts, haPuc19GibsonProducts, haPuc19PcrProducts,
  sgeOligoLots, sgeOligos, sgRnaOligos, sgRnaOligoTargets,
  snvLibAmpProducts, snvLibGibsonProducts, snvLibGoldenGateProducts, snvLibLinProducts,
} from '#shared/db/schema/sge/oligos'
import { pcrExperiments, pcrExperimentTargets, pcr1ExperimentMasterMixVolumes, pcr2ExperimentMasterMixVolumes } from '#shared/db/schema/sge/pcr-experiment'
import { haCloningExperiments, haCloningExperimentTargets, sgRnaCloningExperiments, snvLibCloningExperiments } from '#shared/db/schema/sge/plasmid-experiment'
import { extractionExperiments, extractionLotUsage } from '#shared/db/schema/sge/extraction-experiment'
import { transfectExperiments, transfectLotUsage, transfectTargets } from '#shared/db/schema/sge/transfect-experiment'
import { sequencingRuns, sequencingRunSamples, sequencingRunExternalSamples } from '#shared/db/schema/sge/sequencing-run'
import { externalSamples } from '#shared/db/schema/sge/external-samples'
import { viewHaPuc19GibsonProductsWithCalcs, viewPlatesWithWellCounts, viewSequencingRunAllSamples, viewSnvLibGibsonProducts } from '#shared/db/schema/sge/views'

import { relations } from '../db/relations/relations'

// Combined schema: lims-layer tables + sge-specific tables and views.
export const sgeSchema = {
  ...baseSchema,

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
