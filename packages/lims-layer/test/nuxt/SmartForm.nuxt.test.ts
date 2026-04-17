import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { z } from 'zod'
import SmartForm from '../../app/components/SmartForm.vue'

describe('SmartForm', () => {
    it('renders labels for each schema field', async () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
        })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { name: null, age: null },
            },
        })
        const labels = component.findAll('label')
        const labelTexts = labels.map((l) => l.text())
        expect(labelTexts).toContain('Name')
        expect(labelTexts).toContain('Age')
    })

    it('renders a text input for z.string() field', async () => {
        const schema = z.object({ name: z.string() })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { name: null },
            },
        })
        // PrimeVue InputText renders as <input> with data-pc-name="inputtext"
        const input = component.find('input[data-pc-name="inputtext"]')
        expect(input.exists()).toBe(true)
    })

    it('renders a checkbox for z.boolean() field', async () => {
        const schema = z.object({ active: z.boolean() })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { active: null },
            },
        })
        // PrimeVue Checkbox renders with data-pc-name="checkbox"
        const checkbox = component.find('[data-pc-name="checkbox"]')
        expect(checkbox.exists()).toBe(true)
    })

    it('renders a submit button when not readOnly', async () => {
        const schema = z.object({ name: z.string() })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { name: null },
            },
        })
        const submitBtn = component.find('button[type="submit"]')
        expect(submitBtn.exists()).toBe(true)
        expect(submitBtn.text()).toContain('Submit')
    })

    it('hides submit button when readOnly', async () => {
        const schema = z.object({ name: z.string() })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { name: null },
                readOnly: true,
            },
        })
        const submitBtn = component.find('button[type="submit"]')
        expect(submitBtn.exists()).toBe(false)
    })

    it('renders correct number of form fields', async () => {
        const schema = z.object({
            firstName: z.string(),
            lastName: z.string(),
            email: z.string(),
        })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { firstName: null, lastName: null, email: null },
            },
        })
        const labels = component.findAll('label')
        expect(labels).toHaveLength(3)
    })

    it('uses custom label from fieldConfigs', async () => {
        const schema = z.object({ name: z.string() })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { name: null },
                fieldConfigs: { name: { label: 'Full Name' } },
            },
        })
        const label = component.find('label')
        expect(label.text()).toBe('Full Name')
    })

    it('displays server errors when provided', async () => {
        const schema = z.object({ email: z.string() })
        const component = await mountSuspended(SmartForm, {
            props: {
                zodSchema: schema,
                initialValues: { email: 'test@test.com' },
                serverErrors: { email: 'Email already taken' },
            },
        })
        expect(component.text()).toContain('Email already taken')
    })
})
