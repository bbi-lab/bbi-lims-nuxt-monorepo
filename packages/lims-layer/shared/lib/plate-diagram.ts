import * as d3 from "d3"
import {type ValueFn} from "d3"
import _ from "lodash"
import type { PlateWithPlateDiagramWells } from "~/components/PlateDiagram.vue"
import type { PlateType } from "~/server/db/schema/sge/plate"

type Accessor<T, Self> = (value?: T) => T | Self

interface CoordinatePair {x: number, y: number}

function hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
export function getWellTextColor(hex: string): string {
    const rgb = hexToRgb(hex)
    if (rgb) {
        var sum = Math.round(((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000)
        return (sum > 128) ? '#000' : '#fff'
    } else {
        return 'var(--p-text-color)'
    }
}

export const VALID_WELL_COLORS = [
    "#0075DC",
    "#F0A3FF",
    "#993F00",
    "#4C005C",
    "#005C31",
    "#2BCE48",
    "#FFCC99",
    "#94FFB5",
    "#8F7C00",
    "#9DCC00",
    "#C20088",
    "#003380",
    "#FFA405",
    "#FFA8BB",
    "#426600",
    "#FF0010",
    "#5EF1F2",
    "#00998F",
    "#E0FF66",
    "#740AFF",
    "#990000",
    "#FFFF80",
    "#FFE100",
    "#FF5005"
]

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

export function wellCoordinateToChar(number: number) {
    return String.fromCharCode(96 + number).toUpperCase()
}

export function wellCharToCoordinate(letter: string) {
    return letter.toLowerCase().charCodeAt(0) - 96
}

export function makePlateDiagram(plateType: PlateType, sizeX: number = 12, sizeY: number = 8): PlateDiagram {
    // Container
    let _container: HTMLElement | null = null

    let svg: d3.Selection<SVGSVGElement, any, any, any> | null = null

    // select wells
    let wellRangeSelected: ((wells: PlateDiagramWell[]) => void) | null = null
    let wellSelectionStart: PlateDiagramWell | null = null

    // default plate and well sizes
    let wellSize: CoordinatePair = { x: 20, y: 20 }
    let wellSpacing: CoordinatePair = { x: 0, y: 0 }

    let plate: PlateWithPlateDiagramWells = {
        id: '',
        name: '',
        plasmidExperimentId: null,
        pcrExperimentId: null,
        sizeX: sizeX,
        sizeY: sizeY,
        plateType,
        discarded: null,
        processed: null,
        wells: [],  // wells to be set via wells() method
    }
    // set the dimensions and margins of the graph
    let margin = {top: 10, right: 10, bottom: 20, left: 20}
    const plateWidth = () => wellSize.x * plate.sizeX + (wellSpacing.x * plate.sizeX)
    const plateHeight = () => wellSize.y * plate.sizeY + (wellSpacing.y * plate.sizeY)

    // Scales
    const xScale: d3.ScaleBand<string> = d3.scaleBand()
    const yScale: d3.ScaleBand<string> = d3.scaleBand()

    const tooltip: d3.Selection<HTMLDivElement, any, any, any> = d3.select("body").append("div")

    const updateWellOutlines: () => void = () => {
        if (svg) {
            svg.selectAll<SVGRectElement, PlateDiagramWell>('g.plate-diagram-node rect')
                .each(function(d: PlateDiagramWell) {
                    d3.select(this)
                        .style('stroke', <ValueFn<any, any, string>>wellOutlineColor)
                    // raise the selected wells so their outlines aren't obscured by those of unselected wells
                    if (d.inSelectionRange || d.selected) {
                        d3.select(this)
                            .style('opacity', 1.0)
                        // @ts-ignore
                        d3.select(this.parentNode).raise()
                    } else {
                        d3.select(this)
                            .style('opacity', 0.8)
                    }
                })
            // raise text decorations to the top of display order
            d3.selectAll('text.well-decoration-text').raise()
        }
    }

    const updateWellDisplay: (updatedWells: PlateDiagramWell[]) => void = (updatedWells) => {
        if (svg && updatedWells) {
            const updatedWellIds = _.map(updatedWells, (x) => x.id)
            svg.selectAll<SVGRectElement, PlateDiagramWell>('rect')
                .each(function(d: PlateDiagramWell, i: number, nodes: ArrayLike<SVGRectElement>) {
                    if (updatedWellIds.includes(d.id)){
                        const updatedWell = _.find(updatedWells, (x) => x.id == d.id)
                        d3.select(this)
                            .style('fill', updatedWell?.color || '#ddd')
                            .attr('tooltip', updatedWell?.tooltip || "")
                    }
                })
            svg.selectAll<SVGTextElement, PlateDiagramWell>('text.well-decoration-text')
                .each(function(d: PlateDiagramWell, i: number, nodes: ArrayLike<SVGTextElement>) {
                    if (updatedWellIds.includes(d.id)){
                        const updatedWell = _.find(updatedWells, (x) => x.id == d.id)
                        d3.select(this)
                            .text(updatedWell?.symbol || "")
                            .style('fill', getWellTextColor(updatedWell?.color || "#ddd"))
                    }
                })
        }
    }

    const wellOutlineColor: (w:PlateDiagramWell) => string = (w: PlateDiagramWell) => {
        return w.inSelectionRange ? 'var(--p-text-muted-color)' : (w.selected ? 'var(--p-text-color)' : 'var(--surface-ground)')
    }

    // Three function that change the tooltip when user hover / move / leave a cell
    const mouseover = function(this: SVGRectElement, event: MouseEvent, w: PlateDiagramWell) {
        const tooltipText = d3.select(this).attr("tooltip")
        tooltip
            .html(tooltipText)
            .style("opacity", 1)
            .style("pointer-events", "none")
            .style("left", (event.pageX + 20) + "px")
            .style("top", (event.pageY - 20) + "px")
            .raise()
        d3.select(this)
            .style("stroke", "var(--p-text-color)")
            .style("opacity", 1)
        // @ts-ignore
        d3.select(this.parentNode).raise()
        d3.selectAll('text.well-decoration-text').raise()
    }

    const mousemove = function(this: SVGRectElement, event: MouseEvent, w: PlateDiagramWell) {
        if (wellSelectionStart) {
            const startX = _.min([wellSelectionStart!.x, w.x])!
            const endX = _.max([wellSelectionStart!.x, w.x])!
            const startY = _.min([wellSelectionStart!.y, w.y])!
            const endY = _.max([wellSelectionStart!.y, w.y])!

            plate.wells.forEach(well => {
                if (_.inRange(well.x, startX, endX+1) &&
                    _.inRange(well.y, startY, endY+1)) {
                        well.inSelectionRange = true
                    } else {
                        well.inSelectionRange = false
                    }
            })
            updateWellOutlines()
        }
    }

    const mouseleave = function(this: SVGRectElement, event: MouseEvent, w: PlateDiagramWell) {
        tooltip.style("opacity", 0)
        updateWellOutlines()
    }

    const mouseclick = function(this: SVGRectElement, event: MouseEvent, w: PlateDiagramWell) {
        // mouseclick events also correspond with mousedown and mouseup, so click behavior is being handled there
        // console.log('click')
    }
    const mousedown = function(this: SVGRectElement, event: MouseEvent, w: PlateDiagramWell) {
        wellSelectionStart = w
        plate.wells.forEach(well => {
            well.inSelectionRange = false
        })
        updateWellOutlines()
    }
    const mouseup = function(this: SVGRectElement, event: MouseEvent, w: PlateDiagramWell) {
        if (wellSelectionStart) {
            // if mouseup and mousedown are the same well, treat as a click
            if (wellSelectionStart == w && !event.metaKey) {
                plate.wells.forEach(well => { if (well !== w) {well.selected = false} else {well.selected = true} })
            } else if (wellSelectionStart == w && event.metaKey) {
                w.selected = !w.selected
            } else {
                // toggle wells in selection range if meta key is pressed, otherwise just select them
                plate.wells.forEach(well => {
                    if (well.inSelectionRange) {
                        well.selected = event.metaKey ? !well.selected : true
                    } else if (well.selected && !event.metaKey) {
                        well.selected = false
                    }
                    well.inSelectionRange = false
                })
            }
        }
        if (wellRangeSelected) wellRangeSelected(plate.wells.filter(w => w.selected))
        wellSelectionStart = null
        plate.wells.forEach(w => w.inSelectionRange = false)
        updateWellOutlines()
    }

    const getX = (w:PlateDiagramWell) => { return xScale(_.toString(w.x))! + wellSpacing.x/2 }
    const getY = (w:PlateDiagramWell) => { return yScale(_.toString(w.y))! + wellSpacing.y/2 }
    const xCoord = (w:PlateDiagramWell) => { return w.x }
    const yCoord = (w:PlateDiagramWell) => { return w.y }

    const selectRow: (event: MouseEvent) => void = (event: MouseEvent) => {
        const rowNumber = d3.select(event.target as SVGRectElement).datum()
        plate.wells.forEach(well => {
            if (well.y == rowNumber) {
                well.selected = event.metaKey ? !well.selected : true
            } else if (!event.metaKey) {
                well.selected = false
            }
        })
        if (wellRangeSelected) wellRangeSelected(plate.wells.filter(w => w.selected))

        updateWellOutlines()
    }

    const selectColumn: (event: MouseEvent) => void = (event: MouseEvent) => {
        const colNumber = d3.select(event.target as SVGRectElement).datum()
        plate.wells.forEach(well => {
            if (well.x == colNumber) {
                well.selected = event.metaKey ? !well.selected : true
            } else if (!event.metaKey) {
                well.selected = false
            }
        })
        if (wellRangeSelected) wellRangeSelected(plate.wells.filter(w => w.selected))

        updateWellOutlines()
    }

    const plateDiagram: PlateDiagram = {
        wells: (value: PlateDiagramWell[]) => {
            plate.wells = value
            return plateDiagram
        },

        getWells: () => {
            return plate.wells
        },

        wellRangeSelected: (value?: ((wells: PlateDiagramWell[]) => void) | null) => {
            if (value === undefined) {
              return wellRangeSelected
            }
            wellRangeSelected = value
            updateWellOutlines()
            return plateDiagram
        },

        updateWellContents: (value?: PlateDiagramWell[]) => {
            if (svg && value) updateWellDisplay(value)
            return plateDiagram
        },

        clearSelection: () => {
            plate.wells.forEach(well => well.selected = false)
            updateWellOutlines()
            return plateDiagram
        },

        selectAllWells: () => {
            plate.wells.forEach(well => well.selected = true)
            updateWellOutlines()
            return plateDiagram
        },

        render: (container: HTMLElement) => {
            _container = container

            if (_container) {
                svg = d3.select(_container)
                    .html(null)
                    .append('svg')
                const mainGroup = svg.append('g').attr('class', 'plate-diagram-main')
                mainGroup.append("g")
                    .attr("class", "plate-diagram-nodes")
                mainGroup.append('g')
                    .attr('class', 'plate-diagram-bottom-axis')
                mainGroup.append('g')
                    .attr('class', 'plate-diagram-left-axis')

                mainGroup
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            } else {
                svg = null
            }
            plateDiagram.resize()

            return plateDiagram
        },

        resize: () => {
            if (_container && svg) {
                svg.attr("width", plateWidth() + margin.left + margin.right)
                    .attr("height", plateHeight() + margin.top + margin.bottom)
            }
            return plateDiagram
        },

        refresh: () => {
            if (_container && svg) {
                plateDiagram.resize()
                const cols = _.range(1, plate.sizeX + 1)
                const rows = _.range(1, plate.sizeY + 1)

                // Build X scales and axis:
                xScale.range([ 0, plateWidth() ])
                    .domain(_.map(cols, _.toString))
                svg.select('g.plate-diagram-bottom-axis')
                    .style("font-size", 15)
                    .style("user-select", "none")
                    .attr("transform", "translate(0," + plateHeight() + ")")
                    // @ts-ignore
                    .call(d3.axisBottom(xScale).tickSize(0))
                    .on('click', function(event) {
                        selectColumn(event)
                    })
                    .select(".domain").remove()

                // Build Y scales and axis:
                yScale.range([ 0, plateHeight() ])
                    .domain(_.map(rows, _.toString))
                svg.select('g.plate-diagram-left-axis')
                    .style("font-size", 15)
                    .style("user-select", "none")
                    // @ts-ignore
                    .call(d3.axisLeft(yScale).tickSize(0).tickFormat(n => wellCoordinateToChar(parseInt(n))))
                    .on('click', function(event) {
                        selectRow(event)
                    })
                    .select(".domain").remove()

                // Build color scale
                // const myColor = d3.scaleSequential()
                //     .interpolator(d3.interpolateInferno)
                //     .domain([1,100])

                // style tooltip
                tooltip.style("opacity", 0)
                    .attr("class", "tooltip")
                    .style("position", "absolute")
                    .style("user-select", "none")
                    .style("color", "color-mix(in srgb, var(--p-surface-0) calc(100%* var(--tw-text-opacity, 1)), transparent)")
                    .style("background-color", "color-mix(in srgb, var(--p-surface-700) calc(100%* var(--tw-bg-opacity, 1)), transparent)")
                    .style("border", "solid")
                    .style("border-width", "2px")
                    .style("border-radius", "5px")
                    .style("z-index", "10")
                    .style("border-color", "color-mix(in srgb, var(--p-surface-700) calc(100%* var(--tw-bg-opacity, 1)), transparent)")
                    .style("padding", "5px")

                // add the squares
                // svg.selectAll()
                //     .data(plate.wells)
                //     .enter()
                //     .append("rect")
                //         .attr("x", <ValueFn<any, any, any>>getX)
                //         .attr("y", <ValueFn<any, any, any>>getY)
                //         .attr("xcoord", <ValueFn<any, any, any>>xCoord)
                //         .attr("ycoord", <ValueFn<any, any, any>>yCoord)
                //         .attr("rx", 2)
                //         .attr("ry", 2)
                //         .attr('tooltip', function(w:PlateDiagramWell) { return w.tooltip || ""})
                //         .attr("width", x.bandwidth() - wellSpacing.x)
                //         .attr("height", y.bandwidth() - wellSpacing.y)
                //         .style("fill", function(w:PlateDiagramWell) { return w.color || "#ddd"})
                //         .style("stroke-width", 2)
                //         .style("opacity", 0.8)
                //     .on("mouseover", mouseover)
                //     .on("mousemove", mousemove)
                //     .on("mouseleave", mouseleave)
                //     .on('mousedown', mousedown)
                //     .on('mouseup', mouseup)
                //     .on('click', mouseclick)

                 svg.select('g.plate-diagram-nodes')
                    .selectAll('g.plate-diagram-node')
                    .data(plate.wells, (d => (d as PlateDiagramWell).id))
                    .join(
                        (enter) => {
                            const g = enter.append('g')
                                .attr('class', 'plate-diagram-node')
                            g.append("rect")
                                .attr("x", <ValueFn<any, any, any>>getX)
                                .attr("y", <ValueFn<any, any, any>>getY)
                                .attr("xcoord", <ValueFn<any, any, any>>xCoord)
                                .attr("ycoord", <ValueFn<any, any, any>>yCoord)
                                .attr("rx", 2)
                                .attr("ry", 2)
                                .attr('tooltip', function(w:PlateDiagramWell) { return w.tooltip || ""})
                                .attr("width", xScale.bandwidth() - wellSpacing.x)
                                .attr("height", yScale.bandwidth() - wellSpacing.y)
                                .style("fill", function(w:PlateDiagramWell) { return w.color || "#ddd"})
                                .style("stroke-width", 2)
                                .style("opacity", 0.8)
                                .on("mouseover", mouseover)
                                .on("mousemove", mousemove)
                                .on("mouseleave", mouseleave)
                                .on('mousedown', mousedown)
                                .on('mouseup', mouseup)
                                .on('click', mouseclick)

                            g.append('text')
                                .attr('class', 'well-decoration-text')
                                .attr('text-anchor', 'middle')
                                .attr('x', (w:PlateDiagramWell) => getX(w) + (xScale.bandwidth() - wellSpacing.x)/2)
                                .attr('y', (w:PlateDiagramWell) => getY(w) + (yScale.bandwidth() - wellSpacing.y)/2 + 5)
                                .text((w:PlateDiagramWell) => { return w.symbol || ""})
                                .style('fill', (w:PlateDiagramWell) => getWellTextColor(w.color || "#ddd"))
                                .style('pointer-events', 'none')
                            return g
                        },
                        (update) => {
                            update.each(function(this) {
                                const rect = d3.select(this).select('rect') as d3.Selection<SVGRectElement, PlateDiagramWell, any, any>
                                rect
                                    .on("mouseover", mouseover)
                                    .on("mousemove", mousemove)
                                    .on("mouseleave", mouseleave)
                                    .on('mousedown', mousedown)
                                    .on('mouseup', mouseup)
                                    .on('click', mouseclick)
                            })
                            return update
                        },
                        (exit) => exit.remove(),
                    )
                // add the well decoration symbols
                // svg.selectAll()
                //     .data(plate.wells)
                //     .enter()
                //     .append('text')
                //     .attr('class', 'well-decoration-text')
                //     .attr('text-anchor', 'middle')
                //     .attr('x', (w:PlateDiagramWell) => getX(w) + (x.bandwidth() - wellSpacing.x)/2)
                //     .attr('y', (w:PlateDiagramWell) => getY(w) + (y.bandwidth() - wellSpacing.y)/2 + 5)
                //     .text((w:PlateDiagramWell) => { return w.symbol || ""})
                //     .style('fill', (w:PlateDiagramWell) => getWellTextColor(w.color || "#ddd"))
                //     .style('pointer-events', 'none')

                updateWellOutlines()
            }
            return plateDiagram
        }
    }
    return plateDiagram
}
