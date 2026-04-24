// ═══════════════════════════════════════════════════
// js/products.js — сторінка продуктів та лічильник
// ═══════════════════════════════════════════════════

import {
    getProducts, setProducts,
    getIngredients,
    getInventory, setInventory,
    getProdLogs, setProdLogs,
    getInvLogs, setInvLogs,
} from './database.js';
import { toast }               from './toast.js';
import { openModal, closeModal } from './modal-helpers.js';
import { updateNotifications } from './notifications.js';

// ── Рендер сітки продуктів ───────────────────────────
export function renderProducts() {
    const products = getProducts();
    const ings     = getIngredients();
    const grid     = document.getElementById('products-grid');
    updateTodayLabel();
    updateNotifications();

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🍰</div>
                <h3>Поки немає продуктів</h3>
                <p>Натисніть «Додати продукт» щоб розпочати</p>
            </div>`;
        return;
    }

    grid.innerHTML = products.map((p, idx) => {
        const recipeRows = p.recipe.map(r => {
            const ing = ings.find(i => i.id === r.ingId);
            return `<li>
                <span class="ing-name">${ing ? ing.name : r.ingId}</span>
                <span class="ing-qty">${r.qty} ${r.unit}</span>
            </li>`;
        }).join('');

        return `
            <div class="product-card" style="animation-delay:${idx * .05}s">
                <div class="card-header">
                    <div>
                        <h3>${p.name}</h3>
                        <div style="font-size:.78rem;color:var(--choco-400);margin-top:.2rem">
                            ${p.recipe.length} інгредієнт${p.recipe.length === 1 ? '' : 'ів'} у рецепті
                        </div>
                    </div>
                    <span class="card-icon">${p.icon}</span>
                </div>
                <div class="card-body">
                    <ul class="recipe-list">${recipeRows}</ul>
                    <div class="counter-section">
                        <div>
                            <div class="counter-label">Виготовлено сьогодні</div>
                        </div>
                        <div class="counter-controls">
                            <button class="counter-btn" onclick="window.app.adjustCounter('${p.id}', -1)">−</button>
                            <input class="counter-value" type="number" id="counter-${p.id}"
                                value="0" min="0" oninput="window.app.updateTodayLabel()">
                            <button class="counter-btn" onclick="window.app.adjustCounter('${p.id}', 1)">+</button>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-secondary" onclick="window.app.editProduct('${p.id}')">✏️ Ред.</button>
                    <button class="btn-danger"    onclick="window.app.deleteProduct('${p.id}')">🗑</button>
                </div>
            </div>`;
    }).join('');
}

// ── Лічильник ────────────────────────────────────────
export function adjustCounter(prodId, delta) {
    const input = document.getElementById('counter-' + prodId);
    input.value = Math.max(0, (parseInt(input.value) || 0) + delta);
    updateTodayLabel();
}

export function updateTodayLabel() {
    const products = getProducts();
    let total = 0;
    products.forEach(p => {
        const el = document.getElementById('counter-' + p.id);
        if (el) total += parseInt(el.value) || 0;
    });

    const labelEl = document.getElementById('today-label');
    if (labelEl) labelEl.textContent = `Сьогодні: ${total} виробів`;

    const dateEl = document.getElementById('today-date');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

// ── Підтвердження дня ────────────────────────────────
export function confirmDay() {
    const products  = getProducts();
    const ings      = getIngredients();
    const inventory = getInventory();

    const items = [];
    products.forEach(p => {
        const el  = document.getElementById('counter-' + p.id);
        const qty = parseInt(el?.value) || 0;
        if (qty > 0) items.push({ prodId: p.id, qty });
    });

    if (items.length === 0) { toast('Жоден лічильник не встановлено', 'info'); return; }

    // Обчислюємо списання
    const deductions = {};
    items.forEach(item => {
        const prod = products.find(p => p.id === item.prodId);
        if (!prod) return;
        prod.recipe.forEach(r => {
            deductions[r.ingId] = (deductions[r.ingId] || 0) + r.qty * item.qty;
        });
    });

    // Попередній перегляд у модалі
    const preview = document.getElementById('deduction-preview');
    preview.innerHTML = '';
    Object.entries(deductions).forEach(([ingId, qty]) => {
        const ing       = ings.find(i => i.id === ingId);
        if (!ing) return;
        const inv       = inventory.find(i => i.ingId === ingId);
        const remaining = (inv ? inv.qty : 0) - qty;
        const warn      = remaining < ing.min
            ? `⚠️ буде нижче мінімуму (${ing.min} ${ing.unit})` : '';
        preview.innerHTML += `
            <li>
                <span class="d-name">${ing.name}</span>
                <span>
                    <span class="d-qty">−${qty.toFixed(2)} ${ing.unit}</span>
                    ${warn ? `<br><span class="d-warn">${warn}</span>` : ''}
                </span>
            </li>`;
    });

    window._pendingItems      = items;
    window._pendingDeductions = deductions;
    openModal('confirm-modal');
}

export function applyDayConfirmation() {
    const items      = window._pendingItems;
    const deductions = window._pendingDeductions;
    const ings       = getIngredients();
    const inventory  = getInventory();
    const invLogs    = getInvLogs();
    const today      = new Date().toISOString().split('T')[0];

    Object.entries(deductions).forEach(([ingId, qty]) => {
        const inv = inventory.find(i => i.ingId === ingId);
        const ing = ings.find(i => i.id === ingId);
        if (!inv) return;
        inv.qty       = Math.max(0, inv.qty - qty);
        inv.todayUsed = (inv.todayUsed || 0) + qty;
        invLogs.push({
            id: 'il' + Date.now() + Math.random(),
            date: today, ingId, ingName: ing?.name || ingId,
            type: 'deduction', qty: -qty, qtyAfter: inv.qty, note: 'Виробництво'
        });
    });
    setInventory(inventory);
    setInvLogs(invLogs.slice(-100));

    const logs = getProdLogs();
    logs.push({ id: 'log' + Date.now(), date: today, items, confirmed: true, createdAt: new Date().toISOString() });
    setProdLogs(logs);

    getProducts().forEach(p => {
        const el = document.getElementById('counter-' + p.id);
        if (el) el.value = 0;
    });

    closeModal('confirm-modal');
    updateTodayLabel();
    updateNotifications();
    toast('✓ Виробництво підтверджено! Склад оновлено.', 'success');
}

// ── Видалення продукту ───────────────────────────────
export function deleteProduct(id) {
    if (!confirm('Видалити цей продукт?')) return;
    setProducts(getProducts().filter(p => p.id !== id));
    renderProducts();
    toast('Продукт видалено', 'info');
}