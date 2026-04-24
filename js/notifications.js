// ═══════════════════════════════════════════════════
// js/notifications.js — сповіщення про мінімум запасів
// ═══════════════════════════════════════════════════

import { getIngredients, getInventory } from './database.js';

export function updateNotifications() {
    const ings      = getIngredients();
    const inventory = getInventory();
    const bar       = document.getElementById('notif-bar');
    const badge     = document.getElementById('low-badge');

    const low = ings.filter(i => {
        const inv = inventory.find(iv => iv.ingId === i.id);
        return inv && inv.qty < i.min;
    });

    if (bar) {
        bar.innerHTML = low.map(i => {
            const inv = inventory.find(iv => iv.ingId === i.id);
            return `<div class="notif">
                <strong>${i.name}</strong>: залишок ${inv.qty.toFixed(1)} ${i.unit}
                — нижче мінімуму ${i.min} ${i.unit}!
            </div>`;
        }).join('');
    }

    if (badge) {
        badge.textContent = low.length;
        badge.classList.toggle('hidden', low.length === 0);
    }
}