import _ from 'lodash'
import { homologyArmPuc19Primers } from '#shared/db/schema/sge/primer'
import { wellContents } from '#shared/db/schema/sge/well'
import { schemas } from '#shared/db/zod/zodSchemas'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const haPuc19PrimerInsertSchema = (schemas as any).homologyArmPuc19Primers.insert
    const db = useSgeDrizzle()

    const result = await db.transaction(async (tx) => {
      const wellContentsToInsert = []
      for (const record of body) {
        const haPrimer = record.haPrimer

        let haPuc19PrimerName = ''
        let haPuc19PrimerSequence = ''
        if (haPrimer.sequenceType == 'forward') {
          haPuc19PrimerName = _.replace(haPrimer.name, /_F$/gi, '_pUC19_F')
          haPuc19PrimerSequence = `GTTTTCCCAGTCACGACGTTGTAAAACGACGGCCAGT${haPrimer.sequence}`
        } else if (haPrimer.sequenceType == 'reverse') {
          haPuc19PrimerName = _.replace(haPrimer.name, /_R$/gi, '_pUC19_R')
          haPuc19PrimerSequence = `GATTACGCCAAGCTTGCATGCCTGCAGGT${haPrimer.sequence}`
        }

        const newHaPuc19Primer = {
          name: haPuc19PrimerName,
          sequence: haPuc19PrimerSequence,
          homologyArmPrimerId: haPrimer.id,
        }
        const parsedRecord = haPuc19PrimerInsertSchema.parse(newHaPuc19Primer)
        const insertedHaPuc19Primer = await tx.insert(homologyArmPuc19Primers).values(parsedRecord).returning()

        wellContentsToInsert.push({
          wellId: record.wellId,
          wellableId: insertedHaPuc19Primer[0].id,
        })
      }
      return await tx.insert(wellContents).values(wellContentsToInsert).returning()
    })
    return result
  } catch (e: any) {
    const { error, data } = parsePutPostError(e)
    throw createError({ statusCode: 400, statusMessage: error.message, data })
  }
})
