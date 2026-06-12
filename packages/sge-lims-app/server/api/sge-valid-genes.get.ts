import _ from 'lodash'
import { genes } from '#shared/db/schema/sge/gene'
import { ilike, and, or, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const db = useSgeDrizzle()
  try {
    const { where } = getQuery(event) as { where: string }
    const searchTerm = _.get(JSON.parse(where), 'searchTerm')

    if (!searchTerm) {
      throw createError({ statusCode: 400, statusMessage: 'No search term provided' })
    }

    return await db.select({
      id: genes.id,
      symbol: genes.symbol,
      ncbiAccession: genes.ncbiAccession,
    }).from(genes).where(
      and(
        ilike(genes.ncbiAccession, 'NC_%'),
        eq(genes.geneType, 'protein-coding'),
        or(
          ilike(genes.symbol, `${searchTerm}%`),
          ilike(genes.ncbiAccession, `${searchTerm}%`),
        )
      )
    )
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
