export async function loginUser(email: string, password: string) {
    try {
        const response = await $fetch(`/api/users/login`, {method: 'POST', body: { email, password }})
        return response
    } catch (err: unknown) {
        const errorMessage = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Login failed. Please check your credentials.'
        return {success: false, errorMessage}
    }
}

export async function registerUser(name: string, email: string, password: string) {
    try {
        const response = await $fetch(`/api/users/register`, {method: 'POST', body: { name, email, password }})
        return response
    } catch (err: unknown) {
        console.error(JSON.stringify(err))
        const errorMessage = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Registration failed.'
        return {success: false, errorMessage}
    }
}
