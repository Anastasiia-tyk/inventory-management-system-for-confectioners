// ═══════════════════════════════════════════════════
// js/inventory.js — сторінка складу
// ═══════════════════════════════════════════════════

import {
    getIngredients, setIngredients,
    getInventory, setInventory,
    getInvLogs, setInvLogs,
    getPurchaseLogs, setPurchaseLogs,
} from './database.js';
import { toast }               from './toast.js';
import { openModal, closeModal } from './modal-helpers.js';
import { updateNotifications } from './notifications.js';

// ── Рендер сторінки складу ───────────────────────────
export function renderInventory() {
    const ings      = getIngredients();
    const inventory = getInventory();
    const invLogs   = getInvLogs();

    // Статистичні картки
    const total = ings.length;
    const low   = ings.filter(i => {
        const inv = inventory.find(iv => iv.ingId === i.id);
        return inv && inv.qty < i.min;
    }).length;

    document.getElementById('inv-stats-cards').innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Всього інгредієнтів</div>
            <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card ok">
            <div class="stat-label">Нормальний рівень</div>
            <div class="stat-value">${total - low}</div>
        </div>
        <div class="stat-card warning">
            <div class="stat-label">Потребують закупівлі</div>
            <div class="stat-value">${low}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Витрачено сьогодні</div>
            <div class="stat-value">
                ${inventory.reduce((s, i) => s + (i.todayUsed || 0), 0).toFixed(1)}
            </div>
        </div>`;

    // Таблиця залишків
    const tbody = document.getElementById('inv-tbody');
    if (ings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"
            style="text-align:center;padding:2rem;color:var(--choco-400)">
            Склад порожній. Додайте інгредієнти.</td></tr>`;
    } else {
        tbody.innerHTML = ings.map(ing => {
            const inv   = inventory.find(i => i.ingId === ing.id) || { qty: 0, todayUsed: 0 };
            const pct   = Math.min(100, Math.round((inv.qty / Math.max(ing.min * 3, inv.qty + 1)) * 100));
            const level = inv.qty < ing.min ? 'danger' : inv.qty < ing.min * 1.5 ? 'warn' : 'ok';
            const tag   = level === 'danger' ? '⚠️ Критично' : level === 'warn' ? '⚡ Мало' : '✓ Норма';
            return `
                <tr>
                    <td><strong>${ing.name}</strong></td>
                    <td class="qty-cell">${inv.qty.toFixed(2)} ${ing.unit}</td>
                    <td style="color:var(--choco-400)">${ing.min} ${ing.unit}</td>
                    <td>
                        <div class="progress-wrap">
                            <div class="progress-bar">
                                <div class="progress-fill ${level}" style="width:${pct}%"></div>
                            </div>
                            <span style="font-size:.75rem;color:var(--choco-400);white-space:nowrap">${pct}%</span>
                        </div>
                    </td>
                    <td style="color:var(--choco-400)">${(inv.todayUsed || 0).toFixed(2)} ${ing.unit}</td>
                    <td><span class="tag ${level}">${tag}</span></td>
                    <td>
                        <div class="flex gap-sm">
                            <button class="btn-secondary"
                                style="padding:.35rem .7rem;font-size:.78rem"
                                onclick="window.app.quickAdjust('${ing.id}')">±</button>
                            <button class="btn-danger"
                                onclick="window.app.deleteIngredient('${ing.id}')">🗑</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    // Журнал змін
    const logTbody  = document.getElementById('log-tbody');
    const recentLogs = [...invLogs].reverse().slice(0, 20);
    logTbody.innerHTML = recentLogs.length === 0
        ? `<tr><td colspan="5"
            style="text-align:center;padding:1.5rem;color:var(--choco-400)">
            Журнал порожній</td></tr>`
        : recentLogs.map(l => `
            <tr>
                <td style="color:var(--choco-400);font-size:.82rem">${l.date}</td>
                <td>${l.ingName}</td>
                <td><span class="tag ${l.type === 'deduction' ? 'warn' : 'ok'}">
                    ${l.type === 'deduction' ? 'Списання' : l.type === 'restock' ? 'Поповнення' : 'Коригування'}
                </span></td>
                <td style="font-weight:700;color:${l.qty < 0 ? '#c0392b' : '#27ae60'}">
                    ${l.qty > 0 ? '+' : ''}${l.qty.toFixed(2)}
                </td>
                <td class="qty-cell">${l.qtyAfter.toFixed(2)}</td>
            </tr>`).join('');
}

// ── Модаль: додати інгредієнт ────────────────────────
export function openIngModal() {
    document.getElementById('ing-modal-title').textContent = 'Новий інгредієнт';
    ['im-name', 'im-qty', 'im-min'].forEach(id => {
        document.getElementById(id).value = '';
    });
    openModal('ing-modal');
}

export function saveIngredient() {
    const name = document.getElementById('im-name').value.trim();
    const qty  = parseFloat(document.getElementById('im-qty').value);
    const unit = document.getElementById('im-unit').value;
    const min  = parseFloat(document.getElementById('im-min').value) || 0;

    if (!name || isNaN(qty)) { toast('Заповніть назву та кількість', 'error'); return; }

    const id   = 'i' + Date.now();
    const ings = getIngredients();
    ings.push({ id, name, unit, qty, min });
    setIngredients(ings);

    const inventory = getInventory();
    inventory.push({ ingId: id, qty, todayUsed: 0 });
    setInventory(inventory);

    closeModal('ing-modal');
    renderInventory();
    updateNotifications();
    toast('Інгредієнт додано', 'success');
}

export function deleteIngredient(id) {
    if (!confirm('Видалити цей інгредієнт?')) return;
    setIngredients(getIngredients().filter(i => i.id !== id));
    setInventory(getInventory().filter(i => i.ingId !== id));
    renderInventory();
    toast('Інгредієнт видалено', 'info');
}

// ── Ручне коригування залишку ────────────────────────
export function quickAdjust(ingId) {
    const ing   = getIngredients().find(i => i.id === ingId);
    if (!ing) return;
    const inv   = getInventory().find(i => i.ingId === ingId);
    const delta = parseFloat(
        prompt(`Коригування "${ing.name}" (поточний: ${inv?.qty || 0} ${ing.unit})\nВведіть зміну (наприклад, +5 або -2):`)
    );
    if (isNaN(delta)) return;

    const inventory = getInventory();
    const item      = inventory.find(i => i.ingId === ingId);
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    setInventory(inventory);

    const invLogs = getInvLogs();
    invLogs.push({
        id: 'il' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        ingId, ingName: ing.name, type: 'correction',
        qty: delta, qtyAfter: item.qty, note: 'Ручне коригування'
    });
    setInvLogs(invLogs.slice(-100));

    renderInventory();
    updateNotifications();
    toast('Залишок скориговано', 'success');
}

// ── Модаль: поповнення складу ────────────────────────
export function openRestockModal() {
    const ings    = getIngredients();
    const inv     = getInventory();
    const select  = document.getElementById('rs-ing');
    select.innerHTML = ings.map(i => {
        const stock = inv.find(iv => iv.ingId === i.id)?.qty || 0;
        return `<option value="${i.id}">${i.name} (${stock} ${i.unit})</option>`;
    }).join('');
    document.getElementById('rs-qty').value      = '';
    document.getElementById('rs-supplier').value = '';
    openModal('restock-modal');
}

export function saveRestock() {
    const ingId    = document.getElementById('rs-ing').value;
    const qty      = parseFloat(document.getElementById('rs-qty').value);
    const supplier = document.getElementById('rs-supplier').value.trim() || 'Невідомо';

    if (!ingId || isNaN(qty) || qty <= 0) { toast('Заповніть поля коректно', 'error'); return; }

    const inventory = getInventory();
    const item      = inventory.find(i => i.ingId === ingId);
    const ing       = getIngredients().find(i => i.id === ingId);
    if (!item) return;

    item.qty += qty;
    setInventory(inventory);

    const today    = new Date().toISOString().split('T')[0];
    const invLogs  = getInvLogs();
    invLogs.push({
        id: 'il' + Date.now(), date: today,
        ingId, ingName: ing?.name || ingId,
        type: 'restock', qty: +qty, qtyAfter: item.qty,
        note: `Постачальник: ${supplier}`
    });
    setInvLogs(invLogs.slice(-100));

    const purchaseLogs = getPurchaseLogs();
    purchaseLogs.push({
        id: 'pl' + Date.now(), date: today,
        ingId, ingName: ing?.name || ingId,
        qty, unit: ing?.unit || '', supplier,
        createdAt: new Date().toISOString()
    });
    setPurchaseLogs(purchaseLogs.slice(-200));

    closeModal('restock-modal');
    renderInventory();
    updateNotifications();
    toast(`✓ Поповнено: +${qty} ${ing?.unit}`, 'success');
}