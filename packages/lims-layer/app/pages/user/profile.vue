<script setup>
const { loggedIn, user, session, fetch, clear } = useUserSession()
const config = useRuntimeConfig()
const toast = useToast()

const changingPassword = ref(false)
const oldPassword = ref()
const newPassword1 = ref()
const newPassword2 = ref()
const passwordsMatch = computed(() => newPassword1.value == newPassword2.value)

const updatePassword = function(event) {
    $fetch(`${config.public.apiBase}/users/changepassword`, {
        method: 'POST',
        body: {
            oldPassword: oldPassword.value,
            newPassword: newPassword2.value
        }
    }).then(() => {
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Password updated', life: 3000 })
        changingPassword.value=false
        oldPassword.value = null
        newPassword1.value = null
        newPassword2.value = null
    }).catch(error => {
        toast.add({ severity: 'error', summary: 'Error', detail: error.data?.statusMessage, life: 3000 })
    })
}
</script>

<template>
    <div class=" flex items-center justify-center">
        <div class="flex flex-col" v-if="user">
            <div class="mb-5">
                <label for="userName" class="block font-bold mb-3">Name</label>
                <InputText disabled id="userName" v-model="user.name" />
            </div>
            <div class="mb-5">
                <label for="userEmail" class="block font-bold mb-3">Email</label>
                <InputText disabled id="userEmail" v-model="user.email" />
            </div>
            <div v-if="!changingPassword" class="mb-5">
                <label for="userPassword" class="block font-bold mb-3">Password</label>
                <Password disabled id="userPassword" v-model="user.password" />
                <Button class="m-1" icon="pi pi-pencil" text severity="info" @click="changingPassword=!changingPassword" />
            </div>
            <div v-if="changingPassword" >
                <div class="mb-5">
                    <label for="oldPasswordInput" class="block font-bold mb-3">Current password</label>
                    <Password
                        id="oldPasswordInput"
                        v-model="oldPassword"
                        placeholder="Password"
                        :toggleMask="true"
                        :feedback="false"
                    />
                </div>
                <div class="mb-5">
                    <label for="newPasswordInput1" class="block font-bold mb-3">New password</label>
                    <Password
                        id="newPasswordInput1"
                        v-model="newPassword1"
                        placeholder="Password"
                        :toggleMask="true"
                        :feedback="false"
                    />
                </div>
                <div class="mb-5">
                    <label for="newPasswordInput2" class="block font-bold mb-3">Confirm new password</label>
                    <Password
                        id="newPasswordInput2"
                        v-model="newPassword2"
                        placeholder="Password"
                        :toggleMask="true"
                        :feedback="false"
                    />
                    <Message :class="{ invisible: !(newPassword2 && !passwordsMatch), 'mb-6': true }" severity="error">Passwords don't match</Message>
                </div>
                <div>
                    <Button class="m-1" icon="pi" text label="Cancel" @click="changingPassword=false" />
                    <Button
                        class="m-1"
                        icon="pi"
                        label="Submit"
                        :disabled="!oldPassword || !newPassword2 || newPassword2!=newPassword1"
                        @click="updatePassword"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
