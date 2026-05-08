import type { PgAsyncTransaction } from 'drizzle-orm/pg-core'
import { plates } from '../../shared/db/schema/plate'
import { wells } from '../../shared/db/schema/well'

import { db } from './db'
import _ from 'lodash'

export async function insertPlate(values: NewPlate, tx?: PgAsyncTransaction<any, any>) {
    // Insert plate and associated wells in a transaction (or a subtransaction if tx is provided)
    const plate = await (tx ?? db).transaction(async (tx2: PgAsyncTransaction<any, any>) => {
        const newPlate = _.first(await tx2
            .insert(plates)
            .values(values)
            .returning()
        )

        const newWells = []
        if (newPlate) {
            for (let x = 1; x <= newPlate.sizeX; x++) {
                for (let y = 1; y <= newPlate.sizeY; y++) {
                    newWells.push({plateId: newPlate.id, x, y})
                }
            }
        }
        await tx2.insert(wells).values(newWells)

        return newPlate
    })
    return plate
  }
