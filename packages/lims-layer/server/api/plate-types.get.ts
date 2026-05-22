import { useDrizzle } from '../utils/db'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
    const db = useDrizzle()
    return await db.query.plateTypes.findMany({
        orderBy: (plateTypes) => [asc(plateTypes.label)],
    })
})
