<template>
  <section class="customers-page">
    <div class="customer-stats">
      <article v-for="stat in stats" :key="stat.label"><p>{{ stat.label }}</p><strong>{{ stat.value }}</strong><small :class="stat.positive ? 'positive' : ''">{{ stat.note }}</small></article>
    </div>
    <article class="customer-panel">
      <h2>Customer List</h2>
      <div class="table-wrap"><table><thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        <tr v-for="customer in filteredCustomers" :key="customer.email"><td><div class="customer-name"><b>{{ customer.initial }}</b><div><strong>{{ customer.name }}</strong><small>Joined {{ customer.joined }}</small></div></div></td><td>{{ customer.email }}</td><td class="orders">{{ customer.orders }}</td><td class="spent">{{ customer.spent }}</td><td><span :class="['status', customer.status.toLowerCase()]">{{ customer.status }}</span></td><td><div class="actions"><button aria-label="View customer" @click="notice('Viewing ' + customer.name)"><v-icon icon="mdi-eye-outline" /></button><button aria-label="Message customer" @click="notice('Opening chat with ' + customer.name)"><v-icon icon="mdi-message-outline" /></button></div></td></tr>
        <tr v-if="!filteredCustomers.length"><td class="empty" colspan="6">No customers match your search.</td></tr>
      </tbody></table></div>
    </article>
  </section>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  const props = defineProps<{ search: string }>()
  const emit = defineEmits<{ notice: [message: string] }>()
  const stats = [{ label: 'Total Customers', value: '720', note: '+12% this month', positive: true }, { label: 'VIP Customers', value: '48', note: '6.7% of total' }, { label: 'Avg. Lifetime Value', value: '₱4,250', note: 'Per customer' }, { label: 'Retention Rate', value: '87%', note: '+5% from last month', positive: true }]
  const customers = [{ initial: 'M', name: 'Maria Santos', joined: 'Jan 2026', email: 'maria@example.com', orders: 12, spent: '₱5,400.00', status: 'VIP' }, { initial: 'J', name: 'Juan Dela Cruz', joined: 'Feb 2026', email: 'juan@example.com', orders: 8, spent: '₱3,200.00', status: 'Regular' }, { initial: 'A', name: 'Ana Reyes', joined: 'Dec 2025', email: 'ana@example.com', orders: 15, spent: '₱6,800.00', status: 'VIP' }, { initial: 'P', name: 'Pedro Garcia', joined: 'Mar 2026', email: 'pedro@example.com', orders: 5, spent: '₱2,100.00', status: 'New' }]
  const filteredCustomers = computed(() => customers.filter(customer => `${customer.name} ${customer.email} ${customer.status}`.toLowerCase().includes(props.search.toLowerCase())))
  const notice = (message: string) => emit('notice', message)
</script>

<style scoped>
  .customers-page { padding:39px 40px; }.customer-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:30px; margin-bottom:39px; }.customer-stats article { min-height:166px; padding:31px; border:1px solid #e0e5ec; border-radius:20px; background:white; }.customer-stats p { margin:0; color:#355173; font-size:17px; }.customer-stats strong,.customer-stats small { display:block; }.customer-stats strong { margin:11px 0 11px; color:#061c3c; font-size:38px; letter-spacing:.5px; }.customer-stats small { color:#64728a; font-size:14px; }.customer-stats .positive { color:#00a64b; }.customer-panel { overflow:hidden; border:1px solid #e0e5ec; border-radius:20px; background:white; box-shadow:0 2px 3px rgba(11,32,62,.05); }.customer-panel h2 { margin:0; padding:34px 30px; color:#071d3c; font-size:25px; }.table-wrap { overflow-x:auto; }table { width:100%; min-width:1000px; border-collapse:collapse; }th { height:64px; background:#fafbfc; color:#071b39; font-size:16px; text-align:left; }th:first-child,td:first-child { padding-left:30px; }th:last-child,td:last-child { padding-right:30px; }td { padding:20px 15px; border-top:1px solid #e1e6ec; color:#2f496b; font-size:16px; }td strong,td small { display:block; }.customer-name { display:flex; align-items:center; gap:15px; }.customer-name > b { display:grid; place-items:center; width:51px; height:51px; border-radius:50%; background:#df3043; color:white; font-size:19px; }.customer-name strong { color:#071d3c; font-size:19px; }.customer-name small { margin-top:4px; color:#64738a; font-size:14px; }.orders { color:#071d3c; font-size:18px; font-weight:700; text-align:center; }.spent { color:#d42d40; font-size:19px; font-weight:800; }.status { display:inline-block; padding:5px 11px; border-radius:10px; font-size:14px; }.vip { background:#f1e5ff; color:#9625e9; }.regular { background:#f1f3f6; color:#243a5c; }.new { background:#dfecff; color:#1957dc; }.actions { display:flex; gap:18px; }.actions button { border:0; background:transparent; color:#4b5b71; }.empty { padding:40px; text-align:center; }@media(max-width:1300px){.customers-page{padding:28px}.customer-stats{grid-template-columns:repeat(2,1fr);gap:20px}}@media(max-width:540px){.customers-page{padding:18px 15px}.customer-stats{grid-template-columns:1fr}.customer-stats article{min-height:140px}.customer-panel h2{padding:25px 20px}}
</style>
