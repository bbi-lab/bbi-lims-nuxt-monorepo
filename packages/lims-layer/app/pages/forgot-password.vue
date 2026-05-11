<script setup lang="ts">
import { requestPasswordReset } from '../utils/auth'

definePageMeta({
  layout: 'empty',
})

const router = useRouter()
const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

async function onSubmit() {
  if (!email.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await requestPasswordReset(email.value)
    submitted.value = true
  } catch {
    errorMessage.value = 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
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
            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">LIMS</div>
            <span class="text-muted-color font-medium">Reset your password</span>
          </div>

          <div v-if="submitted" class="text-center">
            <Message severity="success" :closable="false" class="mb-6">
              If that email address is registered, you'll receive a reset link shortly. Please check your inbox.
            </Message>
            <Button label="Back to Sign In" class="w-full" @click="() => router.push('/login')" />
          </div>

          <div v-else>
            <label for="reset-email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
            <InputText
              id="reset-email"
              v-model="email"
              type="email"
              placeholder="Enter your email address"
              class="w-full md:w-[30rem] mb-6"
              @keyup.enter="onSubmit"
            />

            <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">{{ errorMessage }}</Message>

            <Button
              label="Send Reset Link"
              class="w-full mb-4"
              :loading="submitting"
              :disabled="!email || submitting"
              @click="onSubmit"
            />

            <div class="flex items-center justify-center mt-2">
              <a class="font-medium no-underline cursor-pointer text-primary" @click="() => router.push('/login')">
                Back to Sign In
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
