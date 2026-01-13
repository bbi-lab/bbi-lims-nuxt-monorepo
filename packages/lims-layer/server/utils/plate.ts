import { plates, type NewPlate} from '../db/schema/plate'
import { wells } from '../db/schema/well'

import { db } from './db'
import _ from 'lodash'

export async function insertPlate(values: NewPlate) {
    const newPlate = _.first(await db
        .insert(plates)
        .values(values)
        .returning()
    )

    if (newPlate) {
        for (let x = 1; x <= newPlate.sizeX; x++) {
            for (let y = 1; y <= newPlate.sizeY; y++) {
                await db.insert(wells).values({plateId: newPlate.id, x, y})
            }
        }
    }

    return newPlate
  }
