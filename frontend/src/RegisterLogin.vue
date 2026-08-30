<template>
  <v-app>
    <DashboardOverview
      v-if="dashboardOpen"
      @logout="logout"
    />

    <v-main v-else class="admin-access">
      <section class="access-page">
        <div class="brand-logo-wrapper">
          <img
            src="@/assets/TBLOGO.png"
            alt="Tikboy Longganisa Logo"
            class="brand-logo"
          />
        </div>

        <v-card class="access-card" elevation="0">
          <div class="shield-badge">
            <v-icon icon="mdi-shield-outline" size="38" />
          </div>

          <header class="access-header">
            <h1>Admin Login</h1>

            <p>
              Enter your Directus email and password to access the dashboard.
            </p>
          </header>

          <v-form @submit.prevent="login">
            <label for="login-email">
              <v-icon icon="mdi-email-outline" size="21" />
              Email Address
            </label>

            <v-text-field
              id="login-email"
              v-model="email"
              aria-label="Email address"
              class="access-input"
              hide-details
              placeholder="Enter your email address"
              type="email"
              autocomplete="username"
              variant="solo"
            />

            <label for="login-password">
              <v-icon icon="mdi-lock-outline" size="21" />
              Password
            </label>

            <v-text-field
              id="login-password"
              v-model="password"
              aria-label="Password"
              class="access-input login-input"
              hide-details
              placeholder="Enter your password"
              type="password"
              autocomplete="current-password"
              variant="solo"
            />

            <p
              v-if="message"
              :class="['form-message', messageType]"
              role="alert"
            >
              {{ message }}
            </p>

            <v-btn
              block
              class="submit-button"
              size="x-large"
              type="submit"
              :loading="loading"
            >
              Login to Dashboard
              <v-icon icon="mdi-arrow-right" end />
            </v-btn>
          </v-form>

          <button
            class="text-action"
            type="button"
            @click="openRegistration"
          >
            Create an Owner Account
          </button>
        </v-card>

        <p class="security-note">
          <v-icon icon="mdi-lock-outline" size="21" />
          Secure access for TIKBOY LONGGANISA Dashboard
        </p>

        <button
          class="back-link"
          type="button"
          @click="backToStore"
        >
          ← Back to Store
        </button>
      </section>
    </v-main>

    <v-dialog v-model="registrationOpen" max-width="500">
      <v-card class="registration-card">
        <v-card-title>Create Owner Account</v-card-title>

        <v-card-text>
          <p class="registration-description">
            Create an Owner account using your email and password.
          </p>

          <v-text-field
            v-model="registration.firstName"
            label="First Name"
            variant="outlined"
            :disabled="registering"
          />

          <v-text-field
            v-model="registration.lastName"
            label="Last Name"
            variant="outlined"
            :disabled="registering"
          />

          <v-text-field
            v-model="registration.email"
            label="Email Address"
            type="email"
            variant="outlined"
            :disabled="registering"
          />

          <v-text-field
            v-model="registration.password"
            label="Password"
            type="password"
            variant="outlined"
            hint="Use at least 8 characters."
            :disabled="registering"
          />

          <v-text-field
            v-model="registration.confirmPassword"
            label="Confirm Password"
            type="password"
            variant="outlined"
            :disabled="registering"
          />

          <p
            v-if="registrationMessage"
            :class="['form-message', registrationMessageType]"
          >
            {{ registrationMessage }}
          </p>
        </v-card-text>

        <v-card-actions>
          <v-btn
            :disabled="registering"
            @click="registrationOpen = false"
          >
            Cancel
          </v-btn>

          <v-spacer />

          <v-btn
            color="primary"
            variant="flat"
            :loading="registering"
            @click="registerOwner"
          >
            Create Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import DashboardOverview from '@/components/DashboardOverview.vue'

const API_URL = 'http://localhost:8055'

type DirectusErrorResponse = {
  errors?: Array<{
    message?: string
  }>
}

type DirectusLoginResponse = DirectusErrorResponse & {
  data?: {
    access_token: string
    refresh_token: string
    expires: number
  }
}

const email = ref('')
const password = ref('')
const message = ref('')
const messageType = ref<'error' | 'success'>('error')
const loading = ref(false)
const dashboardOpen = ref(false)

const registrationOpen = ref(false)
const registering = ref(false)
const registrationMessage = ref('')
const registrationMessageType = ref<'error' | 'success'>('error')

const registration = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function setMessage(
  text: string,
  type: 'error' | 'success' = 'error',
) {
  message.value = text
  messageType.value = type
}

function getErrorMessage(
  result: DirectusErrorResponse,
  fallbackMessage: string,
) {
  return result.errors?.[0]?.message || fallbackMessage
}

function resetRegistrationForm() {
  registration.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  }

  registrationMessage.value = ''
  registrationMessageType.value = 'error'
}

function openRegistration() {
  resetRegistrationForm()
  registrationOpen.value = true
}

async function login() {
  setMessage('')

  if (!email.value.trim()) {
    setMessage('Enter your email address.')
    return
  }

  if (!password.value) {
    setMessage('Enter your password.')
    return
  }

  loading.value = true

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    })

    const result = (await response.json()) as DirectusLoginResponse

    if (!response.ok || !result.data) {
      throw new Error(
        getErrorMessage(result, 'Incorrect email or password.'),
      )
    }

    localStorage.setItem('access_token', result.data.access_token)
    localStorage.setItem('refresh_token', result.data.refresh_token)

    password.value = ''
    dashboardOpen.value = true
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Could not log in to Directus.'

    setMessage(errorMessage)
  } finally {
    loading.value = false
  }
}

async function registerOwner() {
  registrationMessage.value = ''

  if (!registration.value.firstName.trim()) {
    registrationMessage.value = 'Enter your first name.'
    registrationMessageType.value = 'error'
    return
  }

  if (!registration.value.lastName.trim()) {
    registrationMessage.value = 'Enter your last name.'
    registrationMessageType.value = 'error'
    return
  }

  if (!registration.value.email.trim()) {
    registrationMessage.value = 'Enter your email address.'
    registrationMessageType.value = 'error'
    return
  }

  if (registration.value.password.length < 8) {
    registrationMessage.value =
      'Password must be at least 8 characters.'
    registrationMessageType.value = 'error'
    return
  }

  if (
    registration.value.password !==
    registration.value.confirmPassword
  ) {
    registrationMessage.value = 'The passwords do not match.'
    registrationMessageType.value = 'error'
    return
  }

  registering.value = true

  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: registration.value.email.trim(),
        password: registration.value.password,
        first_name: registration.value.firstName.trim(),
        last_name: registration.value.lastName.trim(),
      }),
    })

    if (!response.ok) {
      const result = (await response.json()) as DirectusErrorResponse

      throw new Error(
        getErrorMessage(result, 'Could not create the account.'),
      )
    }

    registrationMessage.value =
      'Account created successfully. You can now log in.'

    registrationMessageType.value = 'success'

    registration.value = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  } catch (error: unknown) {
    registrationMessage.value =
      error instanceof Error
        ? error.message
        : 'Could not create the account.'

    registrationMessageType.value = 'error'
  } finally {
    registering.value = false
  }
}

async function restoreSavedSession() {
  const token = localStorage.getItem('access_token')

  if (!token) {
    return
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Saved login is no longer valid.')
    }

    dashboardOpen.value = true
  } catch {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')

  email.value = ''
  password.value = ''
  dashboardOpen.value = false

  setMessage('You have logged out successfully.', 'success')
}

function backToStore() {
  setMessage(
    'Store navigation is ready to connect to your storefront.',
    'success',
  )
}

onMounted(restoreSavedSession)
</script>

<style scoped>
.brand-logo {
  max-width: 300px;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.admin-access {
  min-height: 100vh;
  background: #f5f6f8;
  color: #102847;
  font-family: Roboto, sans-serif;
}

.access-page {
  width: min(100% - 48px, 560px);
  margin: 40px auto 24px;
  text-align: center;
}

.access-card {
  padding: 40px 40px 39px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 14px 20px rgba(16, 40, 71, 0.13) !important;
  text-align: left;
}

.shield-badge {
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  border-radius: 50%;
  background: #d1283a;
  color: white;
}

.access-header {
  margin-bottom: 39px;
  text-align: center;
}

h1 {
  margin: 0 0 12px;
  color: #071e40;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.1;
}

.access-header p {
  margin: 0;
  color: #334d70;
  font-size: 17px;
}

label {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 10px;
  color: #203a5d;
  font-size: 16px;
  font-weight: 700;
}

.access-input {
  margin-bottom: 25px;
}

:deep(.access-input .v-field) {
  min-height: 60px;
  border-radius: 10px;
  background: #f4f4f6;
  box-shadow: none;
}

:deep(.access-input .v-field__input) {
  padding: 0 16px;
  color: #314969;
  font-size: 16px;
  opacity: 1;
}

:deep(.access-input .v-field__input::placeholder) {
  color: #566d8e;
  opacity: 1;
}

.submit-button {
  border-radius: 10px;
  background: #d1283a;
  color: white;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}

.form-message {
  margin: 16px 0 0;
  font-size: 14px;
  font-weight: 500;
}

.error {
  color: #c42a39;
}

.success {
  color: #23824e;
}

.text-action,
.back-link {
  display: block;
  border: 0;
  background: none;
  color: #d1283a;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
}

.text-action {
  margin: 30px auto 0;
}

.back-link {
  margin: 0 auto;
  font-size: 16px;
}

.security-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 33px 0 19px;
  color: #334d70;
  font-size: 16px;
}

.registration-card {
  border-radius: 16px;
}

.registration-description {
  margin: 0 0 22px;
  color: #526985;
}

@media (max-width: 600px) {
  .access-page {
    width: min(100% - 32px, 560px);
    margin-top: 20px;
  }

  .access-card {
    padding: 32px 28px;
  }

  h1 {
    font-size: 28px;
  }

  .access-header p {
    font-size: 16px;
  }
}
</style>