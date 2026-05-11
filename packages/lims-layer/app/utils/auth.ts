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

export async function requestPasswordReset(email: string) {
    try {
        const response = await $fetch(`/api/users/request-password-reset`, {method: 'POST', body: { email }})
        return response
    } catch (err: unknown) {
        const errorMessage = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Request failed. Please try again.'
        return {success: false, errorMessage}
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        const response = await $fetch(`/api/users/reset-password`, {method: 'POST', body: { token, newPassword }})
        return response as { success: boolean }
    } catch (err: unknown) {
        const errorMessage = (err as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Password reset failed. The link may have expired.'
        return {success: false, errorMessage}
    }
}
