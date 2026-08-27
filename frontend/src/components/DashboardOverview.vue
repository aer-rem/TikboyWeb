// TEST TEST

<template>
  <div class="dashboard">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-placeholder">T</div>
        <div><strong>TIKBOY</strong><span>Admin Dashboard</span></div>
      </div>
      <nav aria-label="Dashboard navigation">
        <button v-for="item in navigation" :key="item.label" :class="{ active: activeNav === item.label }" @click="activeNav = item.label">
          <v-icon :icon="item.icon" size="25" /><span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <div class="target"><span>Monthly Target</span><strong>₱300,000</strong><em>95%</em><div><i /></div></div>
        <button class="logout" @click="$emit('logout')"><v-icon icon="mdi-logout" /> Log Out</button>
      </div>
    </aside>

    <main class="content">
      <header class="topbar">
        <div><h1>{{ pageTitle }}</h1><p>Sunday, August 2, 2026</p></div>
        <div class="top-actions">
          <label class="search"><v-icon icon="mdi-magnify" /><input v-model="search" placeholder="Search..." /></label>
          <button aria-label="Notifications" class="icon-button" @click="notify('No new notifications')"><v-icon icon="mdi-bell-outline" size="28" /></button>
          <button class="outline-button" @click="notify('Export started')"><v-icon icon="mdi-download" /> Export</button>
          <button class="outline-button">Mar 2025 <v-icon icon="mdi-chevron-down" /></button>
        </div>
      </header>

      <Products v-if="activeNav === 'Products'" :search="search" @notice="notify" />
      <Orders v-else-if="activeNav === 'Orders'" :search="search" @notice="notify" />
      <Customers v-else-if="activeNav === 'Customers'" :search="search" @notice="notify" />
      <Analytics v-else-if="activeNav === 'Analytics'" />
      <Inventory v-else-if="activeNav === 'Inventory'" @notice="notify" />
      <Reports v-else-if="activeNav === 'Reports'" @notice="notify" />
      <section v-else class="page-body">
        <div class="quick-actions">
          <button v-for="action in quickActions" :key="action.label" @click="notify(action.label + ' selected')"><span :class="action.color"><v-icon :icon="action.icon" /></span>{{ action.label }}</button>
        </div>

        <div class="stat-grid">
          <article v-for="stat in stats" :key="stat.label" class="stat-card">
            <div :class="['stat-icon', stat.color]"><v-icon :icon="stat.icon" /></div>
            <span v-if="stat.change" class="trend">↗ {{ stat.change }}</span>
            <p>{{ stat.label }}</p><strong>{{ stat.value }}</strong>
          </article>
        </div>

        <div class="chart-grid">
          <article class="panel revenue-panel"><h2>Revenue Trend</h2>
            <div class="revenue-chart"><span>300000</span><span>225000</span><span>150000</span><span>75000</span>
              <svg viewBox="0 0 850 270" preserveAspectRatio="none" aria-label="Revenue trend chart" role="img"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#e63749" stop-opacity=".31"/><stop offset="1" stop-color="#e63749" stop-opacity=".01"/></linearGradient></defs><path d="M0 200 L85 180 L170 160 L255 142 L340 122 L425 104 L510 85 C545 72 565 41 595 37 C625 34 645 78 680 65 C720 60 770 35 850 10 L850 270 L0 270Z" fill="url(#fill)"/><path d="M0 200 L85 180 L170 160 L255 142 L340 122 L425 104 L510 85 C545 72 565 41 595 37 C625 34 645 78 680 65 C720 60 770 35 850 10" fill="none" stroke="#d1283a" stroke-width="4"/></svg>
            </div><div class="chart-months"><span>Mar 2025</span><span>Apr 2025</span><span>Jun 2025</span><span>Jul 2025</span><span>Sep 2025</span><span>Oct 2025</span><span>Dec 2025</span><span>Jan 2026</span><span>Mar 2026</span></div>
          </article>
          <article class="panel categories"><h2>Categories</h2><div class="donut" /><ul><li v-for="category in categories" :key="category.name"><i :style="{ background: category.color }" />{{ category.name }} <strong>{{ category.value }}</strong></li></ul></article>
        </div>

        <div class="lower-grid">
          <article class="panel orders"><div class="panel-heading"><h2>Recent Orders</h2><button @click="notify('Showing all orders')">View All</button></div><div v-for="order in filteredOrders" :key="order.name" class="order"><span class="order-icon"><v-icon icon="mdi-cart-outline" /></span><div><strong>{{ order.name }}</strong><small>{{ order.product }}</small></div><div><strong>{{ order.total }}</strong><em :class="order.status">{{ order.status }}</em></div></div></article>
          <article class="panel products"><h2>Top Products</h2><div v-for="product in products" :key="product.rank" class="product"><b>{{ product.rank }}</b><div><strong>{{ product.name }}</strong><small>★★★★<span>☆</span> &nbsp;{{ product.sold }} sold</small></div><em>{{ product.value }}</em></div></article>
        </div>
      </section>
    </main>
    <v-snackbar v-model="snackbar" color="primary" location="top right">{{ notice }}</v-snackbar>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import Orders from '@/components/Orders.vue'
  import Customers from '@/components/Customers.vue'
  import Analytics from '@/components/Analytics.vue'
  import Inventory from '@/components/Inventory.vue'
  import Reports from '@/components/Reports.vue'
  import Products from '@/components/Products.vue'
  defineEmits<{ logout: [] }>()
  const activeNav = ref('Overview'); const search = ref(''); const snackbar = ref(false); const notice = ref('')
  const navigation = [{ label: 'Overview', icon: 'mdi-home-outline' }, { label: 'Products', icon: 'mdi-cube-outline' }, { label: 'Orders', icon: 'mdi-cart-outline' }, { label: 'Customers', icon: 'mdi-account-group-outline' }, { label: 'Analytics', icon: 'mdi-chart-bar' }, { label: 'Inventory', icon: 'mdi-view-grid-outline' }, { label: 'Reports', icon: 'mdi-file-document-outline' }]
  const quickActions = [{ label: 'Add Product', icon: 'mdi-plus', color: 'pink' }, { label: 'New Order', icon: 'mdi-cart-outline', color: 'blue' }, { label: 'Add Customer', icon: 'mdi-account-group-outline', color: 'purple' }, { label: 'Export Data', icon: 'mdi-download', color: 'green' }, { label: 'View Reports', icon: 'mdi-chart-bar', color: 'orange' }]
  const stats = [{ label: 'Total Revenue', value: '₱285,000.00', icon: 'mdi-currency-usd', color: 'green', change: '11.3%' }, { label: 'Total Orders', value: '895', icon: 'mdi-cart-outline', color: 'blue' }, { label: 'Total Customers', value: '720', icon: 'mdi-account-group-outline', color: 'purple' }, { label: 'Avg Order Value', value: '₱318.44', icon: 'mdi-cube-outline', color: 'orange' }]
  const categories = [{ name: 'Combo Packs', value: '₱264,600.00', color: '#d12d3f' }, { name: 'Classic', value: '₱500,150.00', color: '#eb3547' }, { name: 'Spicy', value: '₱160,560.00', color: '#a91f31' }, { name: 'Premium', value: '₱149,160.00', color: '#ff4558' }]
  const orders = [{ name: 'Maria Santos', product: 'Classic Longganisa', total: '₱450.00', status: 'delivered' }, { name: 'Juan Dela Cruz', product: 'Spicy Longganisa', total: '₱680.00', status: 'shipped' }, { name: 'Ana Reyes', product: 'Garlic Longganisa', total: '₱520.00', status: 'processing' }, { name: 'Pedro Garcia', product: 'Premium Combo', total: '₱1,200.00', status: 'pending' }, { name: 'Rosa Mendoza', product: 'Sweet Longganisa', total: '₱380.00', status: 'delivered' }]
  const products = [{ rank: 1, name: 'TIKBOY Embutido (Pork)', sold: 945, value: '₱264,600.00' }, { rank: 2, name: 'TIKBOY Longganisa (Big)', sold: 1247, value: '₱199,520.00' }, { rank: 3, name: 'TIKBOY Longganisa (Small)', sold: 1056, value: '₱179,520.00' }, { rank: 4, name: 'TIKBOY Spicy Longganisa', sold: 892, value: '₱160,560.00' }, { rank: 5, name: 'TIKBOY Embutido (Chicken)', sold: 678, value: '₱149,160.00' }]
  const filteredOrders = computed(() => orders.filter(order => `${order.name} ${order.product}`.toLowerCase().includes(search.value.toLowerCase())))
  const pageTitle = computed(() => ({ Products: 'Product Management', Orders: 'Order Management', Customers: 'Customer Management', Analytics: 'Sales Analytics', Inventory: 'Inventory Management', Reports: 'Business Reports' }[activeNav.value] ?? 'Dashboard Overview'))
  const notify = (message: string) => { notice.value = message; snackbar.value = true }
</script>

<style scoped>
  .dashboard { display: flex; min-height: 100vh; background: #f8f9fb; color: #081d3d; font-family: Roboto, sans-serif; } button { font: inherit; cursor: pointer; } .sidebar { position: sticky; top: 0; height: 100vh; width: 360px; flex: 0 0 360px; display: flex; flex-direction: column; overflow: hidden; background: white; border-right: 1px solid #e4e7ec; } .brand { height: 143px; flex: 0 0 auto; display: flex; align-items: center; gap: 15px; padding: 30px; border-bottom: 1px solid #eef0f3; } .brand-placeholder { display: grid; place-items: center; width: 80px; height: 80px; border: 1px solid #e4e7ec; border-radius: 16px; color: #d1283a; font-size: 36px; font-weight: 900; } .brand strong { display: block; font-size: 30px; letter-spacing: .4px; } .brand span { color: #68758b; font-size: 16px; } nav { flex: 1 1 auto; overflow-y: auto; padding: 24px 20px; scrollbar-color: #c4cad3 transparent; } nav button, .logout { width: 100%; display: flex; align-items: center; gap: 17px; min-height: 56px; padding: 0 21px; border: 0; border-radius: 14px; background: transparent; color: #44536a; font-size: 18px; font-weight: 600; text-align: left; } nav button + button { margin-top: 5px; } nav button.active { background: linear-gradient(135deg, #ea3b4b, #d8273a); box-shadow: 0 10px 18px rgba(209, 40, 58, .2); color: white; } .sidebar-bottom { flex: 0 0 auto; padding: 20px; border-top: 1px solid #eef0f3; background: #fff; } .target { position: relative; padding: 16px 15px 14px; border-radius: 16px; background: linear-gradient(135deg, #fff1f2, #fde5e8); color: #59677c; } .target span,.target strong { display:block; } .target strong { margin-top: 7px; color: #112746; font-size: 17px; } .target em { position:absolute; right: 15px; top: 46px; color:#d1283a; font-style:normal; }.target div { height: 8px; margin-top: 12px; border-radius: 10px; background:#dfe6ee; overflow:hidden; }.target i { display:block; width:95%; height:100%; border-radius:inherit; background:linear-gradient(90deg, #db2b3e, #ee4b59); }.logout { margin-top: 16px; }
  .content { min-width: 0; flex: 1; } .topbar { height: 111px; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; background: #fff; border-bottom: 1px solid #dfe3e8; box-shadow: 0 2px 3px rgba(0,0,0,.06); } h1,h2 { margin:0; font-weight: 800; } h1 { font-size: 30px; } .topbar p { margin:7px 0 0; color:#6d798d; font-size:17px; }.top-actions { display:flex; align-items:center; gap:20px; }.search { display:flex; align-items:center; gap:13px; width:320px; height:52px; padding:0 15px; border:1px solid #d2d8e1; border-radius:13px; color:#8a96a8; }.search input { width:100%; border:0; outline:0; color:#243855; font:inherit; }.icon-button { position:relative; border:0; background:transparent; color:#3c4b62; }.outline-button { display:flex; align-items:center; gap:9px; height:48px; padding:0 16px; border:1px solid #d3d9e2; border-radius:12px; background:#fff; color:#111; font-weight:600; }.page-body { padding:40px; }.quick-actions { display:grid; grid-template-columns:repeat(5,minmax(190px,1fr)); gap:20px; }.quick-actions button { display:flex; align-items:center; gap:16px; min-height:94px; padding:18px 20px; border:1px solid #dfe4eb; border-radius:18px; background:white; color:#071d3d; font-size:17px; font-weight:700; text-align:left; }.quick-actions span,.stat-icon { display:grid; place-items:center; width:50px; height:50px; border-radius:13px; }.pink { background:#fde9ed; color:#df3347; }.blue { background:#e0ecff; color:#1263ed; }.purple { background:#f0e3ff; color:#9829ff; }.green { background:#d9fbe7; color:#00ac4e; }.orange { background:#ffecd2; color:#ff5317; }.stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:29px; margin-top:40px; }.stat-card,.panel { border:1px solid #e0e5ec; border-radius:20px; background:white; box-shadow:0 2px 3px rgba(11,32,62,.04); }.stat-card { position:relative; height:218px; padding:30px; }.stat-card p { margin:24px 0 10px; color:#355173; font-size:17px; }.stat-card strong { font-size:37px; letter-spacing:.4px; }.trend { position:absolute; top:30px; right:30px; padding:5px 10px; border-radius:10px; background:#d8fae5; color:#00a64c; font-size:14px; }.chart-grid,.lower-grid { display:grid; grid-template-columns:2.05fr 1fr; gap:29px; margin-top:39px; }.panel { padding:34px 30px; } h2 { font-size:25px; }.revenue-panel { min-height:405px; }.revenue-chart { position:relative; height:275px; margin:35px 7px 0 81px; border-left:2px solid #8d9ab0; background:repeating-linear-gradient(to bottom,transparent 0,transparent 80px,#e6e9ed 81px,transparent 82px); }.revenue-chart span { position:relative; left:-65px; top:-8px; display:block; height:81px; color:#6d798d; font-size:14px; }.revenue-chart svg { position:absolute; inset:0; width:100%; height:100%; }.chart-months { display:flex; justify-content:space-between; margin-left:81px; color:#6d798d; font-size:14px; }.categories { min-height:405px; }.donut { width:190px; aspect-ratio:1; margin:48px auto 24px; border-radius:50%; background:conic-gradient(#d12d3f 0 25%,white 25% 27%,#eb3547 27% 55%,white 55% 57%,#a91f31 57% 74%,white 74% 76%,#ff4558 76% 100%); mask:radial-gradient(transparent 0 53%,#000 54%); }.categories ul { list-style:none; margin:0; padding:0; }.categories li { display:flex; align-items:center; gap:10px; margin:13px 0; color:#263f5e; font-size:16px; }.categories li i { width:15px; height:15px; border-radius:50%; }.categories li strong { margin-left:auto; color:#0a213f; }.lower-grid { grid-template-columns:1fr 1fr; }.panel-heading { display:flex; justify-content:space-between; align-items:center; margin-bottom:31px; }.panel-heading button { border:0; background:transparent; color:#df263a; font-weight:600; }.order { display:grid; grid-template-columns:50px 1fr auto; align-items:center; gap:14px; padding:16px 15px; border-radius:15px; }.order:nth-of-type(odd) { background:#fafbfc; }.order-icon { display:grid; place-items:center; width:50px; height:50px; border-radius:12px; background:#fde9ed; color:#e53347; }.order strong,.product strong { display:block; }.order small,.product small { display:block; margin-top:4px; color:#60708a; font-size:14px; }.order > div:last-child { text-align:right; }.order em { display:inline-block; margin-top:8px; padding:4px 10px; border-radius:9px; font-style:normal; font-size:14px; }.delivered { background:#d9fbe7; color:#009848; }.shipped,.processing,.pending { background:#e2edff; color:#1458de; }.products h2 { margin-bottom:23px; }.product { display:grid; grid-template-columns:45px 1fr auto; align-items:center; gap:15px; padding:10px 0; }.product > b { display:grid; place-items:center; width:40px; height:40px; border-radius:12px; background:#df3144; color:white; }.product small { color:#f6b900; }.product small span { color:#bec7d3; }.product em { color:#d9283d; font-size:18px; font-style:normal; font-weight:700; }
  @media(max-width:1300px){.sidebar{width:270px;flex-basis:270px}.brand{padding:20px}.brand-placeholder{width:60px;height:60px}.brand strong{font-size:25px}.quick-actions{grid-template-columns:repeat(3,1fr)}.stat-grid{grid-template-columns:repeat(2,1fr)}.topbar{padding:0 28px}.page-body{padding:28px}.search{width:220px}}@media(max-width:860px){.dashboard{display:block}.sidebar{position:static;width:100%;height:auto}.brand{height:100px}.sidebar nav{display:flex;gap:5px;overflow:auto;padding:10px}.sidebar nav button{width:auto;min-width:max-content;min-height:45px;padding:0 12px;font-size:15px}.sidebar-bottom{display:none}.topbar{height:auto;align-items:flex-start;gap:18px;padding:24px;flex-direction:column}.top-actions{width:100%;gap:10px}.search{flex:1}.chart-grid,.lower-grid{grid-template-columns:1fr}.page-body{padding:20px}.quick-actions{grid-template-columns:1fr 1fr}.stat-grid{gap:15px}.chart-months span:nth-child(even){display:none}}@media(max-width:540px){h1{font-size:25px}.top-actions .outline-button:last-child{display:none}.quick-actions,.stat-grid{grid-template-columns:1fr}.search{width:auto}.stat-card{height:185px}.product{grid-template-columns:38px 1fr}.product em{grid-column:2}.revenue-chart{margin-left:50px}.revenue-chart span{left:-45px}.chart-months{margin-left:50px;font-size:11px}.panel{padding:25px 18px}.order{padding:12px 0}.order-icon{width:40px;height:40px}}
</style>
