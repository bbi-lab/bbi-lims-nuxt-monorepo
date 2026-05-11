import { describe, expect, it, vi } from 'vitest'
import { mountSuspended, registerEndpoint, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { z } from 'zod'
import SmartTable from '../../app/components/SmartTable.client.vue'

// Mock useUserSession so the component treats the user as logged-in
mockNuxtImport('useUserSession', () => () => ({
    loggedIn: ref(true),
    user: ref({ name: 'Test User' }),
    session: ref({}),
    fetch: vi.fn(),
    clear: vi.fn(),
}))

describe('SmartTable', () => {
    it('shows empty message when no records returned', async () => {
        registerEndpoint('/api/test-table', () => [])

        const component = await mountSuspended(SmartTable, {
            props: {
                tableName: 'test-table',
                zodSchema: z.object({ id: z.string(), name: z.string() }),
                title: 'Test Table',
                emptyMessage: 'No records found',
                canAdd: false,
                canEdit: false,
                canDelete: false,
            },
        })

        // Wait for loadTableData to finish
        await vi.waitFor(() => {
            expect(component.text()).toContain('No records found')
        })
    })

    it('renders title from props', async () => {
        registerEndpoint('/api/test-items', () => [])

        const component = await mountSuspended(SmartTable, {
            props: {
                tableName: 'test-items',
                zodSchema: z.object({ id: z.string(), name: z.string() }),
                title: 'My Items',
                canAdd: false,
                canEdit: false,
                canDelete: false,
            },
        })

        await vi.waitFor(() => {
            expect(component.text()).toContain('My Items')
        })
    })

    it('renders column headers from zodSchema shape', async () => {
        registerEndpoint('/api/genes', () => [
            { id: '1', geneName: 'BRCA1', chromosome: '17' },
        ])

        const component = await mountSuspended(SmartTable, {
            props: {
                tableName: 'genes',
                zodSchema: z.object({
                    id: z.string(),
                    geneName: z.string(),
                    chromosome: z.string(),
                }),
                title: 'Genes',
                canAdd: false,
                canEdit: false,
                canDelete: false,
            },
        })

        await vi.waitFor(() => {
            const html = component.html()
            // formatFieldLabel('geneName') → 'Gene Name'
            expect(html).toContain('Gene Name')
            expect(html).toContain('Chromosome')
        })
    })

    it('renders Add button when canAdd is true', async () => {
        registerEndpoint('/api/items', () => [])

        const component = await mountSuspended(SmartTable, {
            props: {
                tableName: 'items',
                zodSchema: z.object({ id: z.string(), name: z.string() }),
                title: 'Items',
                canAdd: true,
                canEdit: false,
                canDelete: false,
            },
        })

        await vi.waitFor(() => {
            expect(component.text()).toContain('Add')
        })
    })

    it('hides Add button when canAdd is false', async () => {
        registerEndpoint('/api/items2', () => [])

        const component = await mountSuspended(SmartTable, {
            props: {
                tableName: 'items2',
                zodSchema: z.object({ id: z.string(), name: z.string() }),
                title: 'Items',
                canAdd: false,
                canEdit: false,
                canDelete: false,
            },
        })

        await vi.waitFor(() => {
            // "Add" button text should not be present in toolbar buttons
            const buttons = component.findAll('button')
            const addButton = buttons.find((b) => b.text().trim() === 'Add')
            expect(addButton).toBeUndefined()
        })
    })
})
