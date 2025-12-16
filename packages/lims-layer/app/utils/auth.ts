export async function loginUser(email: String, password: String) {
    try {
        const response = await $fetch(`/api/users/login`, {method: 'POST', body: { email, password }})
        return response
    } catch (err:any) {
        return {success: false, errorMessage: err.data?.statusMessage || 'Login failed. Please check your credentials.'}
    }
}

export async function registerUser(name: String, email: String, password: String) {
    try {
        const response = await $fetch(`/api/users/register`, {method: 'POST', body: { name, email, password }})
        return response
    } catch (err:any) {
        console.error(JSON.stringify(err))
        return {success: false, errorMessage: err.data?.statusMessage || 'Registration failed.'}
    }
}
