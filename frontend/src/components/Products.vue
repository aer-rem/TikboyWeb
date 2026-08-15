<template>
  <section class="products-page">
    <div class="product-toolbar">
      <div class="left-actions">
        <button class="add-button" @click="showAdd = true"><v-icon icon="mdi-plus" /> Add Product</button>
        <button class="filter-button" :class="{ selected: showLowStock }" @click="showLowStock = !showLowStock"><v-icon icon="mdi-filter-outline" /> Filter</button>
      </div>
      <div class="view-toggle"><button class="selected"><v-icon icon="mdi-view-grid" /></button><button @click="listView = !listView"><v-icon icon="mdi-format-list-bulleted" /></button></div>
    </div>

    <div :class="['product-grid', { 'list-view': listView }]">
      <article v-for="product in filteredProducts" :key="product.name" class="product-card">
        <div class="product-image"><v-icon icon="mdi-cube-outline" size="70" /></div>
        <h2>{{ product.name }}</h2>
        <p class="category">{{ product.category }}</p>
        <div class="rating"><span>★★★★</span><i>☆</i><small>(4.5)</small></div>
        <div class="metrics"><div><span>Revenue</span><strong>{{ product.revenue }}</strong></div><div><span>Sold</span><b>{{ product.sold }}</b></div></div>
        <p :class="['stock', product.stock < 250 ? 'low' : '']">{{ product.stock }} in stock</p>
        <div class="card-actions"><button aria-label="Edit product" @click="editProduct(product.name)"><v-icon icon="mdi-square-edit-outline" /></button><button class="view-button" @click="viewProduct(product.name)"><v-icon icon="mdi-eye-outline" /> View</button></div>
      </article>
    </div>

    <v-dialog v-model="showAdd" max-width="520">
      <v-card class="dialog-card"><v-card-title>Add Product</v-card-title><v-card-text><v-text-field label="Product name" variant="outlined" /><v-text-field label="Category" variant="outlined" /><v-text-field label="Stock quantity" type="number" variant="outlined" /></v-card-text><v-card-actions><v-spacer /><v-btn @click="showAdd = false">Cancel</v-btn><v-btn color="primary" variant="flat" @click="addProduct">Save Product</v-btn></v-card-actions></v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  const props = defineProps<{ search: string }>()
  const emit = defineEmits<{ notice: [message: string] }>()
  const showAdd = ref(false); const showLowStock = ref(false); const listView = ref(false)
  const products = [{ name: 'TIKBOY Embutido (Pork)', category: 'Combo Packs', revenue: '₱264,600.00', sold: 945, stock: 180 }, { name: 'TIKBOY Longganisa (Big)', category: 'Classic', revenue: '₱199,520.00', sold: 1247, stock: 450 }, { name: 'TIKBOY Longganisa (Small)', category: 'Classic', revenue: '₱179,520.00', sold: 1056, stock: 380 }, { name: 'TIKBOY Spicy Longganisa', category: 'Spicy', revenue: '₱160,560.00', sold: 892, stock: 320 }, { name: 'TIKBOY Embutido (Chicken)', category: 'Premium', revenue: '₱149,160.00', sold: 678, stock: 240 }, { name: 'TIKBOY Sweet Longganisa', category: 'Classic', revenue: '₱121,110.00', sold: 734, stock: 410 }]
  const filteredProducts = computed(() => products.filter(product => (!showLowStock.value || product.stock < 250) && `${product.name} ${product.category}`.toLowerCase().includes(props.search.toLowerCase())))
  const editProduct = (name: string) => emit('notice', `Editing ${name}`)
  const viewProduct = (name: string) => emit('notice', `Viewing ${name}`)
  const addProduct = () => { showAdd.value = false; emit('notice', 'Product saved') }
</script>

<style scoped>
  .products-page { padding: 39px 40px; }.product-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:30px; }.left-actions,.view-toggle,.card-actions { display:flex; gap:14px; }.product-toolbar button { display:flex; align-items:center; justify-content:center; gap:13px; height:46px; border-radius:10px; font-weight:700; }.add-button { padding:0 18px; border:0; background:#d92e40; box-shadow:0 7px 11px rgba(209,40,58,.18); color:white; }.filter-button { padding:0 16px; border:1px solid #ced7e2; background:white; color:#101d30; }.filter-button.selected { border-color:#d92e40; color:#d92e40; }.view-toggle button { width:46px; border:0; background:#f2f4f7; color:#536277; }.view-toggle .selected { background:#d12b3d; color:white; }.product-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:29px; }.product-card { padding:30px; border:1px solid #e0e5ec; border-radius:20px; background:white; box-shadow:0 2px 3px rgba(11,32,62,.05); }.product-image { display:grid; place-items:center; height:200px; margin-bottom:24px; border-radius:16px; background:#fdebed; color:#d12b3d; }.product-card h2 { margin:0; color:#071b39; font-size:23px; line-height:1.22; }.category { margin:15px 0 18px; color:#61718a; font-size:17px; }.rating { display:flex; align-items:center; gap:5px; }.rating span { color:#ffbd00; letter-spacing:2px; font-size:21px; }.rating i { color:#c7d0dc; font-size:22px; font-style:normal; }.rating small { margin-left:4px; color:#64728a; font-size:14px; }.metrics { display:flex; justify-content:space-between; margin:23px 0 28px; }.metrics span,.metrics strong,.metrics b { display:block; }.metrics span { color:#68778e; font-size:14px; }.metrics strong { margin-top:5px; color:#d42c3e; font-size:20px; }.metrics > div:last-child { text-align:right; }.metrics b { margin-top:5px; color:#0b1e3a; font-size:18px; }.stock { margin:0 0 20px; padding:5px; border-radius:10px; background:#d8f9e5; color:#00a847; font-size:14px; font-weight:600; text-align:center; }.stock.low { background:#fff7ba; color:#ed9b00; }.card-actions button { flex:1; height:45px; border:1px solid #d0d8e2; border-radius:10px; background:white; color:#111; }.card-actions .view-button { border:0; background:#e93243; color:white; font-weight:700; }.dialog-card { border-radius:16px; }.list-view { grid-template-columns:1fr; }.list-view .product-card { display:grid; grid-template-columns:220px 1fr 180px 200px; align-items:center; gap:20px; }.list-view .product-image { height:130px; margin:0; grid-row:span 2; }.list-view .category,.list-view .rating,.list-view .metrics { margin:8px 0; }.list-view .stock,.list-view .card-actions { margin:0; }
  @media(max-width:1300px){.products-page{padding:28px}.product-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:860px){.products-page{padding:20px}.list-view .product-card{grid-template-columns:1fr}.list-view .product-image{grid-row:auto}.product-grid{grid-template-columns:1fr 1fr}}@media(max-width:540px){.products-page{padding:16px}.product-grid{grid-template-columns:1fr}.product-toolbar{align-items:flex-start}.view-toggle button:last-child{display:none}.product-card{padding:22px}.product-image{height:170px}}
</style>
