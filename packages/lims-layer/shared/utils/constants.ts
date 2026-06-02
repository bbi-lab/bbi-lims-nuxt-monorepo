export const wellableTableNames: string[] =
  (process.env.NUXT_WELLABLE_TABLE_NAMES ?? '').split(',').filter(Boolean)
