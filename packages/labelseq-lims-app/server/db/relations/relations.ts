import { defineRelations } from 'drizzle-orm'

// lims-layer tables (resolved via workspace symlink)
import { users, userGroups, userGroupMemberships, passwordResetTokens } from 'lims-layer/server/db/schema/user'
import { genes } from 'lims-layer/shared/db/schema/gene'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { plateTypes } from 'lims-layer/shared/db/schema/plateTypes'
import { wellables, wellContents, wellContentSources, wells } from 'lims-layer/shared/db/schema/well'

// labelseq-lims-app tables
import { projects } from '#shared/db/schema/project'
import { superblocks, tiles, tileVariants } from '#shared/db/schema/tiles'
import { labelseqIndexPrimers, nexteraIndexPrimers, pcr1Primers, retrieverPrimers, sequencingIlluminaPrimers, sequencingIndexPrimers, sequencingReadPrimers } from '#shared/db/schema/primers'
import { restrictionEnzymes } from '#shared/db/schema/reagents'
import { refseqTranscripts } from '#shared/db/schema/transcripts'
import { pcrExperiments } from '#shared/db/schema/pcrExperiments'
import { viewTilesWithSequences, viewTileVariantsWithSequences, viewTileGblocks } from '#shared/db/schema/views'

export const relations = defineRelations({
  // lims-layer tables
  users,
  userGroups,
  userGroupMemberships,
  passwordResetTokens,
  genes,
  plates,
  plateTypes,
  wells,
  wellContents,
  wellables,
  wellContentSources,

  // labelseq tables
  projects,
  superblocks,
  tiles,
  tileVariants,
  retrieverPrimers,
  labelseqIndexPrimers,
  nexteraIndexPrimers,
  sequencingReadPrimers,
  sequencingIndexPrimers,
  sequencingIlluminaPrimers,
  pcr1Primers,
  restrictionEnzymes,
  refseqTranscripts,
  pcrExperiments,

  // labelseq views
  viewTilesWithSequences,
  viewTileVariantsWithSequences,
  viewTileGblocks,
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
    retrieverPrimer: r.one.retrieverPrimers({
      from: r.wellables.id,
      to: r.retrieverPrimers.id,
    }),
    labelseqIndexPrimer: r.one.labelseqIndexPrimers({
      from: r.wellables.id,
      to: r.labelseqIndexPrimers.id,
    }),
    nexteraIndexPrimer: r.one.nexteraIndexPrimers({
      from: r.wellables.id,
      to: r.nexteraIndexPrimers.id,
    }),
    sequencingReadPrimer: r.one.sequencingReadPrimers({
      from: r.wellables.id,
      to: r.sequencingReadPrimers.id,
    }),
    sequencingIndexPrimer: r.one.sequencingIndexPrimers({
      from: r.wellables.id,
      to: r.sequencingIndexPrimers.id,
    }),
    sequencingIlluminaPrimer: r.one.sequencingIlluminaPrimers({
      from: r.wellables.id,
      to: r.sequencingIlluminaPrimers.id,
    }),
    pcr1Primer: r.one.pcr1Primers({
      from: r.wellables.id,
      to: r.pcr1Primers.id,
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
  // ── labelseq relations ────────────────────────────────────────────────────
  projects: {
    superblocks: r.many.superblocks(),
    restrictionEnzyme: r.one.restrictionEnzymes({
      from: r.projects.restrictionEnzymeId,
      to: r.restrictionEnzymes.id,
    }),
  },
  restrictionEnzymes: {
    projects: r.many.projects(),
  },
  genes: {
    refseqTranscripts: r.many.refseqTranscripts(),
  },
  refseqTranscripts: {
    superblocks: r.many.superblocks(),
    gene: r.one.genes({
      from: r.refseqTranscripts.geneId,
      to: r.genes.id,
    }),
  },
  superblocks: {
    project: r.one.projects({
      from: r.superblocks.projectId,
      to: r.projects.id,
    }),
    refseqTranscript: r.one.refseqTranscripts({
      from: r.superblocks.refseqTranscriptId,
      to: r.refseqTranscripts.id,
    }),
    tiles: r.many.tiles(),
  },
  tiles: {
    superblock: r.one.superblocks({
      from: r.tiles.superblockId,
      to: r.superblocks.id,
    }),
    retrieverPrimerForward: r.one.retrieverPrimers({
      from: r.tiles.retrieverPrimerForwardId,
      to: r.retrieverPrimers.id,
      alias: 'retrieverPrimerForward',
    }),
    retrieverPrimerReverse: r.one.retrieverPrimers({
      from: r.tiles.retrieverPrimerReverseId,
      to: r.retrieverPrimers.id,
      alias: 'retrieverPrimerReverse',
    }),
    viewTileWithSequences: r.one.viewTilesWithSequences({
      from: r.tiles.id,
      to: r.viewTilesWithSequences.id,
    }),
    tileVariants: r.many.tileVariants(),
    gblocks: r.many.viewTileGblocks(),
  },
  tileVariants: {
    tile: r.one.tiles({
      from: r.tileVariants.tileId,
      to: r.tiles.id,
    }),
    viewTileVariantsWithSequences: r.one.viewTileVariantsWithSequences({
      from: r.tileVariants.id,
      to: r.viewTileVariantsWithSequences.id,
    }),
  },
  retrieverPrimers: {
    tilesForward: r.many.tiles({ alias: 'retrieverPrimerForward' }),
    tilesReverse: r.many.tiles({ alias: 'retrieverPrimerReverse' }),
    wellable: r.one.wellables({
      from: r.retrieverPrimers.id,
      to: r.wellables.id,
    }),
  },
  labelseqIndexPrimers: {
    wellable: r.one.wellables({
      from: r.labelseqIndexPrimers.id,
      to: r.wellables.id,
    }),
  },
  nexteraIndexPrimers: {
    wellable: r.one.wellables({
      from: r.nexteraIndexPrimers.id,
      to: r.wellables.id,
    }),
  },
  sequencingReadPrimers: {
    wellable: r.one.wellables({
      from: r.sequencingReadPrimers.id,
      to: r.wellables.id,
    }),
  },
  sequencingIndexPrimers: {
    wellable: r.one.wellables({
      from: r.sequencingIndexPrimers.id,
      to: r.wellables.id,
    }),
  },
  sequencingIlluminaPrimers: {
    wellable: r.one.wellables({
      from: r.sequencingIlluminaPrimers.id,
      to: r.wellables.id,
    }),
  },
  pcr1Primers: {
    wellable: r.one.wellables({
      from: r.pcr1Primers.id,
      to: r.wellables.id,
    }),
  },
  pcrExperiments: {
    plate: r.one.plates({
      from: r.pcrExperiments.plateId,
      to: r.plates.id,
    }),
  },
  viewTilesWithSequences: {
    superblock: r.one.superblocks({
      from: r.viewTilesWithSequences.superblockId,
      to: r.superblocks.id,
    }),
    retrieverPrimerForward: r.one.retrieverPrimers({
      from: r.viewTilesWithSequences.retrieverPrimerForwardId,
      to: r.retrieverPrimers.id,
      alias: 'retrieverPrimerForward',
    }),
    retrieverPrimerReverse: r.one.retrieverPrimers({
      from: r.viewTilesWithSequences.retrieverPrimerReverseId,
      to: r.retrieverPrimers.id,
      alias: 'retrieverPrimerReverse',
    }),
    tile: r.one.tiles({
      from: r.viewTilesWithSequences.id,
      to: r.tiles.id,
    }),
  },
  viewTileVariantsWithSequences: {
    tileVariant: r.one.tileVariants({
      from: r.viewTileVariantsWithSequences.id,
      to: r.tileVariants.id,
    }),
  },
  viewTileGblocks: {
    tile: r.one.tiles({
      from: r.viewTileGblocks.tileId,
      to: r.tiles.id,
    }),
    superblock: r.one.superblocks({
      from: r.viewTileGblocks.superblockId,
      to: r.superblocks.id,
    }),
  },
}))
