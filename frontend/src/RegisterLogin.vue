// TESTING TESTING

<template>
  <v-app>
    <DashboardOverview v-if="dashboardOpen" @logout="dashboardOpen = false" />
    <v-main v-else class="admin-access">
      <section class="access-page">
        <div class="brand-logo-wrapper">
          <img src="@/assets/TBLOGO.png" alt="Tikboy Longganisa Logo" class="brand-logo" />
        </div>

        <v-card class="access-card" elevation="0">
          <div class="shield-badge">
            <v-icon icon="mdi-shield-outline" size="38" />
          </div>

          <header class="access-header">
            <h1>{{ isSetup ? 'Setup Admin Access' : 'Admin Login' }}</h1>
            <p>
              {{ isSetup
                ? 'Create your admin passcode to secure the dashboard'
                : 'Enter your passcode to access the dashboard' }}
            </p>
          </header>

          <v-form @submit.prevent="isSetup ? setupAccess() : login()">
            <template v-if="isSetup">
              <label for="new-passcode"><v-icon icon="mdi-key-variant" size="21" /> Create Admin Passcode</label>
              <v-text-field
                id="new-passcode"
                v-model="newPasscode"
                aria-label="Create admin passcode"
                class="access-input"
                hide-details
                placeholder="Enter new passcode (min. 6 characters)"
                type="password"
                variant="solo"
              />

              <label for="confirm-passcode">Confirm Passcode</label>
              <v-text-field
                id="confirm-passcode"
                v-model="confirmPasscode"
                aria-label="Confirm passcode"
                class="access-input"
                hide-details
                placeholder="Confirm your passcode"
                type="password"
                variant="solo"
              />

              <v-divider class="form-divider" />

              <label for="security-question">Security Question (for passcode recovery)</label>
              <v-text-field
                id="security-question"
                v-model="securityQuestion"
                aria-label="Security question"
                class="access-input"
                hide-details
                placeholder="e.g., What is your favorite food?"
                variant="solo"
              />
              <v-text-field
                v-model="securityAnswer"
                aria-label="Security answer"
                class="access-input"
                hide-details
                placeholder="Your answer"
                variant="solo"
              />
            </template>

            <template v-else>
              <label for="login-passcode"><v-icon icon="mdi-lock-outline" size="21" /> Admin Passcode</label>
              <v-text-field
                id="login-passcode"
                v-model="loginPasscode"
                aria-label="Admin passcode"
                class="access-input login-input"
                hide-details
                placeholder="Enter your passcode"
                type="password"
                variant="solo"
              />
            </template>

            <p v-if="message" :class="['form-message', messageType]" role="alert">{{ message }}</p>
            <v-btn block class="submit-button" size="x-large" type="submit">
              {{ isSetup ? 'Setup Dashboard Access' : 'Login to Dashboard' }}
              <v-icon icon="mdi-arrow-right" end />
            </v-btn>
          </v-form>

          <button v-if="!isSetup" class="text-action" type="button" @click="recoveryOpen = true">Forgot your passcode?</button>
        </v-card>

        <p class="security-note"><v-icon icon="mdi-lock-outline" size="21" /> Secure admin access for TIKBOY LONGGANISA Dashboard</p>
        <button v-if="!isSetup" class="back-link" type="button" @click="resetAccess">← Back to Store</button>
      </section>
    </v-main>

    <v-dialog v-model="recoveryOpen" max-width="420">
      <v-card class="recovery-card">
        <v-card-title>Passcode Recovery</v-card-title>
        <v-card-text>
          <p>Answer your security question to confirm your account.</p>
          <strong>{{ savedAccess?.question }}</strong>
          <v-text-field v-model="recoveryAnswer" class="mt-5" label="Your answer" variant="outlined" />
          <p v-if="recoveryMessage" :class="['form-message', recoveryType]">{{ recoveryMessage }}</p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="recoveryOpen = false">Cancel</v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" @click="verifyRecovery">Verify</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import DashboardOverview from '@/components/DashboardOverview.vue'

  type AccessDetails = { passcode: string, question: string, answer: string }
  // Access details are retained for the current browser tab only.
  // They survive refreshes but are cleared after the tab/browser session closes.
  localStorage.removeItem('tikboy-admin-access')
  const storageKey = 'tikboy-admin-access'
  const readAccess = (): AccessDetails | null => {
    try {
      const value = sessionStorage.getItem(storageKey)
      return value ? JSON.parse(value) as AccessDetails : null
    } catch { return null }
  }
  const savedAccess = ref<AccessDetails | null>(readAccess())
  const isSetup = computed(() => !savedAccess.value)
  const newPasscode = ref('')
  const confirmPasscode = ref('')
  const securityQuestion = ref('')
  const securityAnswer = ref('')
  const loginPasscode = ref('')
  const message = ref('')
  const messageType = ref<'error' | 'success'>('error')
  const recoveryOpen = ref(false)
  const recoveryAnswer = ref('')
  const recoveryMessage = ref('')
  const recoveryType = ref<'error' | 'success'>('error')
  const dashboardOpen = ref(false)

  const setMessage = (text: string, type: 'error' | 'success' = 'error') => {
    message.value = text
    messageType.value = type
  }

  const setupAccess = () => {
    if (newPasscode.value.length < 6) return setMessage('Your passcode must be at least 6 characters.')
    if (newPasscode.value !== confirmPasscode.value) return setMessage('The passcodes do not match.')
    if (!securityQuestion.value.trim() || !securityAnswer.value.trim()) return setMessage('Add a security question and answer to continue.')
    savedAccess.value = { passcode: newPasscode.value, question: securityQuestion.value.trim(), answer: securityAnswer.value.trim() }
    sessionStorage.setItem(storageKey, JSON.stringify(savedAccess.value))
    setMessage('', 'success')
  }

  const login = () => {
    if (loginPasscode.value !== savedAccess.value?.passcode) return setMessage('Incorrect passcode. Please try again.')
    dashboardOpen.value = true
  }

  const verifyRecovery = () => {
    if (recoveryAnswer.value.trim().toLowerCase() !== savedAccess.value?.answer.toLowerCase()) {
      recoveryMessage.value = 'That answer does not match. Please try again.'
      recoveryType.value = 'error'
      return
    }
    recoveryMessage.value = 'Verified. Your passcode is: ' + savedAccess.value.passcode
    recoveryType.value = 'success'
  }

  const resetAccess = () => {
    message.value = 'Store navigation is ready to connect to your storefront.'
    messageType.value = 'success'
  }
</script>

<style scoped>
  .brand-logo {max-width: 300px; width: 100%; height: auto; object-fit: contain;}
  .admin-access { min-height: 100vh; background: #f5f6f8; color: #102847; font-family: Roboto, sans-serif; }
  .access-page { width: min(100% - 48px, 560px); margin: 40px auto 24px; text-align: center; }
  .access-card { padding: 40px 40px 39px; border-radius: 20px; background: #fff; box-shadow: 0 14px 20px rgba(16, 40, 71, .13) !important; text-align: left; }
  .shield-badge { display: grid; place-items: center; width: 80px; height: 80px; margin: 0 auto 24px; border-radius: 50%; background: #d1283a; color: white; }
  .access-header { text-align: center; margin-bottom: 39px; }
  h1 { margin: 0 0 12px; color: #071e40; font-size: 30px; font-weight: 700; line-height: 1.1; }
  .access-header p { margin: 0; color: #334d70; font-size: 17px; }
  label { display: flex; align-items: center; gap: 9px; margin: 0 0 10px; color: #203a5d; font-size: 16px; font-weight: 700; }
  .access-input { margin-bottom: 25px; }
  :deep(.access-input .v-field) { background: #f4f4f6; border-radius: 10px; box-shadow: none; min-height: 60px; }
  :deep(.access-input .v-field__input) { color: #314969; font-size: 16px; opacity: 1; padding: 0 16px; }
  :deep(.access-input .v-field__input::placeholder) { color: #566d8e; opacity: 1; }
  .form-divider { margin: -5px 0 25px; }
  .submit-button { background: #d1283a; border-radius: 10px; color: white; font-size: 16px; font-weight: 700; text-transform: none; letter-spacing: 0; }
  .form-message { margin: -10px 0 16px; font-size: 14px; font-weight: 500; }
  .error { color: #c42a39; } .success { color: #23824e; }
  .text-action, .back-link { display: block; border: 0; background: none; color: #d1283a; cursor: pointer; font: inherit; font-weight: 600; }
  .text-action { margin: 30px auto 0; }
  .security-note { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 33px 0 19px; color: #334d70; font-size: 16px; }
  .back-link { margin: 0 auto; font-size: 16px; }
  .recovery-card { border-radius: 16px; }
  @media (max-width: 600px) { .access-page { width: min(100% - 32px, 560px); margin-top: 20px; } .access-card { padding: 32px 28px; } h1 { font-size: 28px; } .access-header p { font-size: 16px; } }
</style>
