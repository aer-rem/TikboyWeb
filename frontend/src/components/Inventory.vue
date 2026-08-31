<template>
  <section class="inventory-page">
    <div class="inventory-stats">
      <article v-for="stat in stats" :key="stat.label">
        <p>{{ stat.label }}</p>
        <strong :class="stat.color">{{ stat.value }}</strong>
      </article>
    </div>

    <article class="inventory-panel">
      <header class="panel-header">
        <h2>Inventory Status</h2>
        <button
          class="add-stock-btn"
          :class="{ active: showAdd }"
          @click="toggleAdd"
        >
          <v-icon :icon="showAdd ? 'mdi-close' : 'mdi-plus'" />
          {{ showAdd ? 'Close' : 'Add Stock' }}
        </button>
      </header>

      <v-expand-transition>
        <div v-if="showAdd" class="add-panel">
          <div class="add-panel-header">
            <div>
              <h3>Add Stock</h3>
              <p>Select a product and enter the quantity to add.</p>
            </div>
            <button class="close-button" aria-label="Close" @click="showAdd = false">
              <v-icon icon="mdi-close" />
            </button>
          </div>

          <div class="add-form">
            <v-select
              v-model="restockTarget"
              :items="inventory.map(item => item.name)"
              label="Product"
              variant="outlined"
              :disabled="saving"
            />

            <v-text-field
              v-model="restockQty"
              label="Quantity to Add"
              type="number"
              min="1"
              variant="outlined"
              :disabled="saving"
              required
            />

            <v-btn
              color="primary"
              variant="flat"
              :loading="saving"
              @click="saveStock"
            >
              <v-icon icon="mdi-content-save" start />
              Add Stock
            </v-btn>
          </div>
        </div>
      </v-expand-transition>

      <v-progress-linear v-if="loading" color="primary" indeterminate />

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Sold This Month</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in inventory" :key="item.name">
              <td>
                <div class="product">
                  <span class="product-icon"><v-icon icon="mdi-cube-outline" /></span>
                  <strong>{{ item.name }}</strong>
                </div>
              </td>
              <td>{{ item.category }}</td>
              <td class="stock-number">{{ item.stock }}</td>
              <td class="stock-number">{{ item.sold }}</td>
              <td>
                <em :class="item.stock < LOW_STOCK_THRESHOLD ? 'low' : 'in-stock'">
                  {{ item.stock < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock' }}
                </em>
              </td>
              <td>
                <div class="row-actions">
                  <button class="edit-btn" @click="openEdit(item)">
                    <v-icon icon="mdi-pencil" />
                    Edit
                  </button>
                  <button class="restock" @click="openRestock(item)">
                    <v-icon icon="mdi-plus" />
                    Restock
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <v-dialog v-model="showEdit" max-width="480">
      <v-card class="dialog">
        <v-card-title>Edit Product</v-card-title>
        <v-card-text>
          <p class="edit-product-name">{{ editForm.name }}</p>

          <v-text-field
            v-model="editForm.category"
            label="Category"
            placeholder="Example: Classic"
            variant="outlined"
            :disabled="saving"
          />

          <v-textarea
            v-model="editForm.description"
            label="Description"
            placeholder="Describe the product"
            variant="outlined"
            rows="3"
            :disabled="saving"
          />

          <v-text-field
            v-model="editForm.price"
            label="Price"
            type="number"
            prefix="₱"
            step="0.01"
            min="0"
            variant="outlined"
            :disabled="saving"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="showEdit = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveEdit">
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type InventoryItem = {
  name: string
  category: string
  description: string
  stock: number
  sold: number
  price: number
}

type DirectusErrorResponse = {
  errors?: Array<{ message?: string }>
}

type DirectusProduct = {
  id: string | number
  Name: string
  Stock?: string | number
}

type DirectusListResponse = DirectusErrorResponse & {
  data?: DirectusProduct[]
}

type DirectusRefreshResponse = DirectusErrorResponse & {
  data?: { access_token: string; refresh_token: string }
}

const emit = defineEmits<{ notice: [message: string] }>()

const API_URL = 'http://localhost:8055'
const LOW_STOCK_THRESHOLD = 30

const inventory = ref<InventoryItem[]>([
  { name: 'TIKBOY Embutido (Pork)', category: 'Combo Packs', description: '', stock: 0, sold: 0, price: 250 },
  { name: 'TIKBOY Longganisa (Big)', category: 'Classic', description: '', stock: 0, sold: 0, price: 220 },
  { name: 'TIKBOY Longganisa (Small)', category: 'Classic', description: '', stock: 0, sold: 0, price: 150 },
  { name: 'TIKBOY Spicy Longganisa', category: 'Spicy', description: '', stock: 0, sold: 0, price: 180 },
  { name: 'TIKBOY Embutido (Chicken)', category: 'Premium', description: '', stock: 0, sold: 0, price: 260 },
  { name: 'TIKBOY Sweet Longganisa', category: 'Classic', description: '', stock: 0, sold: 0, price: 160 },
])

const loading = ref(false)
const saving = ref(false)
const showAdd = ref(false)
const showEdit = ref(false)
const restockTarget = ref<string | null>(null)
const restockQty = ref('1')

const editForm = ref({
  name: '',
  category: '',
  description: '',
  price: '',
})

const stats = computed(() => {
  const totalProducts = inventory.value.length
  const lowStock = inventory.value.filter(
    (item) => item.stock > 0 && item.stock < LOW_STOCK_THRESHOLD,
  ).length
  const outOfStock = inventory.value.filter((item) => item.stock <= 0).length
  const totalValue = inventory.value.reduce(
    (sum, item) => sum + item.price * item.stock,
    0,
  )

  return [
    { label: 'Total Products', value: String(totalProducts), color: '' },
    { label: 'Low Stock Items', value: String(lowStock), color: 'orange' },
    { label: 'Out of Stock', value: String(outOfStock), color: 'red' },
    {
      label: 'Total Value',
      value: `₱${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      color: '',
    },
  ]
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
  if (!token) throw new Error('You must log in before accessing inventory.')

  if (isTokenExpired(token)) {
    await refreshAccessToken()
    token = getTokenFromStorage()
  }

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  }
}

function getErrorMessage(result: DirectusErrorResponse, fallbackMessage: string) {
  return result.errors?.[0]?.message || fallbackMessage
}

async function loadInventory() {
  loading.value = true

  try {
    const response = await fetch(`${API_URL}/items/Products`, {
      headers: await getHeaders(),
    })

    const result = (await response.json()) as DirectusListResponse

    if (!response.ok) {
      throw new Error(getErrorMessage(result, 'Could not load inventory.'))
    }

    const dbProducts = result.data || []

    inventory.value = inventory.value.map((item) => {
      const match = dbProducts.find(
        (product) => product.Name.toLowerCase() === item.name.toLowerCase(),
      )
      return {
        ...item,
        stock: match ? Number(match.Stock) || 0 : item.stock,
      }
    })
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not load inventory.'
    emit('notice', message)
  } finally {
    loading.value = false
  }
}

async function findProductInDatabase(name: string): Promise<DirectusProduct | undefined> {
  const response = await fetch(
    `${API_URL}/items/Products?filter[Name][_eq]=${encodeURIComponent(name)}`,
    { headers: await getHeaders() },
  )

  const result = (await response.json()) as DirectusListResponse

  if (!response.ok) {
    throw new Error(getErrorMessage(result, 'Could not search for the product.'))
  }

  return result.data?.[0]
}

function toggleAdd() {
  if (showAdd.value) {
    showAdd.value = false
    return
  }
  restockTarget.value = null
  restockQty.value = '1'
  showAdd.value = true
}

function openRestock(item?: InventoryItem) {
  restockTarget.value = item ? item.name : null
  restockQty.value = '1'
  showAdd.value = true
}

async function saveStock() {
  if (!restockTarget.value) {
    emit('notice', 'Select a product to restock.')
    return
  }

  const qty = Number(restockQty.value)
  if (!qty || qty <= 0) {
    emit('notice', 'Enter a quantity greater than zero.')
    return
  }

  const item = inventory.value.find((entry) => entry.name === restockTarget.value)
  if (!item) {
    emit('notice', 'Product not found.')
    return
  }

  saving.value = true

  try {
    const existing = await findProductInDatabase(item.name)

    if (existing) {
      const newStock = Number(existing.Stock) + qty

      const response = await fetch(`${API_URL}/items/Products/${existing.id}`, {
        method: 'PATCH',
        headers: await getHeaders(true),
        body: JSON.stringify({ Stock: newStock }),
      })

      const result = (await response.json()) as DirectusErrorResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not update stock.'))
      }

      item.stock = newStock
      emit('notice', `Restocked ${item.name} (+${qty}). New stock: ${newStock}.`)
    } else {
      const response = await fetch(`${API_URL}/items/Products`, {
        method: 'POST',
        headers: await getHeaders(true),
        body: JSON.stringify({
          Name: item.name,
          Category: item.category,
          Description: item.description,
          Price: item.price,
          Stock: qty,
        }),
      })

      const result = (await response.json()) as DirectusErrorResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not add the product.'))
      }

      item.stock = qty
      emit('notice', `Added ${item.name} to Products with stock ${qty}.`)
    }

    showAdd.value = false
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong while restocking.'
    emit('notice', message)
  } finally {
    saving.value = false
  }
}

function openEdit(item: InventoryItem) {
  editForm.value = {
    name: item.name,
    category: item.category,
    description: item.description,
    price: String(item.price),
  }
  showEdit.value = true
}

async function saveEdit() {
  const item = inventory.value.find((entry) => entry.name === editForm.value.name)
  if (!item) {
    emit('notice', 'Product not found.')
    return
  }

  saving.value = true

  try {
    const existing = await findProductInDatabase(item.name)

    if (existing) {
      const response = await fetch(`${API_URL}/items/Products/${existing.id}`, {
        method: 'PATCH',
        headers: await getHeaders(true),
        body: JSON.stringify({
          Category: editForm.value.category,
          Description: editForm.value.description,
          Price: Number(editForm.value.price) || 0,
        }),
      })

      const result = (await response.json()) as DirectusErrorResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not update the product.'))
      }
    } else {
      const response = await fetch(`${API_URL}/items/Products`, {
        method: 'POST',
        headers: await getHeaders(true),
        body: JSON.stringify({
          Name: item.name,
          Category: editForm.value.category,
          Description: editForm.value.description,
          Price: Number(editForm.value.price) || 0,
          Stock: item.stock,
        }),
      })

      const result = (await response.json()) as DirectusErrorResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not create the product.'))
      }
    }

    item.category = editForm.value.category
    item.description = editForm.value.description
    item.price = Number(editForm.value.price) || 0

    showEdit.value = false
    emit('notice', `Updated ${item.name}.`)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong while saving.'
    emit('notice', message)
  } finally {
    saving.value = false
  }
}

onMounted(loadInventory)
</script>

<style scoped>
/* ============ Page layout ============ */
.inventory-page {
  padding: 39px 35px;
}

/* ============ Stats cards ============ */
.inventory-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
  margin-bottom: 40px;
}

.inventory-stats article {
  min-height: 137px;
  padding: 30px;
  border: 1px solid #e0e5ec;
  border-radius: 20px;
  background: #fff;
}

.inventory-stats p {
  margin: 0 0 10px;
  color: #355173;
  font-size: 17px;
}

.inventory-stats strong {
  color: #071d3c;
  font-size: 38px;
}

.inventory-stats .orange {
  color: #f04b00;
}

.inventory-stats .red {
  color: #e60000;
}

/* ============ Panel ============ */
.inventory-panel {
  overflow: hidden;
  border: 1px solid #e0e5ec;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 2px 3px rgba(11, 32, 62, 0.05);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30px;
  border-bottom: 1px solid #e1e6ec;
}

.panel-header h2 {
  margin: 0;
  color: #071d3c;
  font-size: 25px;
}

.add-stock-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: #d92e40;
  color: white;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.add-stock-btn:hover {
  background: #c22636;
}

.add-stock-btn.active {
  background: #b32231;
}

/* ============ Add Stock dropdown panel ============ */
.add-panel {
  padding: 24px 30px;
  border-bottom: 1px solid #e1e6ec;
  background: #fafbfc;
}

.add-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.add-panel-header h3 {
  margin: 0;
  color: #071d3c;
  font-size: 19px;
}

.add-panel-header p {
  margin: 4px 0 0;
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

.add-form {
  display: grid;
  grid-template-columns: 1fr 200px auto;
  gap: 16px;
  align-items: center;
}

/* ============ Table ============ */
.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1080px;
  border-collapse: collapse;
}

th {
  height: 56px;
  padding: 0 15px;
  background: #fafbfc;
  color: #7c8ba1;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  text-align: left;
  border-bottom: 1px solid #e1e6ec;
  white-space: nowrap;
}

th:first-child,
td:first-child {
  padding-left: 30px;
}

th:last-child,
td:last-child {
  padding-right: 30px;
}

th:nth-child(3),
th:nth-child(4) {
  text-align: center;
  width: 150px;
}

th:nth-child(5) {
  width: 120px;
}

th:last-child {
  width: 200px;
}

td {
  padding: 20px 15px;
  border-top: 1px solid #e1e6ec;
  color: #2f496b;
  font-size: 16px;
  vertical-align: middle;
}

tbody tr {
  transition: background 0.12s ease;
}

tbody tr:hover {
  background: #fafbfc;
}

/* ============ Product cell ============ */
.product {
  display: flex;
  align-items: center;
  gap: 15px;
}

.product-icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: #fde9ed;
  color: #de3043;
  flex-shrink: 0;
}

.product strong {
  color: #071d3c;
  font-size: 18px;
}

.stock-number {
  color: #081d3d;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

/* ============ Status badge ============ */
em {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  font-style: normal;
  white-space: nowrap;
}

.low {
  background: #fff7be;
  color: #e99800;
}

.in-stock {
  background: #d8fae5;
  color: #00a548;
}

/* ============ Row action buttons ============ */
.row-actions {
  display: flex;
  gap: 10px;
}

.edit-btn,
.restock {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 14px;
  border: 1px solid #d0d9e4;
  border-radius: 10px;
  background: white;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.edit-btn {
  color: #355173;
}

.edit-btn:hover {
  background: #f2f4f7;
  border-color: #b9c5d4;
}

.restock {
  color: #d92e40;
  border-color: #f3c9ce;
}

.restock:hover {
  background: #fdebed;
  border-color: #d92e40;
}

/* ============ Dialog ============ */
.dialog {
  border-radius: 16px;
}

.edit-product-name {
  margin: 0 0 20px;
  color: #071d3c;
  font-size: 18px;
  font-weight: 700;
}

/* ============ Responsive ============ */
@media (max-width: 1200px) {
  .inventory-page {
    padding: 28px;
  }

  .inventory-stats {
    gap: 20px;
  }
}

@media (max-width: 860px) {
  .inventory-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .add-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 540px) {
  .inventory-page {
    padding: 18px 15px;
  }

  .inventory-stats {
    grid-template-columns: 1fr;
  }

  .panel-header {
    padding: 22px 18px;
  }

  .panel-header h2 {
    font-size: 22px;
  }

  .add-panel {
    padding: 20px 18px;
  }
}
</style>
