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
              <p>Select a product, choose its variant when needed, then enter the quantity.</p>
            </div>
            <button class="close-button" aria-label="Close" @click="showAdd = false">
              <v-icon icon="mdi-close" />
            </button>
          </div>

          <div class="add-form">
            <v-select
              v-model="restockTarget"
              :items="productOptions"
              label="Product"
              variant="outlined"
              :disabled="saving"
              @update:model-value="onProductChange"
            />

            <v-text-field
              v-if="isAddingNewProduct"
              v-model="newProductName"
              label="New Product Name"
              placeholder="Example: Tikboy Tocino"
              variant="outlined"
              :disabled="saving"
            />

            <v-select
              v-if="restockTarget === LONGGANISA_PRODUCT"
              v-model="restockVariant"
              :items="longganisaVariants"
              label="Category and Size"
              variant="outlined"
              :disabled="saving"
            />

            <v-select
              v-if="restockTarget === EMBUTIDO_PRODUCT"
              v-model="restockVariant"
              :items="embutidoSizes"
              label="Size"
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
          <colgroup>
            <col class="col-product" />
            <col class="col-variant" />
            <col class="col-stock" />
            <col class="col-sold" />
            <col class="col-status" />
            <col class="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category / Size</th>
              <th class="numeric">Stock</th>
              <th class="numeric">Sold</th>
              <th>Status</th>
              <th class="actions-head">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in inventory" :key="item.key">
              <td>
                <div class="product">
                  <span class="product-icon"><v-icon icon="mdi-cube-outline" /></span>
                  <strong>{{ item.name }}</strong>
                </div>
              </td>
              <td class="variant-cell">
                {{ [item.category, item.size].filter(Boolean).join(' • ') || '—' }}
              </td>
              <td class="stock-number">{{ item.stock }}</td>
              <td class="stock-number">{{ item.sold }}</td>
              <td>
                <em :class="item.stock < LOW_STOCK_THRESHOLD ? 'low' : 'in-stock'">
                  {{ item.stock < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'In Stock' }}
                </em>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    class="edit-btn"
                    aria-label="Edit product"
                    title="Edit"
                    @click="openEdit(item)"
                  >
                    <v-icon icon="mdi-pencil" />
                  </button>
                  <button
                    class="restock"
                    aria-label="Restock product"
                    title="Restock"
                    @click="openRestock(item)"
                  >
                    <v-icon icon="mdi-plus" />
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
            placeholder="Example: Regular, Spicy, Sweet"
            variant="outlined"
            :disabled="saving"
          />

          <v-text-field
            v-model="editForm.size"
            label="Size"
            placeholder="Example: Big or Small"
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
  key: string
  name: string
  category: string
  size: string
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
  Category?: string | null
  Size?: string | null
  Description?: string | null
  Price?: string | number | null
  Stock?: string | number | null
}

type DirectusListResponse = DirectusErrorResponse & {
  data?: DirectusProduct[]
}

type DirectusItemResponse = DirectusErrorResponse & {
  data?: DirectusProduct
}

type DirectusRefreshResponse = DirectusErrorResponse & {
  data?: { access_token: string; refresh_token: string }
}

const emit = defineEmits<{ notice: [message: string] }>()

const API_URL = 'http://localhost:8055'
const LOW_STOCK_THRESHOLD = 30

const LONGGANISA_PRODUCT = 'Tikboy Longganisa'
const EMBUTIDO_PRODUCT = 'Tikboy Embutido'
const CHILI_GARLIC_PRODUCT = 'Crispy Chili Garlic Oil'
const ADD_NEW_PRODUCT = '+ Add New Product'

const productOptions = [
  LONGGANISA_PRODUCT,
  EMBUTIDO_PRODUCT,
  CHILI_GARLIC_PRODUCT,
  ADD_NEW_PRODUCT,
]

const longganisaVariants = [
  'Regular – Big',
  'Regular – Small',
  'Spicy – Big',
  'Spicy – Small',
  'Sweet – Big',
  'Sweet – Small',
]

const embutidoSizes = ['Big', 'Small']

const inventory = ref<InventoryItem[]>([])

const loading = ref(false)
const saving = ref(false)
const showAdd = ref(false)
const showEdit = ref(false)
const restockTarget = ref<string | null>(null)
const restockVariant = ref<string | null>(null)
const newProductName = ref('')
const restockQty = ref('1')

const editForm = ref({
  key: '',
  name: '',
  category: '',
  size: '',
  description: '',
  price: '',
})

const isAddingNewProduct = computed(() => restockTarget.value === ADD_NEW_PRODUCT)

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

function makeInventoryKey(name: string, category: string, size: string) {
  return `${name.trim().toLowerCase()}::${category.trim().toLowerCase()}::${size.trim().toLowerCase()}`
}

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

function mapProductToInventoryItem(product: DirectusProduct): InventoryItem {
  const name = String(product.Name || '').trim()
  const category = String(product.Category || '').trim()
  const size = String(product.Size || '').trim()

  return {
    key: makeInventoryKey(name, category, size),
    name,
    category,
    size,
    description: String(product.Description || ''),
    stock: Number(product.Stock) || 0,
    sold: 0,
    price: Number(product.Price) || 0,
  }
}

function resetAddForm() {
  restockTarget.value = null
  restockVariant.value = null
  newProductName.value = ''
  restockQty.value = '1'
}

function onProductChange() {
  restockVariant.value = null
  newProductName.value = ''
}

function getSelectedProductName() {
  if (restockTarget.value === ADD_NEW_PRODUCT) {
    return newProductName.value.trim()
  }

  return restockTarget.value?.trim() || ''
}

function getSelectedVariant() {
  if (restockTarget.value === LONGGANISA_PRODUCT) {
    if (!restockVariant.value) {
      return { category: '', size: '' }
    }

    const [category, size] = restockVariant.value.split(' – ')
    return {
      category: category?.trim() || '',
      size: size?.trim() || '',
    }
  }

  if (restockTarget.value === EMBUTIDO_PRODUCT) {
    return {
      category: '',
      size: restockVariant.value?.trim() || '',
    }
  }

  return { category: '', size: '' }
}

async function loadInventory() {
  loading.value = true

  try {
    const response = await fetch(
      `${API_URL}/items/Products?fields=id,Name,Category,Size,Description,Price,Stock`,
      { headers: await getHeaders() },
    )

    const result = (await response.json()) as DirectusListResponse

    if (!response.ok) {
      throw new Error(getErrorMessage(result, 'Could not load inventory.'))
    }

    const databaseItems = (result.data || [])
      .filter((product) => product.Name)
      .map(mapProductToInventoryItem)

    inventory.value = databaseItems

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Could not load inventory.'
    emit('notice', message)
  } finally {
    loading.value = false
  }
}

async function findProductInDatabase(
  name: string,
  category: string,
  size: string,
): Promise<DirectusProduct | undefined> {
  const filters = [
    `filter[Name][_eq]=${encodeURIComponent(name)}`,
    category
      ? `filter[Category][_eq]=${encodeURIComponent(category)}`
      : 'filter[Category][_empty]=true',
    size
      ? `filter[Size][_eq]=${encodeURIComponent(size)}`
      : 'filter[Size][_empty]=true',
    'limit=1',
  ]

  const response = await fetch(
    `${API_URL}/items/Products?${filters.join('&')}`,
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

  resetAddForm()
  showAdd.value = true
}

function openRestock(item: InventoryItem) {
  restockTarget.value = item.name
  newProductName.value = ''
  restockQty.value = '1'

  if (item.name === LONGGANISA_PRODUCT) {
    restockVariant.value = item.category && item.size
      ? `${item.category} – ${item.size}`
      : null
  } else if (item.name === EMBUTIDO_PRODUCT) {
    restockVariant.value = item.size || null
  } else {
    restockVariant.value = null
  }

  showAdd.value = true
}

async function saveStock() {
  if (!restockTarget.value) {
    emit('notice', 'Select a product to add.')
    return
  }

  const name = getSelectedProductName()
  const { category, size } = getSelectedVariant()

  if (!name) {
    emit('notice', 'Enter a name for the new product.')
    return
  }

  if (restockTarget.value === LONGGANISA_PRODUCT && (!category || !size)) {
    emit('notice', 'Select a category and size for Tikboy Longganisa.')
    return
  }

  if (restockTarget.value === EMBUTIDO_PRODUCT && !size) {
    emit('notice', 'Select a size for Tikboy Embutido.')
    return
  }

  const qty = Number(restockQty.value)
  if (!qty || qty <= 0) {
    emit('notice', 'Enter a quantity greater than zero.')
    return
  }

  saving.value = true

  try {
    const existing = await findProductInDatabase(name, category, size)

    if (existing) {
      const newStock = (Number(existing.Stock) || 0) + qty

      const response = await fetch(`${API_URL}/items/Products/${existing.id}`, {
        method: 'PATCH',
        headers: await getHeaders(true),
        body: JSON.stringify({ Stock: newStock }),
      })

      const result = (await response.json()) as DirectusItemResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not update stock.'))
      }

      const item = inventory.value.find(
        (entry) => entry.key === makeInventoryKey(name, category, size),
      )

      if (item) {
        item.stock = newStock
      } else {
        inventory.value.push({
          key: makeInventoryKey(name, category, size),
          name,
          category,
          size,
          description: String(existing.Description || ''),
          stock: newStock,
          sold: 0,
          price: Number(existing.Price) || 0,
        })
      }

      emit('notice', `Restocked ${name}${category ? ` (${category}` : ''}${size ? `${category ? ' – ' : ' ('}${size})` : ''} (+${qty}).`)
    } else {
      const productToCreate = {
        Name: name,
        Category: category,
        Size: size,
        Description: '',
        Price: 0,
        Stock: qty,
      }

      const response = await fetch(`${API_URL}/items/Products`, {
        method: 'POST',
        headers: await getHeaders(true),
        body: JSON.stringify(productToCreate),
      })

      const result = (await response.json()) as DirectusItemResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not add the product.'))
      }

      const createdProduct = result.data || {
        id: `${Date.now()}`,
        ...productToCreate,
      }

      const newItem = mapProductToInventoryItem(createdProduct)
      const existingIndex = inventory.value.findIndex((item) => item.key === newItem.key)

      if (existingIndex >= 0) {
        inventory.value[existingIndex] = newItem
      } else {
        inventory.value.push(newItem)
      }

      emit('notice', `Added ${name}${category ? ` (${category}` : ''}${size ? `${category ? ' – ' : ' ('}${size})` : ''} with stock ${qty}.`)
    }

    showAdd.value = false
    resetAddForm()
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Something went wrong while adding stock.'
    emit('notice', message)
  } finally {
    saving.value = false
  }
}

function openEdit(item: InventoryItem) {
  editForm.value = {
    key: item.key,
    name: item.name,
    category: item.category,
    size: item.size,
    description: item.description,
    price: String(item.price),
  }
  showEdit.value = true
}

async function saveEdit() {
  const item = inventory.value.find((entry) => entry.key === editForm.value.key)
  if (!item) {
    emit('notice', 'Product not found.')
    return
  }

  saving.value = true

  try {
    const existing = await findProductInDatabase(item.name, item.category, item.size)
    const payload = {
      Category: editForm.value.category.trim(),
      Size: editForm.value.size.trim(),
      Description: editForm.value.description,
      Price: Number(editForm.value.price) || 0,
    }

    if (existing) {
      const response = await fetch(`${API_URL}/items/Products/${existing.id}`, {
        method: 'PATCH',
        headers: await getHeaders(true),
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as DirectusItemResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not update the product.'))
      }
    } else {
      const response = await fetch(`${API_URL}/items/Products`, {
        method: 'POST',
        headers: await getHeaders(true),
        body: JSON.stringify({
          Name: item.name,
          ...payload,
          Stock: item.stock,
        }),
      })

      const result = (await response.json()) as DirectusItemResponse

      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not create the product.'))
      }
    }

    item.category = payload.Category
    item.size = payload.Size
    item.description = payload.Description
    item.price = payload.Price
    item.key = makeInventoryKey(item.name, item.category, item.size)

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
.inventory-page {
  padding: 39px 35px;
}

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
  grid-template-columns: repeat(2, minmax(180px, 1fr)) auto;
  gap: 16px;
  align-items: center;
}

/* ---- Table: fixed layout + percentage columns so it always fits the panel width ---- */

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}

.col-product {
  width: 32%;
}

.col-variant {
  width: 22%;
}

.col-stock,
.col-sold {
  width: 11%;
}

.col-status {
  width: 13%;
}

.col-actions {
  width: 11%;
}

th {
  height: 50px;
  padding: 0 10px;
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
  padding-left: 24px;
}

th:last-child,
td:last-child {
  padding-right: 24px;
}

th.numeric {
  text-align: center;
}

th.actions-head {
  text-align: right;
}

td {
  padding: 14px 10px;
  border-top: 1px solid #e1e6ec;
  color: #2f496b;
  font-size: 15px;
  vertical-align: middle;
  overflow-wrap: anywhere;
}

tbody tr {
  transition: background 0.12s ease;
}

tbody tr:hover {
  background: #fafbfc;
}

.product {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fde9ed;
  color: #de3043;
  flex-shrink: 0;
}

.product strong {
  color: #071d3c;
  font-size: 16px;
  overflow-wrap: anywhere;
}

.variant-cell {
  color: #4c5f7b;
  font-size: 14px;
}

.stock-number {
  color: #081d3d;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}

em {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
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

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.edit-btn,
.restock {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #d0d9e4;
  border-radius: 10px;
  background: white;
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

.dialog {
  border-radius: 16px;
}

.edit-product-name {
  margin: 0 0 20px;
  color: #071d3c;
  font-size: 18px;
  font-weight: 700;
}

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

  .col-product {
    width: 40%;
  }

  .col-variant {
    width: 24%;
  }

  .col-stock,
  .col-sold {
    width: 10%;
  }

  .col-status {
    display: none;
  }

  th:nth-child(5),
  td:nth-child(5) {
    display: none;
  }

  .col-actions {
    width: 16%;
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

  .col-sold {
    display: none;
  }

  th:nth-child(4),
  td:nth-child(4) {
    display: none;
  }

  .col-variant {
    width: 34%;
  }
}
</style>