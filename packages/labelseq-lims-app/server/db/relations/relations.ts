import { defineRelations } from 'drizzle-orm'

// lims-layer tables (resolved via workspace symlink)
import { users, userGroups, userGroupMemberships, passwordResetTokens } from 'lims-layer/server/db/schema/user'
import { genes } from 'lims-layer/shared/db/schema/gene'
import { plates } from 'lims-layer/shared/db/schema/plate'
import { wellables, wellContents, wellContentSources, wells } from 'lims-layer/shared/db/schema/well'

// labelseq-lims-app tables
import { projects } from '../../../shared/db/schema/project'
import { superblocks, tiles } from '../../../shared/db/schema/tiles'
import { retrieverPrimers } from '../../../shared/db/schema/primers'
import { restrictionEnzymes } from '../../../shared/db/schema/reagents'


export const relations = defineRelations({
  // lims-layer tables
  users,
  userGroups,
  userGroupMemberships,
  passwordResetTokens,
  genes,
  plates,
  wells,
  wellContents,
  wellables,
  wellContentSources,

  // labelseq tables
  projects,
  superblocks,
  tiles,
  retrieverPrimers,
  restrictionEnzymes,
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
  },
  superblocks: {
    project: r.one.projects({
      from: r.superblocks.projectId,
      to: r.projects.id,
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
  },
  retrieverPrimers: {
    tilesForward: r.many.tiles({ alias: 'retrieverPrimerForward' }),
    tilesReverse: r.many.tiles({ alias: 'retrieverPrimerReverse' }),
  },
}))
