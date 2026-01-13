import type { plates, schemas } from '../../server/db/schema/plate'
import type { InferSelectModel } from 'drizzle-orm'
import type { z } from 'zod'

export type PlateType = 'mock-plate-type-1' | 'mock-plate-type-2'

type Accessor<T, Self> = (value?: T) => T | Self

export interface CoordinatePair {x: number, y: number}

export type Plate = InferSelectModel<typeof plates>
export type NewPlate = z.infer<typeof schemas.insertPlateSchema>
export type UpdatePlate = z.infer<typeof schemas.updatePlateSchema>

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
