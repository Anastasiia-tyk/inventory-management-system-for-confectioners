// ═══════════════════════════════════════════════════
// js/product-modal.js — модаль додавання/редагування продукту
// ═══════════════════════════════════════════════════

import { getProducts, setProducts, getIngredients } from './database.js';
import { toast }                from './toast.js';
import { openModal, closeModal } from './modal-helpers.js';
import { renderProducts }       from './products.js';

let editingProductId = null;

export function openProductModal(productId = null) {
    editingProductId = productId;
    document.getElementById('product-modal-title').textContent =
        productId ? 'Редагувати продукт' : 'Новий продукт';

    // Очищаємо рядки рецептури (крім заголовку)
    const builder = document.getElementById('recipe-builder');
    builder.querySelectorAll('.recipe-row:not(:first-child)').forEach(r => r.remove());

    if (productId) {
        const p = getProducts().find(p => p.id === productId);
        if (p) {
            document.getElementById('pm-name').value = p.name;
            document.getElementById('pm-icon').value = p.icon;
            p.recipe.forEach(r => addRecipeRow(r));
        }
    } else {
        document.getElementById('pm-name').value = '';
        addRecipeRow();
        addRecipeRow();
    }
    openModal('product-modal');
}

export function editProduct(id) { openProductModal(id); }

export function addRecipeRow(data = null) {
    const ings    = getIngredients();
    const builder = document.getElementById('recipe-builder');
    const row     = document.createElement('div');
    row.className = 'recipe-row';

    const ingOptions = ings.map(i =>
        `<option value="${i.id}" ${data && data.ingId === i.id ? 'selected' : ''}>${i.name}</option>`
    ).join('');

    row.innerHTML = `
        <select style="width:100%">
            <option value="">— оберіть —</option>
            ${ingOptions}
        </select>
        <input type="number" placeholder="0" min="0.01" step="0.01"
            value="${data ? data.qty : ''}" style="width:80px">
        <select style="width:60px">
            <option ${data && data.unit === 'кг' ? 'selected' : ''}>кг</option>
            <option ${data && data.unit === 'г'  ? 'selected' : ''}>г</option>
            <option ${data && data.unit === 'л'  ? 'selected' : ''}>л</option>
            <option ${data && data.unit === 'мл' ? 'selected' : ''}>мл</option>
            <option ${data && data.unit === 'шт' ? 'selected' : ''}>шт</option>
        </select>
        <button onclick="this.closest('.recipe-row').remove()"
            style="width:28px;height:28px;border:none;background:var(--beige-100);
                   border-radius:var(--radius-sm);cursor:pointer;color:var(--choco-400);
                   font-size:.9rem;transition:var(--transition)"
            onmouseover="this.style.background='var(--beige-200)'"
            onmouseout="this.style.background='var(--beige-100)'">✕</button>`;
    builder.appendChild(row);
}

export function saveProduct() {
    const name = document.getElementById('pm-name').value.trim();
    const icon = document.getElementById('pm-icon').value;
    if (!name) { toast('Введіть назву продукту', 'error'); return; }

    const builder    = document.getElementById('recipe-builder');
    const recipeRows = builder.querySelectorAll('.recipe-row:not(:first-child)');
    const recipe     = [];

    recipeRows.forEach(row => {
        const [ingSelect, qtyInput, unitSelect] = row.querySelectorAll('select, input');
        if (ingSelect.value && parseFloat(qtyInput.value) > 0) {
            recipe.push({ ingId: ingSelect.value, qty: parseFloat(qtyInput.value), unit: unitSelect.value });
        }
    });
    if (recipe.length === 0) { toast('Додайте хоча б один інгредієнт', 'error'); return; }

    const products = getProducts();
    if (editingProductId) {
        const idx = products.findIndex(p => p.id === editingProductId);
        if (idx !== -1) products[idx] = { ...products[idx], name, icon, recipe };
    } else {
        products.push({ id: 'p' + Date.now(), name, icon, recipe });
    }
    setProducts(products);
    closeModal('product-modal');
    renderProducts();
    toast(editingProductId ? 'Продукт оновлено' : 'Продукт додано', 'success');
}