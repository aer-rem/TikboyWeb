<template>
  <section class="orders-page">
    <div class="order-toolbar">
      <button :class="{ selected: deliveredOnly }" @click="deliveredOnly = !deliveredOnly">
        <v-icon icon="mdi-filter-outline" />
        Filter
      </button>
      <button @click="showDate = true">
        <v-icon icon="mdi-calendar-blank-outline" />
        Date Range
      </button>
    </div>

    <v-progress-linear v-if="loading" color="primary" indeterminate />

    <div class="orders-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Address</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td>
              <strong>{{ order.orderNumber }}</strong>
              <small>{{ order.date }}</small>
            </td>
            <td>
              <div class="customer">
                <b>{{ order.initial }}</b>
                <div>
                  <strong>{{ order.customerName }}</strong>
                  <small>
                    <v-icon icon="mdi-account-outline" size="16" />
                    {{ order.email || 'No email' }}
                  </small>
                </div>
              </div>
            </td>
            <td>
              <ul class="items-list">
                <li v-for="item in order.items" :key="item.id">
                  {{ item.quantity }}× {{ item.name }}
                </li>
              </ul>
            </td>
            <td>
              <span class="address-text">{{ order.address }}</span>
            </td>
            <td class="amount">{{ order.total }}</td>
            <td>
              <span :class="['status', order.status]">
                <v-icon :icon="statusIcon(order.status)" size="16" />
                {{ order.status }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button aria-label="View order" title="View order" @click="openOrder(order)">
                  <v-icon icon="mdi-eye-outline" />
                </button>
                <button
                  v-if="order.status !== 'delivered'"
                  aria-label="Mark as delivered"
                  title="Mark as delivered"
                  @click="markDelivered(order)"
                >
                  <v-icon icon="mdi-check-circle-outline" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!loading && filteredOrders.length === 0">
            <td class="empty" colspan="7">No orders match your search.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <v-dialog v-model="showDate" max-width="420">
      <v-card class="date-dialog">
        <v-card-title>Date Range</v-card-title>
        <v-card-text>
          <v-text-field v-model="dateFrom" label="From" type="date" variant="outlined" />
          <v-text-field v-model="dateTo" label="To" type="date" variant="outlined" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="loading" @click="showDate = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="loading" @click="applyDate">Apply</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type OrderRow = {
  id: string
  total: number | string | null
  status: string | null
  address: string | null
  items?: unknown[] | null
  date_created: string | null
}

type OrderItem = {
  id: string
  name: string
  quantity: number
}

type Order = {
  id: string
  orderNumber: string
  date: string
  customerName: string
  email: string | null
  address: string
  items: OrderItem[]
  total: string
  status: string
  initial: string
}

const props = defineProps<{ search: string }>()
const emit = defineEmits<{ notice: [message: string] }>()

const orders = ref<Order[]>([])
const loading = ref(false)
const deliveredOnly = ref(false)
const showDate = ref(false)
const dateFrom = ref('')
const dateTo = ref('')

const filteredOrders = computed(() => {
  let list = orders.value

  if (deliveredOnly.value) {
    list = list.filter((o) => o.status === 'delivered')
  }

  if (dateFrom.value) {
    const from = new Date(dateFrom.value)
    list = list.filter((o) => new Date(o.date) >= from)
  }

  if (dateTo.value) {
    const to = new Date(dateTo.value)
    to.setHours(23, 59, 59, 999)
    list = list.filter((o) => new Date(o.date) <= to)
  }

  const q = props.search.toLowerCase().trim()
  if (q) {
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.items.some((it) => it.name.toLowerCase().includes(q)),
    )
  }

  return list
})

function formatCurrency(value: number | string | null) {
  const num = Number(value) || 0
  return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statusIcon(status: string) {
  return (
    {
      delivered: 'mdi-check-circle-outline',
      shipped: 'mdi-truck-outline',
      processing: 'mdi-clock-outline',
      pending: 'mdi-alert-outline',
    } as Record<string, string>
  )[status] ?? 'mdi-circle-outline'
}

function mapOrder(row: OrderRow): Order {
  const orderNumber = row.id.slice(0, 8).toUpperCase()
  const date = row.date_created ? new Date(row.date_created).toLocaleDateString() : ''
  const status = (row.status || 'pending').toLowerCase()
  const items = (Array.isArray(row.items) ? row.items : []) as OrderItem[]
  const customerName = items[0]?.name ? items[0].name.split(' ')[0] : 'Customer'
  const initial = customerName.charAt(0).toUpperCase()

  return {
    id: row.id,
    orderNumber,
    date,
    customerName,
    email: null,
    address: row.address || 'No address',
    items,
    total: formatCurrency(row.total),
    status,
    initial,
  }
}

async function loadOrders() {
  loading.value = true

  try {
    // Try without the jsonb 'items' column
    const { data, error } = await supabase
      .from('orders')
      .select('id, total, status, address, date_created')
      .order('date_created', { ascending: false })

    if (error) {
      console.error('Supabase orders error:', error)
      throw error
    }

    // Map with empty items for now
    orders.value = ((data || []) as OrderRow[]).map((row) =>
      mapOrder({ ...row, items: [] }),
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Could not load orders.'
    console.error('Load orders failed:', error)
    emit('notice', message)
  } finally {
    loading.value = false
  }
}

async function markDelivered(order: Order) {
  if (!confirm(`Mark order ${order.orderNumber} as delivered?`)) return

  loading.value = true

  try {
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', order.id)
    if (error) throw error

    const target = orders.value.find((o) => o.id === order.id)
    if (target) target.status = 'delivered'

    emit('notice', `Order ${order.orderNumber} marked as delivered.`)
  } catch (error: unknown) {
    emit('notice', error instanceof Error ? error.message : 'Could not update order status.')
  } finally {
    loading.value = false
  }
}

function openOrder(order: Order) {
  emit('notice', `Viewing order ${order.orderNumber}`)
}

function applyDate() {
  showDate.value = false
  emit('notice', 'Date range applied.')
}

onMounted(loadOrders)
</script>

<style scoped>
/* Page */
.orders-page {
  padding: 39px 34px;
}

/* Toolbar */
.order-toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
}

.order-toolbar button {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 45px;
  padding: 0 16px;
  border: 1px solid #d0d9e4;
  border-radius: 10px;
  background: #fff;
  color: #0a1830;
  font-weight: 700;
  cursor: pointer;
}

.order-toolbar .selected {
  border-color: #d42e40;
  color: #d42e40;
}

/* Table */
.orders-table-wrap {
  overflow-x: auto;
  border: 1px solid #dfe5ec;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 2px 3px rgba(11, 32, 62, 0.05);
}

table {
  width: 100%;
  min-width: 1120px;
  border-collapse: collapse;
}

th {
  height: 64px;
  padding: 0 15px;
  background: #fafbfc;
  color: #071b39;
  font-size: 16px;
  text-align: left;
}

th:first-child,
td:first-child {
  padding-left: 30px;
}

th:last-child,
td:last-child {
  padding-right: 30px;
}

td {
  padding: 25px 15px;
  border-top: 1px solid #e1e6ec;
  color: #263f5f;
  font-size: 16px;
  vertical-align: middle;
}

td > strong,
td > small {
  display: block;
}

td strong {
  color: #081d3d;
  font-size: 18px;
}

td small {
  margin-top: 5px;
  color: #62738d;
  font-size: 14px;
}

/* Customer cell */
.customer {
  display: flex;
  align-items: center;
  gap: 15px;
}

.customer > b {
  display: grid;
  place-items: center;
  width: 51px;
  height: 51px;
  border-radius: 50%;
  background: #df3043;
  color: #fff;
  font-size: 19px;
}

/* Items list */
.items-list {
  margin: 0;
  padding: 0 0 0 18px;
  color: #2f496b;
  font-size: 15px;
}

.items-list li {
  margin-bottom: 4px;
}

/* Address */
.address-text {
  display: block;
  max-width: 220px;
  color: #2f496b;
  font-size: 15px;
}

/* Amount */
.amount {
  color: #d52d40;
  font-size: 19px;
  font-weight: 800;
  white-space: nowrap;
}

/* Status badge */
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.delivered {
  background: #d9fae7;
  color: #009a48;
  border: 1px solid #a8efca;
}

.shipped {
  background: #e0edff;
  color: #1459df;
  border: 1px solid #c1dcff;
}

.processing {
  background: #fff7c9;
  color: #c68b00;
  border: 1px solid #f8df69;
}

.pending {
  background: #fff0d9;
  color: #df5b00;
  border: 1px solid #ffd19f;
}

/* Row actions */
.row-actions {
  display: flex;
  gap: 20px;
}

.row-actions button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #d0d9e4;
  border-radius: 10px;
  background: #fff;
  color: #4c5c72;
  cursor: pointer;
}

.row-actions button:hover {
  background: #f2f4f7;
}

/* Empty state */
.empty {
  padding: 40px;
  text-align: center;
  color: #62738d;
}

/* Dialog */
.date-dialog {
  border-radius: 16px;
}

/* Responsive */
@media (max-width: 860px) {
  .orders-page {
    padding: 25px 20px;
  }
}

@media (max-width: 540px) {
  .orders-page {
    padding: 18px 15px;
  }
}
</style>
