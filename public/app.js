/* global state */
const state = {
  products: [],
  deleteTargetId: null,
  deleteTargetName: '',
  editMode: false,
};

/* ---- API helpers ---- */
const api = {
  base: '/api',

  async get(path) {
    const r = await fetch(this.base + path);
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },

  async post(path, body) {
    const r = await fetch(this.base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },

  async put(path, body) {
    const r = await fetch(this.base + path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },

  async patch(path, body) {
    const r = await fetch(this.base + path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },

  async delete(path) {
    const r = await fetch(this.base + path, { method: 'DELETE' });
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  },
};

/* ---- Toast notifications ---- */
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  const icons = { success: '✓', error: '✗', info: '→' };
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span>${icons[type] || '→'}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---- Stats ---- */
async function loadStats() {
  try {
    const s = await api.get('/stats');
    document.getElementById('stat-products').textContent = s.total_products ?? '--';
    document.getElementById('stat-items').textContent = (s.total_items ?? 0).toLocaleString();
    document.getElementById('stat-value').textContent = s.total_value != null
      ? '$' + Number(s.total_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '--';
    document.getElementById('stat-low').textContent = s.low_stock ?? 0;
    document.getElementById('stat-out').textContent = s.out_of_stock ?? 0;
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

/* ---- Categories ---- */
async function loadCategories() {
  try {
    const cats = await api.get('/categories');
    const select = document.getElementById('category-filter');
    const datalist = document.getElementById('category-list');

    // filter dropdown
    const current = select.value;
    select.innerHTML = '<option value="all">ALL</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
    select.value = current && cats.includes(current) ? current : 'all';

    // datalist for form
    datalist.innerHTML = '';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      datalist.appendChild(opt);
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

/* ---- Stock badge ---- */
function stockBadge(qty) {
  if (qty === 0) return '<span class="card-badge badge-out">OUT OF STOCK</span>';
  if (qty <= 10) return '<span class="card-badge badge-low">LOW STOCK</span>';
  return '<span class="card-badge badge-ok">IN STOCK</span>';
}

/* ---- Render product card ---- */
function renderCard(p) {
  const statusClass = p.quantity === 0 ? 'out-of-stock' : p.quantity <= 10 ? 'low-stock' : '';
  return `
    <article class="product-card ${statusClass}" data-id="${p.id}">
      <div class="card-header">
        <div class="card-name-block">
          <div class="card-name" title="${escHtml(p.name)}">${escHtml(p.name)}</div>
          <div class="card-sku">${escHtml(p.sku)}</div>
        </div>
        ${stockBadge(p.quantity)}
      </div>
      <div class="card-body">
        <div class="card-meta">
          <div class="meta-item">
            <div class="meta-label">PRICE</div>
            <div class="meta-value price">$${Number(p.price).toFixed(2)}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">CATEGORY</div>
            <div class="meta-value category">${escHtml(p.category)}</div>
          </div>
        </div>
        ${p.description ? `<div class="card-description" title="${escHtml(p.description)}">${escHtml(p.description)}</div>` : ''}
      </div>
      <div class="card-footer">
        <div class="card-qty-wrap">
          <span class="qty-label">QTY:</span>
          <div class="quantity-control">
            <button class="qty-btn minus" data-id="${p.id}" aria-label="Decrease quantity">−</button>
            <input
              type="number"
              class="qty-display"
              value="${p.quantity}"
              min="0"
              data-id="${p.id}"
              aria-label="Quantity"
            />
            <button class="qty-btn plus" data-id="${p.id}" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn-icon edit" data-id="${p.id}" title="Edit product">✎</button>
          <button class="btn-icon delete" data-id="${p.id}" title="Delete product">✕</button>
        </div>
      </div>
    </article>
  `;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---- Load and render products ---- */
async function loadProducts() {
  const search = document.getElementById('search-input').value.trim();
  const category = document.getElementById('category-filter').value;

  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category && category !== 'all') params.set('category', category);

  try {
    const products = await api.get('/products' + (params.toString() ? '?' + params : ''));
    state.products = products;
    renderProducts(products);
  } catch (err) {
    toast('Failed to load products: ' + err.message, 'error');
  }
}

function renderProducts(products) {
  const grid = document.getElementById('product-grid');
  const empty = document.getElementById('empty-state');

  if (products.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = products.map(renderCard).join('');
  }
}

/* ---- Quantity update ---- */
async function updateQuantity(id, qty) {
  try {
    const updated = await api.patch(`/products/${id}/quantity`, { quantity: qty });
    // update local state and re-render just that card
    const idx = state.products.findIndex(p => p.id === updated.id);
    if (idx !== -1) {
      state.products[idx] = updated;
      const card = document.querySelector(`.product-card[data-id="${id}"]`);
      if (card) {
        const temp = document.createElement('div');
        temp.innerHTML = renderCard(updated);
        card.replaceWith(temp.firstElementChild);
      }
    }
    await loadStats();
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ---- Event delegation on product grid ---- */
document.getElementById('product-grid').addEventListener('click', async (e) => {
  const minusBtn = e.target.closest('.qty-btn.minus');
  const plusBtn = e.target.closest('.qty-btn.plus');
  const editBtn = e.target.closest('.btn-icon.edit');
  const deleteBtn = e.target.closest('.btn-icon.delete');

  if (minusBtn) {
    const id = parseInt(minusBtn.dataset.id, 10);
    const input = document.querySelector(`.qty-display[data-id="${id}"]`);
    const newQty = Math.max(0, parseInt(input.value, 10) - 1);
    input.value = newQty;
    await updateQuantity(id, newQty);
  }

  if (plusBtn) {
    const id = parseInt(plusBtn.dataset.id, 10);
    const input = document.querySelector(`.qty-display[data-id="${id}"]`);
    const newQty = parseInt(input.value, 10) + 1;
    input.value = newQty;
    await updateQuantity(id, newQty);
  }

  if (editBtn) {
    const id = parseInt(editBtn.dataset.id, 10);
    const product = state.products.find(p => p.id === id);
    if (product) openEditModal(product);
  }

  if (deleteBtn) {
    const id = parseInt(deleteBtn.dataset.id, 10);
    const product = state.products.find(p => p.id === id);
    if (product) openDeleteModal(id, product.name);
  }
});

/* Handle manual qty input (blur / enter) */
document.getElementById('product-grid').addEventListener('change', async (e) => {
  if (e.target.classList.contains('qty-display')) {
    const id = parseInt(e.target.dataset.id, 10);
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 0) { e.target.value = 0; return; }
    await updateQuantity(id, val);
  }
});

document.getElementById('product-grid').addEventListener('keydown', async (e) => {
  if (e.target.classList.contains('qty-display') && e.key === 'Enter') {
    e.target.blur();
  }
});

/* ---- Search & filter ---- */
const searchInput = document.getElementById('search-input');
const clearBtn = document.getElementById('clear-search');

let searchTimer;
searchInput.addEventListener('input', () => {
  clearBtn.classList.toggle('visible', searchInput.value.length > 0);
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProducts, 280);
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearBtn.classList.remove('visible');
  loadProducts();
});

document.getElementById('category-filter').addEventListener('change', loadProducts);

/* ---- ADD / EDIT MODAL ---- */
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const formSubmit   = document.getElementById('form-submit');
const formError    = document.getElementById('form-error');

function openAddModal() {
  state.editMode = false;
  modalTitle.textContent = 'ADD PRODUCT';
  formSubmit.textContent = 'SAVE PRODUCT';
  document.getElementById('form-id').value = '';
  document.getElementById('product-form').reset();
  formError.textContent = '';
  clearFormErrors();
  modalOverlay.style.display = 'flex';
  setTimeout(() => document.getElementById('form-name').focus(), 100);
}

function openEditModal(product) {
  state.editMode = true;
  modalTitle.textContent = 'EDIT PRODUCT';
  formSubmit.textContent = 'UPDATE PRODUCT';
  document.getElementById('form-id').value = product.id;
  document.getElementById('form-name').value = product.name;
  document.getElementById('form-sku').value = product.sku;
  document.getElementById('form-category').value = product.category;
  document.getElementById('form-price').value = product.price;
  document.getElementById('form-quantity').value = product.quantity;
  document.getElementById('form-description').value = product.description || '';
  formError.textContent = '';
  clearFormErrors();
  modalOverlay.style.display = 'flex';
  setTimeout(() => document.getElementById('form-name').focus(), 100);
}

function closeModal() {
  modalOverlay.style.display = 'none';
}

document.getElementById('add-btn').addEventListener('click', openAddModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

function clearFormErrors() {
  document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
}

function validateForm() {
  let valid = true;
  const fields = [
    { id: 'form-name', label: 'Product name' },
    { id: 'form-sku', label: 'SKU' },
    { id: 'form-category', label: 'Category' },
    { id: 'form-price', label: 'Price' },
    { id: 'form-quantity', label: 'Quantity' },
  ];
  clearFormErrors();
  for (const f of fields) {
    const el = document.getElementById(f.id);
    if (!el.value.trim()) {
      el.classList.add('error');
      valid = false;
    }
  }
  if (!valid) {
    formError.textContent = 'Please fill in all required fields.';
    return false;
  }
  const price = parseFloat(document.getElementById('form-price').value);
  if (isNaN(price) || price < 0) {
    document.getElementById('form-price').classList.add('error');
    formError.textContent = 'Price must be a valid non-negative number.';
    return false;
  }
  const qty = parseInt(document.getElementById('form-quantity').value, 10);
  if (isNaN(qty) || qty < 0) {
    document.getElementById('form-quantity').classList.add('error');
    formError.textContent = 'Quantity must be a valid non-negative integer.';
    return false;
  }
  return true;
}

document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.textContent = '';
  if (!validateForm()) return;

  const body = {
    name:        document.getElementById('form-name').value.trim(),
    sku:         document.getElementById('form-sku').value.trim(),
    category:    document.getElementById('form-category').value.trim(),
    price:       parseFloat(document.getElementById('form-price').value),
    quantity:    parseInt(document.getElementById('form-quantity').value, 10),
    description: document.getElementById('form-description').value.trim(),
  };

  try {
    formSubmit.disabled = true;
    formSubmit.textContent = 'SAVING...';

    if (state.editMode) {
      const id = document.getElementById('form-id').value;
      await api.put(`/products/${id}`, body);
      toast('Product updated successfully', 'success');
    } else {
      await api.post('/products', body);
      toast('Product added successfully', 'success');
    }

    closeModal();
    await Promise.all([loadProducts(), loadStats(), loadCategories()]);
  } catch (err) {
    formError.textContent = err.message;
    toast(err.message, 'error');
  } finally {
    formSubmit.disabled = false;
    formSubmit.textContent = state.editMode ? 'UPDATE PRODUCT' : 'SAVE PRODUCT';
  }
});

/* ---- DELETE MODAL ---- */
const deleteOverlay = document.getElementById('delete-overlay');

function openDeleteModal(id, name) {
  state.deleteTargetId = id;
  state.deleteTargetName = name;
  document.getElementById('delete-product-name').textContent = name;
  deleteOverlay.style.display = 'flex';
}

function closeDeleteModal() {
  deleteOverlay.style.display = 'none';
  state.deleteTargetId = null;
}

document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
deleteOverlay.addEventListener('click', (e) => { if (e.target === deleteOverlay) closeDeleteModal(); });

document.getElementById('delete-confirm').addEventListener('click', async () => {
  if (!state.deleteTargetId) return;
  const btn = document.getElementById('delete-confirm');
  btn.disabled = true;
  btn.textContent = 'DELETING...';
  try {
    await api.delete(`/products/${state.deleteTargetId}`);
    toast(`"${state.deleteTargetName}" deleted`, 'success');
    closeDeleteModal();
    await Promise.all([loadProducts(), loadStats(), loadCategories()]);
  } catch (err) {
    toast(err.message, 'error');
    closeDeleteModal();
  } finally {
    btn.disabled = false;
    btn.textContent = 'DELETE';
  }
});

/* ---- Keyboard shortcuts ---- */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (deleteOverlay.style.display !== 'none') { closeDeleteModal(); return; }
    if (modalOverlay.style.display !== 'none') { closeModal(); return; }
  }
});

/* ---- Init ---- */
async function init() {
  await Promise.all([loadProducts(), loadStats(), loadCategories()]);
}

init();
