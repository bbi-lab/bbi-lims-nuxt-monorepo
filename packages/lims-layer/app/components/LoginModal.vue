<script setup>
import { loginUser } from '../utils/auth'
const { fetch, loggedIn, session } = useUserSession()

const toast = useToast()
const email = ref('')
const password = ref('')
const checked = ref(false)
const {isLoginModalVisible, hideLoginModal} = useLayout()

async function onDidClickSignIn(event) {
    if (email.value && password.value) {
        const response = await loginUser(email.value, password.value, {event})
        if (response.success) {
            // fetching session from server, otherwise loggedIn value may still be false
            await fetch()
            if (loggedIn.value) {
                hideLoginModal()
            }
        } else {
            toast.add({severity: 'error', summary: response.errorMessage})
        }
    }
}
</script>

<template>
    <Dialog :visible="isLoginModalVisible" :closable="false" modal :style="{ width: '35' }">
        <slot name="header">
            <span class="flex justify-center font-bold text-2xl">Log in to continue</span>
        </slot>
        <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
            <div>
                <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                <InputText id="email1" type="text" placeholder="Email address" class="w-full md:w-[30rem] mb-8" v-model="email" />

                <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                <Password
                    id="password1"
                    v-model="password"
                    placeholder="Password"
                    :toggleMask="true"
                    class="mb-4"
                    fluid
                    :feedback="false"
                    @keyup.enter="onDidClickSignIn"
                ></Password>

                <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                    <div class="flex items-center invisible">
                        <Checkbox v-model="checked" id="rememberme1" binary class="mr-2"></Checkbox>
                        <label for="rememberme1">Remember me</label>
                    </div>
                    <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Forgot password?</span>
                </div>
                <Button label="Sign In" class="w-full" @click="onDidClickSignIn"></Button>
            </div>
        </div>
    </Dialog>
</template>
