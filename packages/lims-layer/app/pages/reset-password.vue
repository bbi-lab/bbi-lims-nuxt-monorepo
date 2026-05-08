<script setup lang="ts">
import { resetPassword } from '@/utils/auth'

definePageMeta({
  layout: 'empty',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const token = computed(() => route.query.token as string | undefined)

const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const passwordsMatch = computed(() => newPassword.value === confirmPassword.value)

onMounted(() => {
  if (!token.value) {
    toast.add({ severity: 'error', summary: 'Invalid reset link. Please request a new one.' })
    router.replace('/forgot-password')
  }
})

async function onSubmit() {
  if (!token.value || !newPassword.value || !passwordsMatch.value) return
  submitting.value = true
  try {
    const result = await resetPassword(token.value, newPassword.value)
    if (result.success) {
      toast.add({ severity: 'success', summary: 'Password reset successfully. Please sign in.' })
      router.replace('/login')
    } else {
      toast.add({ severity: 'error', summary: result.errorMessage || 'Password reset failed.' })
    }
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
            <span class="text-muted-color font-medium">Set a new password</span>
          </div>

          <div>
            <label for="new-password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">New Password</label>
            <Password
              id="new-password"
              v-model="newPassword"
              placeholder="New password"
              :toggleMask="true"
              class="mb-6"
              fluid
              :feedback="false"
            />

            <label for="confirm-password" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Confirm Password</label>
            <Password
              id="confirm-password"
              v-model="confirmPassword"
              placeholder="Confirm new password"
              :toggleMask="true"
              class="mb-2"
              fluid
              :feedback="false"
            />

            <Message
              :class="{ invisible: !(confirmPassword && !passwordsMatch), 'mb-6': true }"
              severity="error"
              :closable="false"
            >
              Passwords don't match
            </Message>

            <Button
              label="Reset Password"
              class="w-full mt-4"
              :loading="submitting"
              :disabled="!newPassword || !confirmPassword || !passwordsMatch || submitting"
              @click="onSubmit"
            />

            <div class="flex items-center justify-center mt-4">
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
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}
</style>
