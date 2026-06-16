
export const calculateYield = (concentration: string, volume: string): string | null => {
    const concentrationNum = parseFloat(concentration)
    const volumeNum = parseFloat(volume)
    if (!isNaN(concentrationNum) && !isNaN(volumeNum)) {
        return ((concentrationNum * volumeNum) / 1000).toFixed(1)
    }
    return null
}
