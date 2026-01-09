export type EnumLookupEntry = {
    [value: string]: {
        desc: string
        label: string
    }
}

export type EnumLookup = {
    [fieldName: string]: EnumLookupEntry
}
