<template>
  <section class="inventory-page">
    <div class="inventory-stats">
      <article v-for="stat in stats" :key="stat.label" class="stat-card">
        <p>{{ stat.label }}</p>
        <strong :class="stat.color">{{ stat.value }}</strong>
      </article>
    </div>

    <article class="inventory-panel">
      <header class="panel-header">
        <h2>Inventory Status</h2>
        <button class="add-stock-btn" :class="{ active: showAdd }" @click="toggleAdd">
          <v-icon :icon="showAdd ? 'mdi-close' : 'mdi-plus'" />
          {{ showAdd ? 'Close' : 'Add Stock' }}
        </button>
      </header>

      <v-expand-transition>
        <section v-if="showAdd" class="add-panel">
          <div class="add-panel-header">
            <div>
              <h3>Add Stock</h3>
              <p>Select an existing product variant to restock, or create a new product.</p>
            </div>
            <button class="close-button" aria-label="Close add stock form" @click="showAdd = false">
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
            />

            <v-btn color="primary" variant="flat" :loading="saving" @click="saveStock">
              <v-icon icon="mdi-content-save" start />
              Add Stock
            </v-btn>
          </div>
        </section>
      </v-expand-transition>

      <v-progress-linear v-if="loading" color="primary" indeterminate />

      <div class="table-wrap">
        <table>
          <colgroup>
            <col class="col-product" />
            <col class="col-stock" />
            <col class="col-sold" />
            <col class="col-status" />
            <col class="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>Product</th>
              <th class="numeric">Stock</th>
              <th class="numeric">Sold</th>
              <th>Status</th>
              <th class="actions-head">Actions</th>
            </tr>
          </thead>

          <tbody v-for="group in groupedInventory" :key="group.key">
            <tr
              class="product-group-row"
              :class="{ clickable: group.hasVariants }"
              @click="group.hasVariants && toggleProductGroup(group.key)"
            >
              <td>
                <div class="product-summary">
                  <button
                    v-if="group.hasVariants"
                    class="expand-button"
                    :aria-label="`${isProductGroupOpen(group.key) ? 'Collapse' : 'Expand'} ${group.name}`"
                    @click.stop="toggleProductGroup(group.key)"
                  >
                    <v-icon :icon="isProductGroupOpen(group.key) ? 'mdi-chevron-down' : 'mdi-chevron-right'" />
                  </button>
                  <span v-else class="expand-button-placeholder" />

                  <span class="product-icon">
                    <img
                      v-if="group.image"
                      :src="group.image"
                      :alt="group.name"
                      class="product-image"
                    />
                    <v-icon v-else icon="mdi-cube-outline" />
                  </span>

                  <span>
                    <strong>{{ group.name }}</strong>
                    <small v-if="group.hasVariants">{{ group.items.length }} variants</small>
                  </span>
                </div>
              </td>
              <td class="stock-number">{{ group.totalStock }}</td>
              <td class="stock-number">{{ group.totalSold }}</td>
              <td>
                <em :class="group.hasLowStock ? 'low' : 'in-stock'">
                  {{ group.hasLowStock ? 'Low Stock' : 'In Stock' }}
                </em>
              </td>
              <td>
                <div v-if="!group.hasVariants" class="row-actions">
                  <button class="icon-button edit-btn" aria-label="Edit product" title="Edit" @click.stop="openEdit(group.items[0])">
                    <v-icon icon="mdi-pencil" />
                  </button>
                  <button class="icon-button restock-btn" aria-label="Restock product" title="Restock" @click.stop="openRestock(group.items[0])">
                    <v-icon icon="mdi-plus" />
                  </button>
                </div>
              </td>
            </tr>

            <template v-if="group.hasVariants && isProductGroupOpen(group.key)">
              <tr v-for="item in group.items" :key="item.id" class="variant-row">
                <td>
                  <div class="variant-name">
                    <span class="variant-branch">↳</span>
                    <span v-if="item.category" class="variant-pill category-pill">{{ item.category }}</span>
                    <span v-if="item.size" class="variant-pill size-pill">{{ item.size }}</span>
                  </div>
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
                    <button class="icon-button edit-btn" aria-label="Edit product variant" title="Edit" @click="openEdit(item)">
                      <v-icon icon="mdi-pencil" />
                    </button>
                    <button class="icon-button restock-btn" aria-label="Restock product variant" title="Restock" @click="openRestock(item)">
                      <v-icon icon="mdi-plus" />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </article>

    <v-dialog v-model="showEdit" max-width="480">
      <v-card class="dialog">
        <v-card-title>Edit Product</v-card-title>
        <v-card-text>
          <p class="edit-product-name">{{ editForm.name }}</p>

          <v-file-input
            v-model="editForm.imageFile"
            label="Product Image"
            accept="image/png,image/jpeg,image/webp"
            prepend-icon="mdi-image-outline"
            variant="outlined"
            show-size
            :disabled="saving"
            @update:model-value="previewSelectedImage"
          />

          <div v-if="imagePreviewUrl" class="image-preview">
            <img :src="imagePreviewUrl" alt="Selected product preview" />
          </div>

          <v-text-field v-model="editForm.category" label="Category" placeholder="Example: Regular, Spicy, Sweet" variant="outlined" :disabled="saving" />
          <v-text-field v-model="editForm.size" label="Size" placeholder="Example: Big or Small" variant="outlined" :disabled="saving" />
          <v-textarea v-model="editForm.description" label="Description" placeholder="Describe the product" variant="outlined" rows="3" :disabled="saving" />
          <v-text-field v-model="editForm.price" label="Price" type="number" prefix="₱" step="0.01" min="0" variant="outlined" :disabled="saving" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="closeEdit">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="saveEdit">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

type ProductRow = {
  id: string
  name: string
  category: string
  size: string
  description: string
  price: number
  stock: number
  sold: number
  image: string | null
  is_bestseller: boolean
}

type SupabaseProduct = {
  id: string
  name: string
  category: string | null
  size: string | null
  description: string | null
  price: number | string | null
  stock: number | null
  sold: number | null
  image: string | null
  is_bestseller: boolean | null
}

const emit = defineEmits<{ notice: [message: string] }>()

const LOW_STOCK_THRESHOLD = 30
const IMAGE_BUCKET = 'product-images'
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

const inventory = ref<ProductRow[]>([])
const expandedProductGroups = ref<string[]>([])
const loading = ref(false)
const saving = ref(false)
const showAdd = ref(false)
const showEdit = ref(false)
const restockTarget = ref<string | null>(null)
const restockVariant = ref<string | null>(null)
const restockProductId = ref<string | null>(null)
const newProductName = ref('')
const restockQty = ref('1')
const imagePreviewUrl = ref('')

const editForm = ref({
  id: '',
  name: '',
  category: '',
  size: '',
  description: '',
  price: '',
  image: null as string | null,
  imageFile: null as File | File[] | null,
})

const isAddingNewProduct = computed(() => restockTarget.value === ADD_NEW_PRODUCT)

const groupedInventory = computed(() => {
  const groups = new Map<string, ProductRow[]>()

  for (const item of inventory.value) {
    const normalizedName = normalizeText(item.name)
    const items = groups.get(normalizedName) || []
    items.push(item)
    groups.set(normalizedName, items)
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    name: items[0].name,
    image: items.find((item) => item.image)?.image || null,
    items: [...items].sort((a, b) => `${a.category} ${a.size}`.localeCompare(`${b.category} ${b.size}`)),
    hasVariants: items.length > 1,
    totalStock: items.reduce((sum, item) => sum + item.stock, 0),
    totalSold: items.reduce((sum, item) => sum + item.sold, 0),
    hasLowStock: items.some((item) => item.stock < LOW_STOCK_THRESHOLD),
  }))
})

const stats = computed(() => {
  const totalProducts = inventory.value.length
  const lowStock = inventory.value.filter((item) => item.stock > 0 && item.stock < LOW_STOCK_THRESHOLD).length
  const outOfStock = inventory.value.filter((item) => item.stock <= 0).length
  const totalValue = inventory.value.reduce((sum, item) => sum + item.price * item.stock, 0)

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

function normalizeText(value: string | null | undefined) {
  return (value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function isEmptyVariant(value: string) {
  return !normalizeText(value)
}

function isProductGroupOpen(key: string) {
  return expandedProductGroups.value.includes(key)
}

function toggleProductGroup(key: string) {
  expandedProductGroups.value = isProductGroupOpen(key)
    ? expandedProductGroups.value.filter((group) => group !== key)
    : [...expandedProductGroups.value, key]
}

function resetAddForm() {
  restockProductId.value = null
  restockTarget.value = null
  restockVariant.value = null
  newProductName.value = ''
  restockQty.value = '1'
}

function toggleAdd() {
  if (showAdd.value) {
    showAdd.value = false
    return
  }

  resetAddForm()
  showAdd.value = true
}

function onProductChange() {
  restockProductId.value = null
  restockVariant.value = null
  newProductName.value = ''
}

function getSelectedProductName() {
  return restockTarget.value === ADD_NEW_PRODUCT
    ? newProductName.value.trim()
    : restockTarget.value?.trim() || ''
}

function getSelectedVariant() {
  if (restockTarget.value === LONGGANISA_PRODUCT) {
    const [category = '', size = ''] = (restockVariant.value || '').split(' – ')
    return { category: category.trim(), size: size.trim() }
  }

  if (restockTarget.value === EMBUTIDO_PRODUCT) {
    return { category: '', size: restockVariant.value?.trim() || '' }
  }

  return { category: '', size: '' }
}

function formatProductLabel(name: string, category: string, size: string) {
  const variant = [category, size].filter(Boolean).join(' – ')
  return variant ? `${name} (${variant})` : name
}

function mapProduct(row: SupabaseProduct): ProductRow {
  return {
    id: row.id,
    name: row.name,
    category: row.category || '',
    size: row.size || '',
    description: row.description || '',
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    sold: Number(row.sold) || 0,
    image: row.image || null,
    is_bestseller: Boolean(row.is_bestseller),
  }
}

async function loadInventory() {
  loading.value = true

  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, size, description, price, stock, sold, image, is_bestseller')
      .order('name')

    if (error) throw error
    inventory.value = ((data || []) as SupabaseProduct[]).map(mapProduct)
  } catch (error: unknown) {
    emit('notice', error instanceof Error ? error.message : 'Could not load inventory.')
  } finally {
    loading.value = false
  }
}

function findLoadedProduct(name: string, category: string, size: string) {
  return inventory.value.find((item) =>
    normalizeText(item.name) === normalizeText(name) &&
    normalizeText(item.category) === normalizeText(category) &&
    normalizeText(item.size) === normalizeText(size),
  )
}

async function findProductInDatabase(name: string, category: string, size: string) {
  // First use the local list. This prevents different null/empty-string storage
  // formats from causing an unintended INSERT during a normal restock.
  const loaded = findLoadedProduct(name, category, size)
  if (loaded) return loaded

  let query = supabase
    .from('products')
    .select('id, name, category, size, description, price, stock, sold, image, is_bestseller')
    .ilike('name', name.trim())

  if (isEmptyVariant(category)) {
    query = query.or('category.is.null,category.eq.')
  } else {
    query = query.eq('category', category.trim())
  }

  if (isEmptyVariant(size)) {
    query = query.or('size.is.null,size.eq.')
  } else {
    query = query.eq('size', size.trim())
  }

  const { data, error } = await query.limit(1).maybeSingle()
  if (error) throw error

  return data ? mapProduct(data as SupabaseProduct) : null
}

function openRestock(item: ProductRow) {
  restockProductId.value = item.id

  restockTarget.value = item.name
  restockQty.value = '1'
  newProductName.value = ''

  if (normalizeText(item.name) === normalizeText(LONGGANISA_PRODUCT)) {
    restockVariant.value =
      item.category && item.size
        ? `${item.category} – ${item.size}`
        : null
  } else if (normalizeText(item.name) === normalizeText(EMBUTIDO_PRODUCT)) {
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
  const qty = Number(restockQty.value)

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

  if (!Number.isInteger(qty) || qty <= 0) {
    emit('notice', 'Enter a whole quantity greater than zero.')
    return
  }

  saving.value = true

  try {
    /*
      CASE 1:
      User clicked the + button on a specific existing inventory row.
      Update that exact row by its id.
    */
    if (restockProductId.value) {
      const existing = inventory.value.find(
        (item) => item.id === restockProductId.value,
      )

      if (!existing) {
        throw new Error('The selected product could not be found.')
      }

      const newStock = existing.stock + qty

      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', existing.id)

      if (error) throw error

      emit(
        'notice',
        `Restocked ${formatProductLabel(
          existing.name,
          existing.category,
          existing.size,
        )} (+${qty}).`,
      )
    } else {
      /*
        CASE 2:
        Product was selected from the Add Stock dropdown.
        Look for an existing matching product before inserting.
      */
      const existing = await findProductInDatabase(name, category, size)

      if (existing) {
        const newStock = existing.stock + qty

        const { error } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', existing.id)

        if (error) throw error

        emit(
          'notice',
          `Restocked ${formatProductLabel(
            existing.name,
            existing.category,
            existing.size,
          )} (+${qty}).`,
        )
      } else {
        /*
          CASE 3:
          No matching row exists, so create a new product.
        */
        const { error } = await supabase.from('products').insert({
          name: name.trim(),
          category: category || null,
          size: size || null,
          description: '',
          price: 0,
          stock: qty,
          sold: 0,
          image: null,
          is_bestseller: false,
        })

        if (error) throw error

        emit(
          'notice',
          `Added ${formatProductLabel(name, category, size)} with stock ${qty}.`,
        )
      }
    }

    await loadInventory()
    showAdd.value = false
    resetAddForm()
  } catch (error: unknown) {
    console.error('Save stock failed:', error)

    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong while adding stock.'

    emit('notice', message)
  } finally {
    saving.value = false
  }
}

function clearImagePreview() {
  if (imagePreviewUrl.value.startsWith('blob:')) URL.revokeObjectURL(imagePreviewUrl.value)
  imagePreviewUrl.value = ''
}

function previewSelectedImage(fileValue: File | File[] | null) {
  const file = Array.isArray(fileValue) ? fileValue[0] : fileValue
  clearImagePreview()
  imagePreviewUrl.value = file ? URL.createObjectURL(file) : editForm.value.image || ''
}

function getSelectedImageFile() {
  return Array.isArray(editForm.value.imageFile)
    ? editForm.value.imageFile[0]
    : editForm.value.imageFile
}

async function uploadProductImage(file: File, productId: string) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${productId}/product.${extension}`

  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type,
  })

  if (error) throw error
  return `${supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`
}

function openEdit(item: ProductRow) {
  clearImagePreview()
  editForm.value = {
    id: item.id,
    name: item.name,
    category: item.category,
    size: item.size,
    description: item.description,
    price: String(item.price),
    image: item.image,
    imageFile: null,
  }
  imagePreviewUrl.value = item.image || ''
  showEdit.value = true
}

function closeEdit() {
  clearImagePreview()
  showEdit.value = false
}

async function saveEdit() {
  const item = inventory.value.find((entry) => entry.id === editForm.value.id)
  if (!item) {
    emit('notice', 'Product not found.')
    return
  }

  saving.value = true

  try {
    let imageUrl = editForm.value.image
    const imageFile = getSelectedImageFile()
    if (imageFile) imageUrl = await uploadProductImage(imageFile, item.id)

    const { error } = await supabase
      .from('products')
      .update({
        category: editForm.value.category.trim() || null,
        size: editForm.value.size.trim() || null,
        description: editForm.value.description,
        price: Number(editForm.value.price) || 0,
        image: imageUrl,
      })
      .eq('id', item.id)

    if (error) throw error

    await loadInventory()
    closeEdit()
    emit('notice', `Updated ${item.name}.`)
  } catch (error: unknown) {
    emit('notice', error instanceof Error ? error.message : 'Something went wrong while saving.')
  } finally {
    saving.value = false
  }
}

onMounted(loadInventory)
</script>

<style scoped>
/* Page */
.inventory-page {
  padding: 40px 36px;
}

/* Summary cards */
.inventory-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  margin-bottom: 36px;
}

.stat-card {
  min-height: 132px;
  padding: 28px;
  border: 1px solid #e0e5ec;
  border-radius: 18px;
  background: #fff;
}

.stat-card p {
  margin: 0 0 10px;
  color: #355173;
  font-size: 16px;
}

.stat-card strong {
  color: #071d3c;
  font-size: 36px;
}

.stat-card .orange { color: #f04b00; }
.stat-card .red { color: #e60000; }

/* Main panel */
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
  padding: 28px 30px;
  border-bottom: 1px solid #e1e6ec;
}

.panel-header h2 {
  margin: 0;
  color: #071d3c;
  font-size: 24px;
}

.add-stock-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 0 17px;
  border: 0;
  border-radius: 10px;
  background: #d92e40;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.add-stock-btn:hover { background: #c22636; }
.add-stock-btn.active { background: #b32231; }

/* Add stock form */
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

/* Table */
.table-wrap { overflow-x: auto; }

table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  table-layout: fixed;
}

.col-product { width: 48%; }
.col-stock,
.col-sold { width: 12%; }
.col-status { width: 16%; }
.col-actions { width: 12%; }

th {
  height: 52px;
  padding: 0 12px;
  border-bottom: 1px solid #e1e6ec;
  background: #fafbfc;
  color: #7c8ba1;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

th:first-child,
td:first-child { padding-left: 28px; }

th:last-child,
td:last-child { padding-right: 28px; }

th.numeric,
th.actions-head { text-align: center; }

td {
  padding: 14px 12px;
  border-top: 1px solid #e8ecf1;
  color: #2f496b;
  font-size: 15px;
  vertical-align: middle;
}

.product-group-row.clickable { cursor: pointer; }
.product-group-row:hover { background: #f8fafc; }
.variant-row td { background: #fcfdff; }
.variant-row:hover td { background: #f5f8fb; }

/* Product and variant labels */
.product-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

.product-summary strong {
  display: block;
  color: #071d3c;
  font-size: 16px;
}

.product-summary small {
  display: block;
  margin-top: 2px;
  color: #7c8ba1;
  font-size: 12px;
}

.product-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border-radius: 10px;
  background: #fde9ed;
  color: #de3043;
  flex: 0 0 40px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.expand-button,
.expand-button-placeholder {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
}

.expand-button {
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #536277;
  cursor: pointer;
}

.expand-button:hover { background: #e9eef5; }

.variant-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 36px;
}

.variant-branch {
  color: #a2afbf;
  font-size: 18px;
}

.variant-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.category-pill {
  background: #fde9ed;
  color: #c3293b;
}

.size-pill {
  background: #e9f1ff;
  color: #315d99;
}

/* Numbers, status, buttons */
.stock-number {
  color: #081d3d;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}

em {
  display: inline-flex;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  white-space: nowrap;
}

.low {
  background: #fff7be;
  color: #d48900;
}

.in-stock {
  background: #d8fae5;
  color: #008f3e;
}

.row-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.icon-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #d0d9e4;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
}

.edit-btn { color: #355173; }
.edit-btn:hover { background: #f2f4f7; }
.restock-btn { border-color: #f3c9ce; color: #d92e40; }
.restock-btn:hover { background: #fdebed; border-color: #d92e40; }

/* Dialog */
.dialog { border-radius: 16px; }
.edit-product-name {
  margin: 0 0 20px;
  color: #071d3c;
  font-size: 18px;
  font-weight: 700;
}

.image-preview {
  width: 100%;
  height: 180px;
  margin: -4px 0 20px;
  overflow: hidden;
  border: 1px solid #e0e5ec;
  border-radius: 12px;
  background: #fafbfc;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@media (max-width: 960px) {
  .inventory-page { padding: 28px; }
  .inventory-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .add-form { grid-template-columns: 1fr; }
}

@media (max-width: 580px) {
  .inventory-page { padding: 18px 14px; }
  .inventory-stats { grid-template-columns: 1fr; gap: 16px; }
  .panel-header,
  .add-panel { padding-left: 18px; padding-right: 18px; }
  .panel-header h2 { font-size: 21px; }
}
</style>
