/// <reference lib="dom" />
import type { plates } from '../db/schema/plate'
import type { schemas } from '../db/zod/zodSchemas'
import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'

export type PlateType = string

type Accessor<T, Self> = (value?: T) => T | Self

export interface CoordinatePair {x: number, y: number}

export type Plate = InferSelectModel<typeof plates>
export type NewPlate = z.infer<typeof schemas.plates.insert>
export type UpdatePlate = z.infer<typeof schemas.plates.update>

export interface PlateDiagramWell {
    id: string,
    x: number,
    y: number,
    data?: any,
    color?: string,
    tooltip?: string,
    symbol?: string,
    contentFKs?: string[],
    selected?: boolean,
    inSelectionRange?: boolean,
}

export interface PlateDiagram {
    title?: string,
    id?: string,

    wells: (value: PlateDiagramWell[]) => PlateDiagram
    getWells: () => PlateDiagramWell[]

    render: (container: HTMLElement) => PlateDiagram
    refresh: () => PlateDiagram
    resize: () => PlateDiagram

    wellRangeSelected: Accessor<((wells: PlateDiagramWell[]) => void) | null, PlateDiagram>
    updateWellContents: (updatedWells: PlateDiagramWell[]) => PlateDiagram

    clearSelection: () => PlateDiagram
    selectAllWells: () => PlateDiagram
}

export type PlateWithPlateDiagramWells = Plate & {
    wells: PlateDiagramWell[]
}
