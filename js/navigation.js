// ═══════════════════════════════════════════════════
// js/navigation.js — перемикання між сторінками
// ═══════════════════════════════════════════════════

import { renderProducts }  from './products.js';
import { renderInventory } from './inventory.js';
import { renderForecast }  from './forecast.js';
import { renderStats }     from './statistics.js';

export function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    document.getElementById('nav-'  + page).classList.add('active');

    if (page === 'products')  renderProducts();
    if (page === 'inventory') renderInventory();
    if (page === 'forecast')  renderForecast();
    if (page === 'stats')     renderStats();
}