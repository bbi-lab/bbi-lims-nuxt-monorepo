import _ from 'lodash'
import { inArray } from 'drizzle-orm'
import { wellContents, wellContentSources } from '../../shared/db/schema/well'
import { db } from './db'

export async function insertWellContentsAndSources(records: WellContentWithSource[]) {
  const newWellContentSources = _.flatMap(records, (x) =>
    _.map(x.sourceWellIds || [], (sourceWellId) => ({
      wellContentId: x.id!,
      sourceWellId,
      createdById: x.createdById || null,
    }))
  )
  const newWellContents = _.map(records, (x) => _.omit(x, ['sourceWellIds', 'createdBy']))

  return db.transaction(async (tx) => {
    await tx.insert(wellContents).values(newWellContents as any[])
    if (!_.isEmpty(newWellContentSources)) {
      await tx.insert(wellContentSources).values(newWellContentSources)
    }
    return tx.select().from(wellContents).where(inArray(wellContents.id, _.map(newWellContents, 'id') as string[]))
  })
}
