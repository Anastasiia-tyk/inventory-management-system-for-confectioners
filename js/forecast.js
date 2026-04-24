// ═══════════════════════════════════════════════════
// js/forecast.js — прогнозування закупівель
// ═══════════════════════════════════════════════════

import { getProdLogs, getProducts, getIngredients, getInventory } from './database.js';

// Горизонт зберігається локально в модулі (не в database.js)
let currentHorizon = 7;

export function setHorizon(days, btn) {
    currentHorizon = days;
    document.querySelectorAll('.horizon-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderForecast();
}

export function renderForecast() {
    const horizon   = currentHorizon;
    const logs      = getProdLogs().filter(l => l.confirmed);
    const products  = getProducts();
    const ings      = getIngredients();
    const inventory = getInventory();
    const container = document.getElementById('forecast-cards');

    const dataDays = new Set(logs.map(l => l.date)).size;
    document.getElementById('forecast-days-info').textContent = `Горизонт: ${horizon} днів`;
    document.getElementById('data-days-info').textContent =
        `Дані: ${dataDays} ${dataDays===1?'день':dataDays<5?'дні':'днів'}`;
    document.getElementById('accuracy-info').textContent =
        `Точність: ${dataDays>=30?'Висока':dataDays>=7?'Середня':'Базова'}`;

    if (logs.length === 0 || ings.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--choco-400)">
            <div style="font-size:2.5rem;margin-bottom:1rem">📊</div>
            <h3 style="font-family:var(--font-display);color:var(--choco-500)">Недостатньо даних</h3>
            <p>Почніть щоденно вносити виробництво — прогноз стане доступним після першого підтвердження</p>
        </div>`;
        return;
    }

    const avgConsumption = {};
    ings.forEach(i => { avgConsumption[i.id] = 0; });
    const activeDays = Math.max(1, dataDays);
    logs.forEach(log => {
        log.items.forEach(item => {
            const prod = products.find(p => p.id === item.prodId);
            if (!prod) return;
            prod.recipe.forEach(r => {
                avgConsumption[r.ingId] = (avgConsumption[r.ingId]||0) + r.qty * item.qty;
            });
        });
    });
    Object.keys(avgConsumption).forEach(id => { avgConsumption[id] /= activeDays; });

    const forecasts = ings.map(ing => {
        const avgDaily   = avgConsumption[ing.id] || 0;
        const needed     = avgDaily * horizon * 1.3;
        const inStock    = inventory.find(i => i.ingId === ing.id)?.qty || 0;
        const toBuy      = Math.max(0, needed - inStock);
        const confidence = dataDays>=30?5:dataDays>=14?4:dataDays>=7?3:dataDays>=3?2:1;
        return { ing, avgDaily, needed, inStock, toBuy, confidence };
    }).filter(f => f.avgDaily > 0 || f.inStock < f.ing.min);

    if (forecasts.length === 0) {
        container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--choco-400)">
            <div style="font-size:2rem;margin-bottom:.5rem">✅</div>
            <h3 style="font-family:var(--font-display);color:var(--choco-500)">Всі запаси в нормі</h3>
            <p>Закупівлі не потрібні на найближчі ${horizon} днів</p>
        </div>`;
        return;
    }

    container.innerHTML = forecasts.sort((a,b) => b.toBuy - a.toBuy).map((f, idx) => {
        const isUrgent = f.inStock < f.ing.min;
        const dots = Array.from({length:5},(_,i)=>`<span class="${i<f.confidence?'filled':''}"></span>`).join('');
        return `<div class="forecast-card ${isUrgent?'urgent':''}" style="animation-delay:${idx*.04}s">
            <div class="fc-header">
                <div>
                    <div class="fc-name">${f.ing.name}</div>
                    <div class="fc-unit">${f.ing.unit} / одиниця</div>
                </div>
                ${isUrgent?'<span class="tag danger">⚠️ Терміново</span>':'<span class="tag ok">✓ Планово</span>'}
            </div>
            <div class="fc-numbers">
                <div class="fc-num"><div class="label">Залишок</div><div class="value">${f.inStock.toFixed(1)}</div></div>
                <div class="fc-num"><div class="label">Ср. на день</div><div class="value">${f.avgDaily.toFixed(2)}</div></div>
                <div class="fc-num"><div class="label">Потреба</div><div class="value">${f.needed.toFixed(1)}</div></div>
                <div class="fc-num"><div class="label">Закупити</div>
                    <div class="value buy">${f.toBuy>0?f.toBuy.toFixed(2):'—'}</div>
                </div>
            </div>
            <div class="fc-confidence">
                Впевненість прогнозу:
                <div class="confidence-dots">${dots}</div>
                (${dataDays} дн. даних)
            </div>
        </div>`;
    }).join('');
}