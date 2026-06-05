<script setup lang="ts">

definePageMeta({
  layout: "empty",
})
const toast = useToast()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const name = ref('')
const passwordsMatch = computed(() => password.value == confirmPassword.value)

async function onDidClickSignUp() {
    if (email.value && password.value) {
        const result = await registerUser(name.value, email.value, password.value)

        if (result.user) {
            navigateTo('/login')
        } else {
            toast.add({severity: 'error', summary: result.errorMessage})
        }
    }
}
</script>

<template>
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <img alt="logo" src="/images/bbi.png" class="w-40 mx-auto mb-2" />
                        <div class="text-surface-900 dark:text-surface-0 text-2xl font-medium mb-4">LIMS</div>
                        <span class="text-muted-color font-medium">Sign up here</span>
                    </div>

                    <div>
                        <label for="name1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Name</label>
                        <InputText id="name1" type="text" placeholder="Name" class="w-full md:w-[30rem] mb-8" v-model="name" />

                        <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                        <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-[30rem] mb-8" v-model="email" />

                        <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                        <Password
                            id="password1"
                            v-model="password"
                            placeholder="Password"
                            :toggleMask="true"
                            class="mb-8"
                            fluid
                            :feedback="false"
                        ></Password>

                        <label for="password2" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Re-enter Password</label>
                        <Password
                            id="password2"
                            v-model="confirmPassword"
                            placeholder="Re-enter Password"
                            :toggleMask="true"
                            class="mb-2"
                            fluid
                            :feedback="false"
                        ></Password>
                        <Message :class="{ invisible: !(confirmPassword && !passwordsMatch), 'mb-6': true }" severity="error">Passwords don't match</Message>
                        <Button label="Register" class="w-full" :disabled="!passwordsMatch || !name || !email" @click="onDidClickSignUp" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
