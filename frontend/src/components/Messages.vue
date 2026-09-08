<template>
  <section class="messages-page">
    <div class="stats-grid">
      <article v-for="stat in statistics" :key="stat.label" class="stat-card">
        <div :class="['stat-icon', stat.color]">
          <v-icon :icon="stat.icon" size="25" />
        </div>
        <div>
          <p>{{ stat.label }}</p>
          <strong>{{ stat.value }}</strong>
        </div>
      </article>
    </div>

    <div class="message-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }} ({{ tab.count }})
      </button>
    </div>

    <div class="messages-layout">
      <div class="message-list">
        <article
          v-for="message in filteredMessages"
          :key="message.id"
          :class="['message-card', { selected: selectedMessage?.id === message.id }]"
          role="button"
          tabindex="0"
          @click="selectMessage(message)"
          @keydown.enter="selectMessage(message)"
        >
          <div class="message-card-top">
            <div class="message-user">
              <div class="avatar">{{ message.name.charAt(0) }}</div>
              <div>
                <h3>{{ message.name }}</h3>
                <p>{{ message.time }}</p>
              </div>
            </div>

            <div class="message-labels">
              <span v-if="!message.read" class="unread-dot" />
              <span v-if="message.urgent" class="urgent-badge">
                <v-icon icon="mdi-alert-outline" size="14" />
                Urgent
              </span>
            </div>
          </div>

          <h4>{{ message.subject }}</h4>
          <p class="message-preview">{{ message.preview }}</p>
        </article>

        <p v-if="filteredMessages.length === 0" class="no-messages">
          No messages found.
        </p>
      </div>

      <aside class="message-details">
        <template v-if="selectedMessage">
          <div class="details-header">
            <div class="message-user">
              <div class="avatar large">{{ selectedMessage.name.charAt(0) }}</div>
              <div>
                <h3>{{ selectedMessage.name }}</h3>
                <p>{{ selectedMessage.email }}</p>
              </div>
            </div>

            <button class="close-details" type="button" @click="selectedMessage = null">
              <v-icon icon="mdi-close" />
            </button>
          </div>

          <div class="details-content">
            <span v-if="selectedMessage.urgent" class="urgent-badge">
              <v-icon icon="mdi-alert-outline" size="14" />
              Urgent
            </span>
            <h2>{{ selectedMessage.subject }}</h2>
            <p class="details-time">{{ selectedMessage.time }}</p>
            <p class="full-message">{{ selectedMessage.body }}</p>

            <div class="details-actions">
              <button class="reply-button" type="button" @click="replyToMessage">
                <v-icon icon="mdi-reply-outline" />
                Reply
              </button>
              <button class="archive-button" type="button" @click="archiveMessage">
                <v-icon icon="mdi-archive-outline" />
                Archive
              </button>
            </div>
          </div>
        </template>

        <div v-else class="empty-details">
          <div class="empty-details-icon">
            <v-icon icon="mdi-message-outline" size="46" />
          </div>
          <p>Select a message to view details</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type MessageTab = 'all' | 'unread' | 'urgent'

type CustomerMessage = {
  id: number
  name: string
  email: string
  time: string
  subject: string
  preview: string
  body: string
  read: boolean
  urgent: boolean
}

const props = defineProps<{ search?: string }>()

const emit = defineEmits<{ notice: [message: string] }>()

const activeTab = ref<MessageTab>('all')
const selectedMessage = ref<CustomerMessage | null>(null)

const messages = ref<CustomerMessage[]>([
  {
    id: 1,
    name: 'Maria Santos',
    email: 'maria.santos@example.com',
    time: '10 min ago',
    subject: 'Question about delivery',
    preview: "Hi! I'd like to know if you deliver to Cavite? I'm interested in ordering 5kg of your Classic Longganisa.",
    body: "Hi! I'd like to know if you deliver to Cavite? I'm interested in ordering 5kg of your Classic Longganisa. Please let me know the delivery fee and estimated delivery time.",
    read: false,
    urgent: false,
  },
  {
    id: 2,
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@example.com',
    time: '1 hour ago',
    subject: 'Bulk order inquiry',
    preview: "Good day! We're organizing a company event and need 50kg of assorted longganisa. Can you provide us a quote?",
    body: "Good day! We're organizing a company event and need 50kg of assorted longganisa. Can you provide us a quote and let us know your available delivery dates?",
    read: false,
    urgent: true,
  },
  {
    id: 3,
    name: 'Ana Reyes',
    email: 'ana.reyes@example.com',
    time: '3 hours ago',
    subject: 'Product availability',
    preview: 'Hello, do you still have the Spicy Longganisa available? I would like to order two packs.',
    body: 'Hello, do you still have the Spicy Longganisa available? I would like to order two packs. Thank you.',
    read: false,
    urgent: false,
  },
  {
    id: 4,
    name: 'Carlo Mendoza',
    email: 'carlo.mendoza@example.com',
    time: 'Yesterday',
    subject: 'Payment confirmation',
    preview: 'I have completed the payment for my order. Please confirm if you received it.',
    body: 'I have completed the payment for my order. Please confirm if you received it. The payment reference is TIK-2025-0042.',
    read: true,
    urgent: false,
  },
  {
    id: 5,
    name: 'Sofia Garcia',
    email: 'sofia.garcia@example.com',
    time: 'Yesterday',
    subject: 'Thank you for the order',
    preview: 'The package arrived safely and everything tastes great. Thank you!',
    body: 'The package arrived safely and everything tastes great. Thank you for the excellent service.',
    read: true,
    urgent: false,
  },
])

const statistics = computed(() => {
  const total = messages.value.length
  const unread = messages.value.filter((message) => !message.read).length
  const urgent = messages.value.filter((message) => message.urgent).length
  const replied = messages.value.filter((message) => message.read).length

  return [
    { label: 'Total Messages', value: total, icon: 'mdi-message-outline', color: 'blue' },
    { label: 'Replied', value: replied, icon: 'mdi-check-circle-outline', color: 'green' },
    { label: 'Unread', value: unread, icon: 'mdi-clock-outline', color: 'orange' },
    { label: 'Urgent', value: urgent, icon: 'mdi-alert-outline', color: 'red' },
  ]
})

const tabs = computed(() => [
  { key: 'all' as MessageTab, label: 'All Messages', count: messages.value.length },
  { key: 'unread' as MessageTab, label: 'Unread', count: messages.value.filter((message) => !message.read).length },
  { key: 'urgent' as MessageTab, label: 'Urgent', count: messages.value.filter((message) => message.urgent).length },
])

const filteredMessages = computed(() => {
  const query = (props.search || '').trim().toLowerCase()

  return messages.value.filter((message) => {
    const matchesSearch = !query || [message.name, message.subject, message.preview]
      .some((value) => value.toLowerCase().includes(query))

    const matchesTab = activeTab.value === 'all'
      || (activeTab.value === 'unread' && !message.read)
      || (activeTab.value === 'urgent' && message.urgent)

    return matchesSearch && matchesTab
  })
})

function selectMessage(message: CustomerMessage) {
  selectedMessage.value = message
  message.read = true
}

function replyToMessage() {
  if (selectedMessage.value) {
    emit('notice', `Replying to ${selectedMessage.value.name}.`)
  }
}

function archiveMessage() {
  if (!selectedMessage.value) return

  const id = selectedMessage.value.id
  messages.value = messages.value.filter((message) => message.id !== id)
  selectedMessage.value = null
  emit('notice', 'Message archived.')
}
</script>

<style scoped>
.messages-page { padding: 40px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 28px; margin-bottom: 30px; }
.stat-card { display: flex; min-height: 148px; align-items: center; gap: 16px; padding: 24px 30px; border: 1px solid #e1e5ea; border-radius: 20px; background: white; }
.stat-icon { display: grid; width: 52px; height: 52px; place-items: center; border-radius: 16px; }
.stat-icon.blue { background: #dceaff; color: #2669df; }
.stat-icon.green { background: #d9f9e5; color: #00a94f; }
.stat-icon.orange { background: #fff0d7; color: #ee7900; }
.stat-icon.red { background: #fde0e3; color: #df1f2e; }
.stat-card p { margin: 0 0 10px; color: #556273; font-size: 16px; }
.stat-card strong { color: #111827; font-size: 38px; line-height: 1; }
.message-tabs { display: inline-flex; margin-bottom: 30px; padding: 4px; border: 1px solid #e0e4e9; border-radius: 17px; background: white; }
.message-tabs button { min-height: 48px; padding: 0 22px; border: 0; border-radius: 13px; background: transparent; color: #455064; cursor: pointer; font: inherit; font-size: 16px; font-weight: 600; }
.message-tabs button.active { background: #d72e40; box-shadow: 0 5px 12px rgba(215, 46, 64, .22); color: white; }
.messages-layout { display: grid; grid-template-columns: minmax(500px, 1.1fr) minmax(360px, .9fr); gap: 30px; }
.message-list { display: flex; flex-direction: column; gap: 16px; }
.message-card { padding: 25px 27px; border: 1px solid #e0e4e9; border-radius: 19px; background: white; cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease; }
.message-card:hover, .message-card.selected { border-color: #9bc3f2; box-shadow: 0 4px 15px rgba(39, 115, 208, .08); }
.message-card-top, .message-user, .message-labels { display: flex; align-items: center; }
.message-card-top { justify-content: space-between; }
.message-user { gap: 14px; }
.avatar { display: grid; width: 50px; height: 50px; place-items: center; border-radius: 50%; background: #d72e40; color: white; font-size: 20px; font-weight: 700; }
.avatar.large { width: 58px; height: 58px; }
.message-user h3 { margin: 0; color: #121b2a; font-size: 18px; }
.message-user p { margin: 4px 0 0; color: #8b96a6; font-size: 14px; }
.message-labels { gap: 10px; }
.unread-dot { width: 11px; height: 11px; border-radius: 50%; background: #3985df; }
.urgent-badge { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 9px; background: #fde3e5; color: #e01d2d; font-size: 13px; font-weight: 600; }
.message-card h4 { margin: 22px 0 8px; color: #142033; font-size: 19px; }
.message-preview { margin: 0; color: #586679; font-size: 16px; line-height: 1.5; }
.no-messages { padding: 40px 0; color: #7d899b; text-align: center; }
.message-details { min-height: 310px; border: 1px solid #e1e5ea; border-radius: 20px; background: white; }
.empty-details { display: grid; min-height: 310px; place-items: center; color: #7d899b; font-size: 18px; text-align: center; }
.empty-details-icon { display: grid; width: 80px; height: 80px; place-items: center; margin-bottom: 22px; border-radius: 50%; background: #f1f3f6; color: #9ba5b4; }
.empty-details p { margin: 0; }
.details-header { display: flex; align-items: center; justify-content: space-between; padding: 24px; border-bottom: 1px solid #e6e9ed; }
.close-details { display: grid; width: 36px; height: 36px; place-items: center; border: 0; border-radius: 50%; background: #f3f5f7; color: #6d7888; cursor: pointer; }
.details-content { padding: 28px 24px; }
.details-content h2 { margin: 18px 0 8px; color: #172033; font-size: 23px; }
.details-time { margin: 0; color: #8993a2; font-size: 14px; }
.full-message { margin: 26px 0; color: #536174; font-size: 16px; line-height: 1.7; }
.details-actions { display: flex; gap: 12px; }
.reply-button, .archive-button { display: flex; height: 44px; align-items: center; justify-content: center; gap: 8px; padding: 0 17px; border-radius: 10px; cursor: pointer; font: inherit; font-weight: 600; }
.reply-button { border: 0; background: #d72e40; color: white; }
.archive-button { border: 1px solid #d4dae1; background: white; color: #526074; }
@media (max-width: 1300px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 1050px) { .messages-layout { grid-template-columns: 1fr; } }
@media (max-width: 860px) { .messages-page { padding: 20px; } }
@media (max-width: 560px) { .messages-page { padding: 16px; } .stats-grid { grid-template-columns: 1fr; } .message-tabs { display: flex; width: 100%; } .message-tabs button { flex: 1; padding: 0 8px; font-size: 13px; } .message-card { padding: 20px; } .message-labels { flex-direction: column; align-items: flex-end; } }
</style>
