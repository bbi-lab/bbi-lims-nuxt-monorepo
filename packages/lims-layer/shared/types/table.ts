export interface ColumnDefinition {
    header?: string
    index?: number
    format?: string | ((data: any) => string | string[])
    path?: string
    type?: string
    display?: boolean
    sortable?: boolean
    element?: string | ((data: any) => string)
    elementSearchText?: (data: any) => string
    elementClick?: (event: any) => void
    searchable?: boolean
    exportable?: boolean
    exportValue?: (record: any) => string
    bodyClass?: string
}

export interface SortedColumnDefinition extends ColumnDefinition {
    key: string
}

export type ColumnDefinitions = { [key: string]: ColumnDefinition }

export interface VisibleColumn { name: string, code: string }

export type GlobalFilterField = string | ((data: any) => string)
