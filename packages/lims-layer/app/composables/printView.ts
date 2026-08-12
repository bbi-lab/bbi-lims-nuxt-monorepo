/**
 * Tracks whether the page is currently being rendered for print, so a page can
 * swap in a paper-friendly layout, and exposes a handler for a "Print view"
 * button. `isPrinting` also flips for browser-initiated printing (Ctrl+P).
 */
export const usePrintView = () => {
    const isPrinting = ref(false)

    const onBeforePrint = () => { isPrinting.value = true }
    const onAfterPrint = () => { isPrinting.value = false }

    onMounted(() => {
        window.addEventListener('beforeprint', onBeforePrint)
        window.addEventListener('afterprint', onAfterPrint)
    })

    onUnmounted(() => {
        window.removeEventListener('beforeprint', onBeforePrint)
        window.removeEventListener('afterprint', onAfterPrint)
    })

    // Let the print-only layout render before handing off to the browser
    const printView = async () => {
        isPrinting.value = true
        await nextTick()
        window.print()
    }

    return { isPrinting, printView }
}
