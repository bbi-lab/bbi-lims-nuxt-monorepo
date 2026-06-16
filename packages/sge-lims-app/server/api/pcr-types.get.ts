import { asc } from 'drizzle-orm'

export default defineEventHandler(async () => {
    const db = useSgeDrizzle()
    return await db.query.pcrTypes.findMany({
        orderBy: (pcrTypes) => [asc(pcrTypes.label)],
    })
})
