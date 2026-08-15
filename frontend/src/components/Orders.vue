<template>
  <section class="orders-page">
    <div class="order-toolbar">
      <button :class="{ selected: deliveredOnly }" @click="deliveredOnly = !deliveredOnly"><v-icon icon="mdi-filter-outline" /> Filter</button>
      <button @click="showDate = true"><v-icon icon="mdi-calendar-blank-outline" /> Date Range</button>
    </div>

    <div class="orders-table-wrap">
      <table>
        <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Tracking</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td><strong>{{ order.id }}</strong><small>{{ order.date }}</small></td>
            <td><div class="customer"><b>{{ order.initial }}</b><div><strong>{{ order.name }}</strong><small><v-icon icon="mdi-map-marker-outline" size="16" /> {{ order.location }}</small></div></div></td>
            <td>{{ order.product }}</td>
            <td><template v-if="order.tracking"><strong class="tracking"><v-icon icon="mdi-truck-outline" size="20" /> {{ order.tracking }}</strong><small>{{ order.courier }}</small><small>ETA: {{ order.eta }}</small></template><button v-else class="add-tracking" @click="notify('Add tracking for ' + order.id)">＋ Add Tracking</button></td>
            <td class="amount">{{ order.amount }}</td>
            <td><span :class="['status', order.status]"><v-icon :icon="statusIcon(order.status)" size="16" /> {{ order.status }}</span></td>
            <td><div class="row-actions"><button aria-label="Location" @click="notify('Opening delivery location')"><v-icon icon="mdi-map-marker-outline" /></button><button aria-label="Tracking" @click="notify('Opening shipment tracking')"><v-icon icon="mdi-truck-outline" /></button><button aria-label="View order" @click="notify('Viewing ' + order.id)"><v-icon icon="mdi-eye-outline" /></button></div></td>
          </tr>
          <tr v-if="!filteredOrders.length"><td class="empty" colspan="7">No orders match your search.</td></tr>
        </tbody>
      </table>
    </div>

    <v-dialog v-model="showDate" max-width="420"><v-card class="date-dialog"><v-card-title>Date Range</v-card-title><v-card-text><v-text-field label="From" type="date" variant="outlined" /><v-text-field label="To" type="date" variant="outlined" /></v-card-text><v-card-actions><v-spacer /><v-btn @click="showDate = false">Cancel</v-btn><v-btn color="primary" variant="flat" @click="applyDate">Apply</v-btn></v-card-actions></v-card></v-dialog>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  const props = defineProps<{ search: string }>()
  const emit = defineEmits<{ notice: [message: string] }>()
  const deliveredOnly = ref(false); const showDate = ref(false)
  const orders = [{ id: 'ORD-001', date: '2026-03-15', initial: 'M', name: 'Maria Santos', location: 'Manila', product: 'Classic Longganisa', tracking: 'JNT1234567890', courier: 'J&T Express', eta: '2026-03-16', amount: '₱450.00', status: 'delivered' }, { id: 'ORD-002', date: '2026-03-15', initial: 'J', name: 'Juan Dela Cruz', location: 'Quezon City', product: 'Spicy Longganisa', tracking: 'LBC9876543210', courier: 'LBC', eta: '2026-03-17', amount: '₱680.00', status: 'shipped' }, { id: 'ORD-003', date: '2026-03-16', initial: 'A', name: 'Ana Reyes', location: 'Makati', product: 'Garlic Longganisa', tracking: '', courier: '', eta: '', amount: '₱520.00', status: 'processing' }, { id: 'ORD-004', date: '2026-03-16', initial: 'P', name: 'Pedro Garcia', location: 'Pasig', product: 'Premium Combo', tracking: '', courier: '', eta: '', amount: '₱1,200.00', status: 'pending' }, { id: 'ORD-005', date: '2026-03-14', initial: 'R', name: 'Rosa Mendoza', location: 'Caloocan', product: 'Sweet Longganisa', tracking: 'NJV5551234567', courier: 'Ninja Van', eta: '2026-03-15', amount: '₱380.00', status: 'delivered' }]
  const filteredOrders = computed(() => orders.filter(order => (!deliveredOnly.value || order.status === 'delivered') && `${order.id} ${order.name} ${order.product}`.toLowerCase().includes(props.search.toLowerCase())))
  const statusIcon = (status: string) => ({ delivered: 'mdi-check-circle-outline', shipped: 'mdi-truck-outline', processing: 'mdi-clock-outline', pending: 'mdi-alert-outline' }[status] ?? 'mdi-circle-outline')
  const notify = (message: string) => emit('notice', message)
  const applyDate = () => { showDate.value = false; notify('Date range applied') }
</script>

<style scoped>
  .orders-page { padding:39px 34px; }.order-toolbar { display:flex; gap:16px; margin-bottom:30px; }.order-toolbar button { display:flex; align-items:center; gap:16px; height:45px; padding:0 16px; border:1px solid #d0d9e4; border-radius:10px; background:#fff; color:#0a1830; font-weight:700; }.order-toolbar .selected { border-color:#d42e40; color:#d42e40; }.orders-table-wrap { overflow-x:auto; border:1px solid #dfe5ec; border-radius:20px; background:#fff; box-shadow:0 2px 3px rgba(11,32,62,.05); } table { width:100%; min-width:1120px; border-collapse:collapse; } th { height:64px; background:#fafbfc; color:#071b39; font-size:16px; text-align:left; } th:first-child,td:first-child { padding-left:30px; } th:last-child,td:last-child { padding-right:30px; } td { padding:25px 15px; border-top:1px solid #e1e6ec; color:#263f5f; font-size:16px; vertical-align:middle; } td > strong, td > small { display:block; } td strong { color:#081d3d; font-size:18px; } td small { margin-top:5px; color:#62738d; font-size:14px; }.customer { display:flex; align-items:center; gap:15px; }.customer > b { display:grid; place-items:center; width:51px; height:51px; border-radius:50%; background:#df3043; color:white; font-size:19px; }.customer small { display:flex; align-items:center; gap:3px; }.tracking { display:flex; align-items:center; gap:9px; color:#dd2d40; font-size:16px; }.tracking :deep(.v-icon) { color:#df3043; }.amount { color:#d52d40; font-size:19px; font-weight:800; white-space:nowrap; }.status { display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:10px; font-size:14px; }.delivered { background:#d9fae7; color:#009a48; border:1px solid #a8efca; }.shipped { background:#e0edff; color:#1459df; border:1px solid #c1dcff; }.processing { background:#fff7c9; color:#c68b00; border:1px solid #f8df69; }.pending { background:#fff0d9; color:#df5b00; border:1px solid #ffd19f; }.add-tracking { border:0; background:transparent; color:#90a0b6; font-size:16px; font-weight:600; }.row-actions { display:flex; gap:20px; }.row-actions button { border:0; background:transparent; color:#4c5c72; }.empty { padding:40px; text-align:center; }.date-dialog { border-radius:16px; }@media(max-width:860px){.orders-page{padding:25px 20px}}@media(max-width:540px){.orders-page{padding:18px 15px}}
</style>
