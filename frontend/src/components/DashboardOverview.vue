<template>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-placeholder">T</div>
        <div>
          <strong>TIKBOY</strong>
          <span>Admin Dashboard</span>
        </div>
      </div>

      <nav aria-label="Dashboard navigation">
        <button
          v-for="item in navigation"
          :key="item.label"
          :class="{ active: activeNav === item.label }"
          type="button"
          @click="activeNav = item.label"
        >
          <v-icon :icon="item.icon" size="25" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-bottom">
        <div class="target">
          <span>Monthly Target</span>
          <strong>{{ formatCurrency(MONTHLY_TARGET) }}</strong>
          <em>{{ monthlyTargetPercent }}%</em>
          <div><i :style="{ width: `${monthlyTargetPercent}%` }" /></div>
        </div>

        <button class="logout" type="button" @click="emit('logout')">
          <v-icon icon="mdi-logout" />
          Log Out
        </button>
      </div>
    </aside>

    <main class="content">
      <header class="topbar">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ todayLabel }}</p>
        </div>

        <div class="top-actions">
          <label class="search">
            <v-icon icon="mdi-magnify" />
            <input v-model="search" placeholder="Search..." />
          </label>

          <button aria-label="Notifications" class="icon-button" type="button" @click="notify('No new notifications')">
            <v-icon icon="mdi-bell-outline" size="28" />
          </button>

          <button class="outline-button" type="button" :disabled="exporting" @click="exportOverview">
            <v-icon icon="mdi-download" />
            {{ exporting ? 'Exporting...' : 'Export' }}
          </button>

          <button class="outline-button" type="button" @click="showDateFilter = true">
            {{ rangeButtonLabel }}
            <v-icon icon="mdi-chevron-down" />
          </button>
        </div>
      </header>

      <Orders v-if="activeNav === 'Orders'" :search="search" @notice="notify" />
      <Customers v-else-if="activeNav === 'Customers'" :search="search" @notice="notify" />
      <Analytics v-else-if="activeNav === 'Analytics'" />
      <Inventory v-else-if="activeNav === 'Inventory'" @notice="notify" />
      <Reports v-else-if="activeNav === 'Reports'" @notice="notify" />
      <Messages v-else-if="activeNav === 'Messages'" :search="search" @notice="notify" />
      <Settings v-else-if="activeNav === 'Settings'" @notice="notify" />

      <section v-else class="page-body">
        <v-alert v-if="loadError" type="error" variant="tonal" class="load-error">
          {{ loadError }}
          <template #append>
            <v-btn size="small" variant="text" @click="loadDashboard">Retry</v-btn>
          </template>
        </v-alert>

        <div class="quick-actions">
          <button type="button" @click="activeNav = 'Inventory'">
            <span class="pink"><v-icon icon="mdi-plus" /></span>
            Add Product
          </button>
          <button type="button" @click="activeNav = 'Orders'">
            <span class="blue"><v-icon icon="mdi-cart-outline" /></span>
            View Orders
          </button>
          <button type="button" @click="activeNav = 'Customers'">
            <span class="purple"><v-icon icon="mdi-account-group-outline" /></span>
            Customers
          </button>
          <button type="button" @click="exportOverview">
            <span class="green"><v-icon icon="mdi-download" /></span>
            Export Data
          </button>
          <button type="button" @click="activeNav = 'Reports'">
            <span class="orange"><v-icon icon="mdi-chart-bar" /></span>
            View Reports
          </button>
        </div>

        <v-progress-linear v-if="loading" color="primary" indeterminate class="dashboard-loader" />

        <div class="stat-grid">
          <article v-for="stat in stats" :key="stat.label" class="stat-card">
            <div :class="['stat-icon', stat.color]"><v-icon :icon="stat.icon" /></div>
            <p>{{ stat.label }}</p>
            <strong>{{ stat.value }}</strong>
            <small>{{ stat.help }}</small>
          </article>
        </div>

        <div class="chart-grid">
          <article class="panel revenue-panel">
            <div class="panel-heading">
              <h2>Revenue Trend</h2>
              <span class="panel-subtitle">Completed orders only</span>
            </div>
            <div v-if="revenuePoints.length" class="revenue-chart-wrap">
              <div class="chart-y-labels">
                <span>{{ formatCompactCurrency(chartMax) }}</span>
                <span>{{ formatCompactCurrency(chartMax * 0.75) }}</span>
                <span>{{ formatCompactCurrency(chartMax * 0.5) }}</span>
                <span>{{ formatCompactCurrency(chartMax * 0.25) }}</span>
                <span>₱0</span>
              </div>
              <svg class="revenue-chart" viewBox="0 0 900 280" preserveAspectRatio="none" role="img" aria-label="Revenue trend chart">
                <defs>
                  <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop stop-color="#e63749" stop-opacity=".31" />
                    <stop offset="1" stop-color="#e63749" stop-opacity=".01" />
                  </linearGradient>
                </defs>
                <path :d="chartAreaPath" fill="url(#revenue-fill)" />
                <path :d="chartLinePath" fill="none" stroke="#d1283a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                <circle v-for="point in chartCoordinates" :key="point.label" :cx="point.x" :cy="point.y" r="4" fill="#d1283a" />
              </svg>
            </div>
            <div v-else class="empty-chart">No completed-order revenue exists in the selected period.</div>
            <div class="chart-labels">
              <span v-for="point in revenuePoints" :key="point.label">{{ point.label }}</span>
            </div>
          </article>

          <article class="panel categories">
            <h2>Order Status</h2>
            <div class="donut" :style="{ background: statusGradient }" />
            <ul>
              <li v-for="status in statusSummary" :key="status.name">
                <i :style="{ background: status.color }" />
                {{ status.label }}
                <strong>{{ status.count }}</strong>
              </li>
            </ul>
          </article>
        </div>

        <div class="lower-grid">
          <article class="panel orders-panel">
            <div class="panel-heading">
              <h2>Recent Orders</h2>
              <button type="button" @click="activeNav = 'Orders'">View All</button>
            </div>

            <div v-if="recentOrders.length === 0" class="empty-panel">No orders found for the selected period.</div>
            <div v-for="order in filteredRecentOrders" :key="order.id" class="order">
              <span class="order-icon"><v-icon icon="mdi-cart-outline" /></span>
              <div>
                <strong>{{ order.orderNumber }}</strong>
                <small>{{ order.productSummary }}</small>
              </div>
              <div>
                <strong>{{ formatCurrency(order.total ?? 0) }}</strong>
                <em :class="order.status">{{ order.status }}</em>
              </div>
            </div>
          </article>

          <article class="panel top-products-panel">
            <h2>Top Products</h2>
            <div v-if="topProducts.length === 0" class="empty-panel">
              No product quantities found in completed orders.
            </div>
            <div v-for="product in topProducts" :key="product.name" class="top-product">
              <b>{{ product.rank }}</b>
              <div>
                <strong>{{ product.name }}</strong>
                <small>{{ product.quantity }} sold</small>
              </div>
              <em>{{ formatCurrency(product.revenue) }}</em>
            </div>
          </article>
        </div>
      </section>
    </main>

    <v-dialog v-model="showDateFilter" max-width="460">
      <v-card class="date-dialog">
        <v-card-title>Dashboard Period</v-card-title>
        <v-card-text>
          <v-select
            v-model="selectedMonth"
            :items="monthOptions"
            item-title="title"
            item-value="value"
            label="Month"
            variant="outlined"
            clearable
            @update:model-value="onMonthChange"
          />
          <p class="date-help">Choose a month or set a custom date range below. A custom range overrides the month.</p>
          <v-text-field v-model="customFrom" label="From" type="date" variant="outlined" />
          <v-text-field v-model="customTo" label="To" type="date" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" @click="clearDateFilter">Clear</v-btn>
          <v-spacer />
          <v-btn @click="showDateFilter = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="applyDateFilter">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" color="primary" location="top right">
      {{ notice }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import Analytics from '@/components/Analytics.vue'
import Customers from '@/components/Customers.vue'
import Inventory from '@/components/Inventory.vue'
import Messages from '@/components/Messages.vue'
import Orders from '@/components/Orders.vue'
import Reports from '@/components/Reports.vue'
import Settings from '@/components/Settings.vue'

type OrderItem = {
  product_name?: unknown
  quantity?: unknown
  price?: unknown
}

type DatabaseOrder = {
  id: string
  total: number | string | null
  status: string | null
  address: string | null
  date_created: string | null
}

type DashboardOrder = DatabaseOrder & {
  items: OrderItem[]
}

const emit = defineEmits<{ logout: [] }>()

const MONTHLY_TARGET = 300000
const COMPLETED_STATUSES = new Set(['shipped', 'delivered'])

const activeNav = ref('Overview')
const search = ref('')
const snackbar = ref(false)
const notice = ref('')
const loading = ref(false)
const exporting = ref(false)
const loadError = ref('')
const showDateFilter = ref(false)
const selectedMonth = ref<string | null>(currentMonthValue())
const customFrom = ref('')
const customTo = ref('')
const appliedFrom = ref('')
const appliedTo = ref('')
const orders = ref<DashboardOrder[]>([])
const productCount = ref(0)

const navigation = [
  { label: 'Overview', icon: 'mdi-home-outline' },
  { label: 'Orders', icon: 'mdi-cart-outline' },
  { label: 'Customers', icon: 'mdi-account-group-outline' },
  { label: 'Analytics', icon: 'mdi-chart-bar' },
  { label: 'Inventory', icon: 'mdi-view-grid-outline' },
  { label: 'Reports', icon: 'mdi-file-document-outline' },
  { label: 'Messages', icon: 'mdi-message-outline' },
  { label: 'Settings', icon: 'mdi-cog-outline' },
]

const monthOptions = computed(() => {
  const options: { title: string; value: string }[] = []
  const now = new Date()
  for (let offset = 0; offset < 24; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    options.push({
      title: date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
    })
  }
  return options
})

const todayLabel = computed(() => new Date().toLocaleDateString(undefined, {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
}))

const rangeButtonLabel = computed(() => {
  if (appliedFrom.value || appliedTo.value) return 'Custom range'
  const option = monthOptions.value.find((month) => month.value === selectedMonth.value)
  return option?.title || 'Select period'
})

const filteredOrders = computed(() => orders.value.filter(isInsideAppliedRange))
const completedOrders = computed(() => filteredOrders.value.filter((order) => isCompleted(order.status)))

const totalRevenue = computed(() => completedOrders.value.reduce((sum, order) => sum + toNumber(order.total), 0))
const totalOrders = computed(() => filteredOrders.value.length)
const averageOrderValue = computed(() => completedOrders.value.length ? totalRevenue.value / completedOrders.value.length : 0)
const monthlyTargetPercent = computed(() => Math.min(100, Math.round((totalRevenue.value / MONTHLY_TARGET) * 100)))

const stats = computed(() => [
  { label: 'Completed Revenue', value: formatCurrency(totalRevenue.value), icon: 'mdi-cash-multiple', color: 'green', help: `${completedOrders.value.length} shipped or delivered orders` },
  { label: 'Total Orders', value: String(totalOrders.value), icon: 'mdi-cart-outline', color: 'blue', help: 'All order statuses in selected period' },
  { label: 'Products', value: String(productCount.value), icon: 'mdi-package-variant-closed', color: 'purple', help: 'Product rows in inventory' },
  { label: 'Avg Order Value', value: formatCurrency(averageOrderValue.value), icon: 'mdi-chart-line', color: 'orange', help: 'Completed orders only' },
])

const statusSummary = computed(() => {
  const meta: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: '#f49a1f' },
    processing: { label: 'Processing', color: '#8d52e8' },
    shipped: { label: 'Shipped', color: '#2876dc' },
    delivered: { label: 'Delivered', color: '#20a65a' },
  }
  const counts = new Map<string, number>()
  for (const order of filteredOrders.value) {
    const key = normalizeStatus(order.status)
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return Array.from(counts.entries()).map(([name, count]) => ({
    name,
    label: meta[name]?.label || capitalize(name),
    color: meta[name]?.color || '#7b8798',
    count,
  }))
})

const statusGradient = computed(() => {
  const total = statusSummary.value.reduce((sum, status) => sum + status.count, 0)
  if (!total) return '#edf0f4'
  let start = 0
  const parts = statusSummary.value.map((status) => {
    const end = start + (status.count / total) * 100
    const segment = `${status.color} ${start}% ${end}%`
    start = end
    return segment
  })
  return `conic-gradient(${parts.join(', ')})`
})

const revenuePoints = computed(() => {
  const days = new Map<string, number>()
  for (const order of completedOrders.value) {
    if (!order.date_created) continue
    const date = new Date(order.date_created)
    if (Number.isNaN(date.getTime())) continue
    const key = date.toISOString().slice(0, 10)
    days.set(key, (days.get(key) || 0) + toNumber(order.total))
  }
  return Array.from(days.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      label: new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      total,
    }))
})

const chartMax = computed(() => Math.max(1, ...revenuePoints.value.map((point) => point.total)))
const chartCoordinates = computed(() => {
  const points = revenuePoints.value
  if (!points.length) return []
  const width = 900
  const height = 280
  return points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: height - (point.total / chartMax.value) * (height - 12) - 6,
  }))
})
const chartLinePath = computed(() => chartCoordinates.value.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' '))
const chartAreaPath = computed(() => {
  const points = chartCoordinates.value
  if (!points.length) return ''
  return `${chartLinePath.value} L ${points[points.length - 1].x} 280 L ${points[0].x} 280 Z`
})

const recentOrders = computed(() => [...filteredOrders.value]
  .sort((a, b) => new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime())
  .slice(0, 5)
  .map((order) => ({
    ...order,
    orderNumber: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
    productSummary: order.items.length
      ? order.items.map((item) => `${itemQuantity(item)}× ${itemName(item)}`).join(', ')
      : 'No item details available',
  })))

const filteredRecentOrders = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return recentOrders.value
  return recentOrders.value.filter((order) =>
    `${order.orderNumber} ${order.productSummary}`.toLowerCase().includes(query),
  )
})

const topProducts = computed(() => {
  const totals = new Map<string, { quantity: number; revenue: number }>()
  for (const order of completedOrders.value) {
    for (const item of order.items) {
      const name = itemName(item)
      if (!name) continue
      const quantity = itemQuantity(item)
      const itemRevenue = toNumber(item.price) * quantity
      const current = totals.get(name) || { quantity: 0, revenue: 0 }
      current.quantity += quantity
      current.revenue += itemRevenue
      totals.set(name, current)
    }
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 5)
    .map((product, index) => ({ ...product, rank: index + 1 }))
})

const pageTitle = computed(() => ({
  Orders: 'Order Management',
  Customers: 'Customer Management',
  Analytics: 'Sales Analytics',
  Inventory: 'Inventory Management',
  Reports: 'Business Reports',
  Messages: 'Customer Messages',
  Settings: 'Settings & Security',
} as Record<string, string>)[activeNav.value] ?? 'Dashboard Overview')

function currentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function normalizeStatus(value: string | null) {
  return (value || 'pending').trim().toLowerCase()
}

function isCompleted(status: string | null) {
  return COMPLETED_STATUSES.has(normalizeStatus(status))
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Pending'
}

function itemName(item: OrderItem) {
  return typeof item.product_name === 'string' && item.product_name.trim() ? item.product_name.trim() : 'Unnamed product'
}

function itemQuantity(item: OrderItem) {
  const quantity = Math.floor(toNumber(item.quantity))
  return quantity > 0 ? quantity : 1
}

function parseItems(value: unknown): OrderItem[] {
  if (Array.isArray(value)) return value as OrderItem[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed as OrderItem[] : []
    } catch {
      return []
    }
  }
  return []
}

function formatCurrency(value: unknown) {
  const amount = Number(value)

  return `₱${(Number.isFinite(amount) ? amount : 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatCompactCurrency(value: number) {
  if (value >= 1000000) return `₱${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₱${(value / 1000).toFixed(0)}K`
  return formatCurrency(value)
}

function dateOnly(value: string) {
  return value.slice(0, 10)
}

function isInsideAppliedRange(order: DashboardOrder) {
  if (!order.date_created) return !appliedFrom.value && !appliedTo.value
  const date = dateOnly(order.date_created)
  if (appliedFrom.value && date < appliedFrom.value) return false
  if (appliedTo.value && date > appliedTo.value) return false
  return true
}

function setMonthRange(month: string | null) {
  if (!month) {
    appliedFrom.value = ''
    appliedTo.value = ''
    return
  }
  const [year, monthNumber] = month.split('-').map(Number)
  const start = new Date(year, monthNumber - 1, 1)
  const end = new Date(year, monthNumber, 0)
  appliedFrom.value = start.toISOString().slice(0, 10)
  appliedTo.value = end.toISOString().slice(0, 10)
}

function onMonthChange() {
  customFrom.value = ''
  customTo.value = ''
}

function applyDateFilter() {
  if (customFrom.value || customTo.value) {
    appliedFrom.value = customFrom.value
    appliedTo.value = customTo.value
  } else {
    setMonthRange(selectedMonth.value)
  }
  showDateFilter.value = false
}

function clearDateFilter() {
  selectedMonth.value = null
  customFrom.value = ''
  customTo.value = ''
  appliedFrom.value = ''
  appliedTo.value = ''
  showDateFilter.value = false
}

async function loadDashboard() {
  loading.value = true
  loadError.value = ''
  try {
    // The Orders page showed that selecting `items` can currently cause a 400.
    // Load the safe columns first, then attempt items separately.
    const { data: baseData, error: baseError } = await supabase
      .from('orders')
      .select('id, total, status, address, date_created')
      .order('date_created', { ascending: false })

    if (baseError) throw baseError

    let itemsById = new Map<string, OrderItem[]>()
    const { data: itemData, error: itemError } = await supabase
      .from('orders')
      .select('id, items')

    if (!itemError) {
      for (const row of itemData || []) {
        itemsById.set(row.id, parseItems(row.items))
      }
    } else {
      console.warn('Could not load order items for dashboard:', itemError)
    }

    orders.value = ((baseData || []) as DatabaseOrder[]).map((order) => ({
      ...order,
      items: itemsById.get(order.id) || [],
    }))

    const { count, error: productError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })

    if (productError) throw productError
    productCount.value = count || 0
  } catch (error: unknown) {
    console.error('Dashboard load failed:', error)
    loadError.value = error instanceof Error ? error.message : 'Could not load dashboard data.'
  } finally {
    loading.value = false
  }
}

function csvEscape(value: unknown) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

async function exportOverview() {
  exporting.value = true
  try {
    const rows = [
      ['Order ID', 'Date', 'Status', 'Total', 'Address'],
      ...filteredOrders.value.map((order) => [
        `ORD-${order.id.slice(0, 8).toUpperCase()}`,
        order.date_created || '',
        normalizeStatus(order.status),
        toNumber(order.total).toFixed(2),
        order.address || '',
      ]),
    ]
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tikboy-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    notify('Dashboard data exported.')
  } finally {
    exporting.value = false
  }
}

function notify(message: string) {
  notice.value = message
  snackbar.value = true
}

setMonthRange(selectedMonth.value)
onMounted(loadDashboard)
</script>

<style scoped>
.dashboard { display:flex; min-height:100vh; background:#f8f9fb; color:#081d3d; font-family:Roboto,sans-serif; }
button { cursor:pointer; font:inherit; }
button:disabled { cursor:not-allowed; opacity:.65; }
.sidebar { position:sticky; top:0; display:flex; flex:0 0 320px; flex-direction:column; width:320px; height:100vh; overflow:hidden; border-right:1px solid #e4e7ec; background:#fff; }
.brand { display:flex; align-items:center; gap:14px; height:125px; padding:24px; border-bottom:1px solid #eef0f3; }
.brand-placeholder { display:grid; width:64px; height:64px; place-items:center; border:1px solid #e4e7ec; border-radius:14px; color:#d1283a; font-size:30px; font-weight:900; }
.brand strong { display:block; font-size:26px; letter-spacing:.4px; }
.brand span { color:#68758b; font-size:14px; }
nav { flex:1; overflow-y:auto; padding:20px 16px; scrollbar-color:#c4cad3 transparent; }
nav button,.logout { display:flex; align-items:center; gap:15px; width:100%; min-height:52px; padding:0 18px; border:0; border-radius:13px; background:transparent; color:#44536a; font-size:16px; font-weight:600; text-align:left; }
nav button + button { margin-top:5px; }
nav button:hover,.logout:hover { background:#f4f6f9; }
nav button.active { background:linear-gradient(135deg,#ea3b4b,#d8273a); box-shadow:0 10px 18px rgba(209,40,58,.2); color:#fff; }
.sidebar-bottom { padding:18px; border-top:1px solid #eef0f3; background:#fff; }
.target { position:relative; padding:15px; border-radius:15px; background:linear-gradient(135deg,#fff1f2,#fde5e8); color:#59677c; }
.target span,.target strong { display:block; }
.target strong { margin-top:6px; color:#112746; font-size:17px; }
.target em { position:absolute; top:42px; right:15px; color:#d1283a; font-style:normal; }
.target div { height:8px; margin-top:12px; overflow:hidden; border-radius:10px; background:#dfe6ee; }
.target i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#db2b3e,#ee4b59); }
.logout { margin-top:14px; }
.content { min-width:0; flex:1; }
.topbar { display:flex; align-items:center; justify-content:space-between; min-height:105px; padding:18px 34px; border-bottom:1px solid #dfe3e8; background:#fff; box-shadow:0 2px 3px rgba(0,0,0,.06); }
h1,h2 { margin:0; font-weight:800; }
h1 { font-size:29px; }
h2 { font-size:23px; }
.topbar p { margin:6px 0 0; color:#6d798d; font-size:15px; }
.top-actions { display:flex; align-items:center; gap:14px; }
.search { display:flex; align-items:center; gap:10px; width:260px; height:48px; padding:0 14px; border:1px solid #d2d8e1; border-radius:12px; color:#8a96a8; }
.search input { width:100%; border:0; outline:0; color:#243855; font:inherit; }
.icon-button { border:0; background:transparent; color:#3c4b62; }
.outline-button { display:flex; align-items:center; gap:8px; height:46px; padding:0 14px; border:1px solid #d3d9e2; border-radius:11px; background:#fff; color:#111; font-weight:600; }
.outline-button:hover { background:#f8f9fb; }
.page-body { padding:34px; }
.load-error { margin-bottom:20px; }
.quick-actions { display:grid; grid-template-columns:repeat(5,minmax(150px,1fr)); gap:16px; }
.quick-actions button { display:flex; align-items:center; gap:13px; min-height:82px; padding:16px; border:1px solid #dfe4eb; border-radius:17px; background:#fff; color:#071d3d; font-size:15px; font-weight:700; text-align:left; }
.quick-actions button:hover { border-color:#cbd3de; background:#fafbfc; }
.quick-actions span,.stat-icon { display:grid; width:46px; height:46px; place-items:center; border-radius:12px; flex:0 0 auto; }
.pink { background:#fde9ed; color:#df3347; }.blue { background:#e0ecff; color:#1263ed; }.purple { background:#f0e3ff; color:#9829ff; }.green { background:#d9fbe7; color:#00ac4e; }.orange { background:#ffecd2; color:#ff5317; }
.dashboard-loader { margin:24px 0 0; }
.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:22px; margin-top:28px; }
.stat-card,.panel { border:1px solid #e0e5ec; border-radius:20px; background:#fff; box-shadow:0 2px 3px rgba(11,32,62,.04); }
.stat-card { min-height:190px; padding:26px; }
.stat-card p { margin:20px 0 8px; color:#355173; font-size:15px; }.stat-card strong { display:block; font-size:29px; letter-spacing:.3px; }.stat-card small { display:block; margin-top:9px; color:#718096; font-size:12px; }
.chart-grid,.lower-grid { display:grid; grid-template-columns:2fr 1fr; gap:22px; margin-top:26px; }.lower-grid { grid-template-columns:1fr 1fr; }
.panel { padding:28px 25px; }.revenue-panel,.categories { min-height:390px; }
.panel-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:22px; }.panel-heading button { border:0; background:transparent; color:#df263a; font-weight:600; }.panel-subtitle { color:#718096; font-size:13px; }
.revenue-chart-wrap { display:grid; grid-template-columns:70px 1fr; height:275px; }.chart-y-labels { display:flex; flex-direction:column; justify-content:space-between; padding:0 10px 0 0; color:#6d798d; font-size:12px; text-align:right; }.revenue-chart { width:100%; height:100%; border-left:2px solid #8d9ab0; background:repeating-linear-gradient(to bottom,transparent 0,transparent 67px,#e6e9ed 68px,transparent 69px); }.chart-labels { display:flex; justify-content:space-between; gap:8px; margin:10px 0 0 70px; overflow:hidden; color:#6d798d; font-size:12px; }.chart-labels span { flex:1; min-width:max-content; text-align:center; }.empty-chart,.empty-panel { display:grid; min-height:230px; place-items:center; color:#718096; text-align:center; }.empty-panel { min-height:150px; }
.donut { width:175px; aspect-ratio:1; margin:35px auto 22px; border-radius:50%; mask:radial-gradient(transparent 0 53%,#000 54%); }.categories ul { margin:0; padding:0; list-style:none; }.categories li { display:flex; align-items:center; gap:10px; margin:12px 0; color:#263f5e; font-size:14px; }.categories li i { width:13px; height:13px; border-radius:50%; }.categories li strong { margin-left:auto; color:#0a213f; }
.order { display:grid; grid-template-columns:46px 1fr auto; align-items:center; gap:13px; padding:14px 10px; border-radius:14px; }.order:nth-of-type(odd) { background:#fafbfc; }.order-icon { display:grid; width:46px; height:46px; place-items:center; border-radius:11px; background:#fde9ed; color:#e53347; }.order strong,.top-product strong { display:block; }.order small,.top-product small { display:block; margin-top:4px; color:#60708a; font-size:13px; }.order > div:last-child { text-align:right; }.order em { display:inline-block; margin-top:7px; padding:4px 9px; border-radius:9px; font-size:12px; font-style:normal; }.delivered { background:#d9fbe7; color:#009848; }.shipped { background:#e2edff; color:#1458de; }.processing { background:#fff7c9; color:#b47b00; }.pending { background:#fff0d9; color:#d86500; }
.top-products-panel h2 { margin-bottom:18px; }.top-product { display:grid; grid-template-columns:42px 1fr auto; align-items:center; gap:12px; padding:10px 0; }.top-product > b { display:grid; width:36px; height:36px; place-items:center; border-radius:11px; background:#df3144; color:#fff; }.top-product em { color:#d9283d; font-size:16px; font-style:normal; font-weight:700; text-align:right; }.date-dialog { border-radius:16px; }.date-help { margin:-4px 0 18px; color:#6d798d; font-size:13px; }
@media(max-width:1300px){.sidebar{flex-basis:265px;width:265px}.quick-actions{grid-template-columns:repeat(3,1fr)}.stat-grid{grid-template-columns:repeat(2,1fr)}.search{width:200px}.topbar{padding:18px 25px}.page-body{padding:26px}}
@media(max-width:960px){.chart-grid,.lower-grid{grid-template-columns:1fr}.top-actions{flex-wrap:wrap;justify-content:flex-end}.search{width:180px}}
@media(max-width:860px){.dashboard{display:block}.sidebar{position:static;width:100%;height:auto}.brand{height:94px;padding:16px}.brand-placeholder{width:55px;height:55px}.sidebar nav{display:flex;gap:5px;overflow:auto;padding:10px}.sidebar nav button{width:auto;min-width:max-content;min-height:43px;padding:0 12px;font-size:14px}.sidebar-bottom{display:none}.topbar{flex-direction:column;align-items:flex-start;gap:16px;height:auto;padding:22px}.top-actions{width:100%;justify-content:flex-start}.search{flex:1;width:auto}.page-body{padding:20px}.quick-actions{grid-template-columns:1fr 1fr}.chart-labels span:nth-child(even){display:none}}
@media(max-width:540px){h1{font-size:24px}.top-actions .outline-button:last-child{display:none}.quick-actions,.stat-grid{grid-template-columns:1fr}.search{width:auto}.panel{padding:22px 16px}.top-product{grid-template-columns:38px 1fr}.top-product em{grid-column:2;text-align:left}.chart-y-labels{font-size:10px}.revenue-chart-wrap{grid-template-columns:52px 1fr}.chart-labels{margin-left:52px;font-size:10px}.order{padding:12px 0}.order-icon{width:40px;height:40px}}
</style>
