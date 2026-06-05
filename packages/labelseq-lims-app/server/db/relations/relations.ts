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
import { labelseqIndexPrimers, nexteraIndexPrimers, retrieverPrimers } from '#shared/db/schema/primers'
import { restrictionEnzymes } from '#shared/db/schema/reagents'
import { refseqTranscripts } from '#shared/db/schema/transcripts'
import { viewTilesWithSequences, viewTileVariantsWithSequences } from '#shared/db/schema/views'

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
  restrictionEnzymes,
  refseqTranscripts,

  // labelseq views
  viewTilesWithSequences,
  viewTileVariantsWithSequences,
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
    retrieverPrimers: r.one.retrieverPrimers({
      from: r.wellables.id,
      to: r.retrieverPrimers.id,
    }),
    labelseqIndexPrimers: r.one.labelseqIndexPrimers({
      from: r.wellables.id,
      to: r.labelseqIndexPrimers.id,
    }),
    nexteraIndexPrimers: r.one.nexteraIndexPrimers({
      from: r.wellables.id,
      to: r.nexteraIndexPrimers.id,
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
}))
