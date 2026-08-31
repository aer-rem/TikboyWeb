<template>
  <section class="products-page">
    <div class="product-toolbar">
      <div class="left-actions">
        <button
          class="add-button"
          :class="{ active: showAdd }"
          @click="toggleAdd"
        >
          <v-icon :icon="showAdd ? 'mdi-close' : 'mdi-plus'" />
          {{ showAdd ? 'Close' : 'Add Product' }}
        </button>

        <button
          class="filter-button"
          :class="{ selected: showLowStock }"
          @click="showLowStock = !showLowStock"
        >
          <v-icon icon="mdi-filter-outline" />
          Filter Low Stock
        </button>
      </div>

      <div class="view-toggle">
        <button
          :class="{ selected: !listView }"
          aria-label="Grid view"
          @click="listView = false"
        >
          <v-icon icon="mdi-view-grid" />
        </button>

        <button
          :class="{ selected: listView }"
          aria-label="List view"
          @click="listView = true"
        >
          <v-icon icon="mdi-format-list-bulleted" />
        </button>
      </div>
    </div>

    <v-expand-transition>
      <div v-if="showAdd" class="add-panel">
        <div class="add-panel-header">
          <div>
            <h3>Add New Product</h3>
            <p>Fill in the details below to add a product to the database.</p>
          </div>
          <button class="close-button" aria-label="Close" @click="showAdd = false">
            <v-icon icon="mdi-close" />
          </button>
        </div>

        <v-form @submit.prevent="addProduct">
          <div class="form-grid">
            <v-text-field
              v-model="newProduct.Name"
              label="Product Name"
              placeholder="Example: TIKBOY Longganisa"
              variant="outlined"
              :disabled="saving"
              required
            />

            <v-text-field
              v-model="newProduct.Category"
              label="Category"
              placeholder="Example: Classic"
              variant="outlined"
              :disabled="saving"
            />
          </div>

          <v-textarea
            v-model="newProduct.Description"
            label="Description"
            placeholder="Describe the product"
            variant="outlined"
            rows="3"
            :disabled="saving"
          />

          <div class="form-grid">
            <v-text-field
              v-model="newProduct.Price"
              label="Price"
              type="number"
              prefix="₱"
              step="0.01"
              min="0"
              variant="outlined"
              :disabled="saving"
              required
            />

            <v-text-field
              v-model="newProduct.Stock"
              label="Stock Quantity"
              type="number"
              min="0"
              variant="outlined"
              :disabled="saving"
              required
            />
          </div>

          <div class="form-actions">
            <v-btn variant="tonal" :disabled="saving" @click="showAdd = false">
              Cancel
            </v-btn>

            <v-btn color="primary" variant="flat" type="submit" :loading="saving">
              <v-icon icon="mdi-content-save" start />
              Save Product
            </v-btn>
          </div>
        </v-form>
      </div>
    </v-expand-transition>

    <v-progress-linear v-if="loading" class="mb-6" color="primary" indeterminate />

    <p v-if="!loading && filteredProducts.length === 0" class="empty-message">
      No products found. Click “Add Product” to create your first product.
    </p>

    <div :class="['product-grid', { 'list-view': listView }]">
      <article v-for="product in filteredProducts" :key="product.id" class="product-card">
        <div class="product-image">
          <v-icon icon="mdi-cube-outline" size="70" />
        </div>

        <h2>{{ product.Name }}</h2>

        <p class="category">{{ product.Category || 'Uncategorized' }}</p>

        <p class="description">{{ product.Description || 'No description added yet.' }}</p>

        <div class="rating">
          <span>★★★★</span>
          <i>☆</i>
          <small>(4.5)</small>
        </div>

        <div class="metrics">
          <div>
            <span>Price</span>
            <strong>{{ formatPrice(product.Price) }}</strong>
          </div>

          <div>
            <span>Stock</span>
            <b>{{ product.Stock }}</b>
          </div>
        </div>

        <p :class="['stock', isLowStock(product) ? 'low' : '']">
          {{ product.Stock }} in stock
        </p>

        <div class="card-actions">
          <button aria-label="Edit product" @click="editProduct(product)">
            <v-icon icon="mdi-square-edit-outline" />
          </button>

          <button class="view-button" @click="viewProduct(product)">
            <v-icon icon="mdi-eye-outline" />
            View
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type Product = {
  id: string | number
  Name: string
  Category?: string | null
  Description?: string | null
  Price: string | number
  Stock: string | number
}

type DirectusErrorResponse = {
  errors?: Array<{ message?: string }>
}

type DirectusListResponse = DirectusErrorResponse & {
  data?: Product[]
}

type DirectusCreateResponse = DirectusErrorResponse & {
  data?: Product
}

type DirectusRefreshResponse = DirectusErrorResponse & {
  data?: { access_token: string; refresh_token: string }
}

const props = defineProps<{ search?: string }>()

const emit = defineEmits<{ notice: [message: string] }>()

const API_URL = 'http://localhost:8055'
const LOW_STOCK_THRESHOLD = 30

const showAdd = ref(false)
const showLowStock = ref(false)
const listView = ref(false)
const loading = ref(false)
const saving = ref(false)

const products = ref<Product[]>([])

const newProduct = ref({
  Name: '',
  Category: '',
  Description: '',
  Price: '',
  Stock: '0',
})

const filteredProducts = computed(() => {
  const searchText = (props.search || '').toLowerCase()

  return products.value.filter((product) => {
    const searchableText = `
      ${product.Name}
      ${product.Category || ''}
      ${product.Description || ''}
    `.toLowerCase()

    const matchesSearch = searchableText.includes(searchText)
    const matchesLowStock = !showLowStock.value || isLowStock(product)

    return matchesSearch && matchesLowStock
  })
})

function getTokenFromStorage() {
  return localStorage.getItem('access_token')
}

function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) throw new Error('No refresh token available.')

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, mode: 'json' }),
  })

  if (!response.ok) throw new Error('Could not refresh the session.')

  const result = (await response.json()) as DirectusRefreshResponse
  if (!result.data) throw new Error('Could not refresh the session.')

  localStorage.setItem('access_token', result.data.access_token)
  localStorage.setItem('refresh_token', result.data.refresh_token)
}

async function getHeaders(includeJson = false) {
  let token = getTokenFromStorage()
  if (!token) throw new Error('You must log in before accessing products.')

  if (isTokenExpired(token)) {
    await refreshAccessToken()
    token = getTokenFromStorage()
  }

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  }
}

function isLowStock(product: Product) {
  return Number(product.Stock) < LOW_STOCK_THRESHOLD
}

function formatPrice(price: string | number) {
  return `₱${Number(price).toFixed(2)}`
}

function getErrorMessage(result: DirectusErrorResponse, fallbackMessage: string) {
  return result.errors?.[0]?.message || fallbackMessage
}

function resetProductForm() {
  newProduct.value = {
    Name: '',
    Category: '',
    Description: '',
    Price: '',
    Stock: '0',
  }
}

function toggleAdd() {
  if (showAdd.value) {
    showAdd.value = false
    return
  }
  resetProductForm()
  showAdd.value = true
}

async function loadProducts() {
  loading.value = true

  try {
    const response = await fetch(`${API_URL}/items/Products`, {
      headers: await getHeaders(),
    })

    const result = (await response.json()) as DirectusListResponse

    if (!response.ok) {
      throw new Error(getErrorMessage(result, 'Could not load Products from Directus.'))
    }

    /* Only show products that still have stock. Sold-out items are hidden. */
    products.value = (result.data || []).filter(
      (product) => Number(product.Stock) > 0,
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not load Products from Directus.'
    emit('notice', message)
  } finally {
    loading.value = false
  }
}

async function addProduct() {
  if (!newProduct.value.Name.trim()) {
    emit('notice', 'Product name is required.')
    return
  }

  if (!newProduct.value.Price || Number(newProduct.value.Price) < 0) {
    emit('notice', 'Enter a valid product price.')
    return
  }

  if (Number(newProduct.value.Stock) < 0) {
    emit('notice', 'Stock quantity cannot be negative.')
    return
  }

  saving.value = true

  try {
    const response = await fetch(`${API_URL}/items/Products`, {
      method: 'POST',
      headers: await getHeaders(true),
      body: JSON.stringify({
        Name: newProduct.value.Name.trim(),
        Category: newProduct.value.Category.trim(),
        Description: newProduct.value.Description.trim(),
        Price: Number(newProduct.value.Price),
        Stock: Number(newProduct.value.Stock),
      }),
    })

    const result = (await response.json()) as DirectusCreateResponse

    if (!response.ok) {
      throw new Error(getErrorMessage(result, 'Could not save the product.'))
    }

    showAdd.value = false
    emit('notice', `"${result.data?.Name || newProduct.value.Name}" was added successfully.`)
    await loadProducts()
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong while saving the product.'
    emit('notice', message)
  } finally {
    saving.value = false
  }
}

function editProduct(product: Product) {
  emit('notice', `Edit feature is not built yet for ${product.Name}.`)
}

function viewProduct(product: Product) {
  emit('notice', `View feature is not built yet for ${product.Name}.`)
}

onMounted(loadProducts)
</script>

<style scoped>
.products-page {
  padding: 39px 40px;
}

.product-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.left-actions,
.view-toggle,
.card-actions {
  display: flex;
  gap: 14px;
}

.product-toolbar button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 13px;
  height: 46px;
  border-radius: 10px;
  font-weight: 700;
}

.add-button {
  padding: 0 18px;
  border: 0;
  background: #d92e40;
  box-shadow: 0 7px 11px rgba(209, 40, 58, 0.18);
  color: white;
  cursor: pointer;
}

.add-button.active {
  background: #b32231;
}

.filter-button {
  padding: 0 16px;
  border: 1px solid #ced7e2;
  background: white;
  color: #101d30;
}

.filter-button.selected {
  border-color: #d92e40;
  color: #d92e40;
}

.view-toggle button {
  width: 46px;
  border: 0;
  background: #f2f4f7;
  color: #536277;
}

.view-toggle .selected {
  background: #d12b3d;
  color: white;
}

.add-panel {
  margin-bottom: 30px;
  padding: 30px;
  border: 1px solid #e0e5ec;
  border-radius: 20px;
  background: white;
  box-shadow: 0 2px 3px rgba(11, 32, 62, 0.05);
}

.add-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.add-panel-header h3 {
  margin: 0;
  color: #071b39;
  font-size: 21px;
}

.add-panel-header p {
  margin: 6px 0 0;
  color: #61718a;
  font-size: 14px;
}

.close-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: #f2f4f7;
  color: #536277;
  cursor: pointer;
}

.close-button:hover {
  background: #fdebed;
  color: #d12b3d;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.empty-message {
  margin: 35px 0;
  color: #61718a;
  font-size: 16px;
  text-align: center;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 29px;
}

.product-card {
  padding: 30px;
  border: 1px solid #e0e5ec;
  border-radius: 20px;
  background: white;
  box-shadow: 0 2px 3px rgba(11, 32, 62, 0.05);
}

.product-image {
  display: grid;
  place-items: center;
  height: 200px;
  margin-bottom: 24px;
  border-radius: 16px;
  background: #fdebed;
  color: #d12b3d;
}

.product-card h2 {
  margin: 0;
  color: #071b39;
  font-size: 23px;
  line-height: 1.22;
}

.category {
  margin: 15px 0 8px;
  color: #61718a;
  font-size: 17px;
}

.description {
  min-height: 42px;
  margin: 0;
  color: #8190a4;
  font-size: 14px;
  line-height: 1.5;
}

.rating {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 14px;
}

.rating span {
  color: #ffbd00;
  letter-spacing: 2px;
  font-size: 21px;
}

.rating i {
  color: #c7d0dc;
  font-size: 22px;
  font-style: normal;
}

.rating small {
  margin-left: 4px;
  color: #64728a;
  font-size: 14px;
}

.metrics {
  display: flex;
  justify-content: space-between;
  margin: 23px 0 28px;
}

.metrics span,
.metrics strong,
.metrics b {
  display: block;
}

.metrics span {
  color: #68778e;
  font-size: 14px;
}

.metrics strong {
  margin-top: 5px;
  color: #d42c3e;
  font-size: 20px;
}

.metrics > div:last-child {
  text-align: right;
}

.metrics b {
  margin-top: 5px;
  color: #0b1e3a;
  font-size: 18px;
}

.stock {
  margin: 0 0 20px;
  padding: 5px;
  border-radius: 10px;
  background: #d8f9e5;
  color: #00a847;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}

.stock.low {
  background: #fff7ba;
  color: #ed9b00;
}

.card-actions button {
  flex: 1;
  height: 45px;
  border: 1px solid #d0d8e2;
  border-radius: 10px;
  background: white;
  color: #111;
}

.card-actions .view-button {
  border: 0;
  background: #e93243;
  color: white;
  font-weight: 700;
}

.list-view {
  grid-template-columns: 1fr;
}

.list-view .product-card {
  display: grid;
  grid-template-columns: 220px 1fr 180px 200px;
  align-items: center;
  gap: 20px;
}

.list-view .product-image {
  height: 130px;
  margin: 0;
  grid-row: span 2;
}

.list-view .category,
.list-view .description,
.list-view .rating,
.list-view .metrics {
  margin: 8px 0;
}

.list-view .stock,
.list-view .card-actions {
  margin: 0;
}

@media (max-width: 1300px) {
  .products-page {
    padding: 28px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 860px) {
  .products-page {
    padding: 20px;
  }

  .list-view .product-card {
    grid-template-columns: 1fr;
  }

  .list-view .product-image {
    grid-row: auto;
  }

  .product-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 540px) {
  .products-page {
    padding: 16px;
  }

  .product-grid {
    grid-template-columns: 1fr;
  }

  .product-toolbar {
    align-items: flex-start;
  }

  .view-toggle button:last-child {
    display: none;
  }

  .product-card {
    padding: 22px;
  }

  .product-image {
    height: 170px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
