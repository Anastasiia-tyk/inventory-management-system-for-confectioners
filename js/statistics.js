// ═══════════════════════════════════════════════════
// js/statistics.js — сторінка статистики (Chart.js)
// ═══════════════════════════════════════════════════

import {
    getProdLogs,
    getProducts,
    getIngredients,
    getInventory,
    getPurchaseLogs,
    chartInstances,
} from './database.js';

const CHART_COLORS = [
    '#7a5230', '#a0714f', '#c48c10', '#e0a830', '#f0c96e',
    '#5c3a1e', '#3d2310', '#dfc9a3', '#ecdcc0', '#f5ead8'
];

function destroyChart(id) {
    if (chartInstances[id]) { chartInstances[id].destroy(); delete chartInstances[id]; }
}

export function renderStats() {
    const range     = parseInt(document.getElementById('stats-range').value);
    const cutoff    = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const logs      = getProdLogs().filter(l => l.confirmed && l.date >= cutoffStr);
    const products  = getProducts();
    const ings      = getIngredients();
    const inventory = getInventory();
    const purLogs   = getPurchaseLogs().filter(l => l.date >= cutoffStr);

    // Chart 1 — Рейтинг продуктів (стовпчастий)
    destroyChart('chart-products');
    const prodTotals = {};
    logs.forEach(log => log.items.forEach(item => {
        const name = products.find(p => p.id === item.prodId)?.name || item.prodId;
        prodTotals[name] = (prodTotals[name] || 0) + item.qty;
    }));
    const sortedProds = Object.entries(prodTotals).sort((a, b) => b[1] - a[1]);

    chartInstances['chart-products'] = new Chart(
        document.getElementById('chart-products').getContext('2d'),
        {
            type: 'bar',
            data: {
                labels: sortedProds.map(([k]) => k),
                datasets: [{
                    data: sortedProds.map(([, v]) => v),
                    backgroundColor: CHART_COLORS.slice(0, sortedProds.length),
                    borderRadius: 6, borderSkipped: false
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(160,113,79,.1)' }, ticks: { color: '#7a5230' } },
                    x: { grid: { display: false },               ticks: { color: '#7a5230' } }
                },
                responsive: true, maintainAspectRatio: false
            }
        }
    );

    // Chart 2 — Витрати інгредієнтів (кільцева)
    destroyChart('chart-consumption');
    const ingConsumption = {};
    logs.forEach(log => log.items.forEach(item => {
        const prod = products.find(p => p.id === item.prodId);
        if (!prod) return;
        prod.recipe.forEach(r => {
            const name = ings.find(i => i.id === r.ingId)?.name || r.ingId;
            ingConsumption[name] = (ingConsumption[name] || 0) + r.qty * item.qty;
        });
    }));
    const sortedIngs = Object.entries(ingConsumption).sort((a, b) => b[1] - a[1]).slice(0, 5);

    chartInstances['chart-consumption'] = new Chart(
        document.getElementById('chart-consumption').getContext('2d'),
        {
            type: 'doughnut',
            data: {
                labels: sortedIngs.map(([k]) => k),
                datasets: [{
                    data: sortedIngs.map(([, v]) => +v.toFixed(2)),
                    backgroundColor: CHART_COLORS.slice(0, 5),
                    borderWidth: 2, borderColor: '#fefaf4'
                }]
            },
            options: {
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#7a5230', padding: 12 } }
                },
                responsive: true, maintainAspectRatio: false, cutout: '65%'
            }
        }
    );

    // Chart 3 — Динаміка виробництва (лінійний)
    destroyChart('chart-daily');
    const dailyTotals = {};
    logs.forEach(log => {
        dailyTotals[log.date] = (dailyTotals[log.date] || 0) + log.items.reduce((s, i) => s + i.qty, 0);
    });
    const sortedDays = Object.entries(dailyTotals).sort((a, b) => a[0].localeCompare(b[0]));

    chartInstances['chart-daily'] = new Chart(
        document.getElementById('chart-daily').getContext('2d'),
        {
            type: 'line',
            data: {
                labels: sortedDays.map(([d]) => d),
                datasets: [{
                    label: 'Виробів', data: sortedDays.map(([, v]) => v),
                    borderColor: '#a0714f', backgroundColor: 'rgba(160,113,79,.1)',
                    fill: true, tension: .4,
                    pointBackgroundColor: '#e0a830', pointBorderColor: '#a0714f', pointRadius: 4
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(160,113,79,.1)' }, ticks: { color: '#7a5230' } },
                    x: { grid: { display: false },               ticks: { color: '#7a5230', maxTicksLimit: 10 } }
                },
                responsive: true, maintainAspectRatio: false
            }
        }
    );

    // Chart 4 — Закупівлі (стовпчастий)
    destroyChart('chart-purchases');
    const purTotals = {};
    purLogs.forEach(l => { purTotals[l.ingName] = (purTotals[l.ingName] || 0) + l.qty; });
    const sortedPur = Object.entries(purTotals).sort((a, b) => b[1] - a[1]);

    chartInstances['chart-purchases'] = new Chart(
        document.getElementById('chart-purchases').getContext('2d'),
        {
            type: 'bar',
            data: {
                labels: sortedPur.length ? sortedPur.map(([k]) => k) : ['Немає даних'],
                datasets: [{
                    data: sortedPur.length ? sortedPur.map(([, v]) => v) : [0],
                    backgroundColor: '#c48c10', borderRadius: 6, borderSkipped: false
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(160,113,79,.1)' }, ticks: { color: '#7a5230' } },
                    x: { grid: { display: false },               ticks: { color: '#7a5230' } }
                },
                responsive: true, maintainAspectRatio: false
            }
        }
    );

    // Chart 5 — Стан складу (горизонтальний)
    destroyChart('chart-stock');
    chartInstances['chart-stock'] = new Chart(
        document.getElementById('chart-stock').getContext('2d'),
        {
            type: 'bar',
            data: {
                labels: ings.map(i => i.name),
                datasets: [
                    {
                        label: 'Залишок',
                        data: ings.map(i => inventory.find(iv => iv.ingId === i.id)?.qty || 0),
                        backgroundColor: ings.map(i => {
                            const qty = inventory.find(iv => iv.ingId === i.id)?.qty || 0;
                            return qty < i.min ? '#e74c3c' : qty < i.min * 1.5 ? '#e0a830' : '#27ae60';
                        }),
                        borderRadius: 4
                    },
                    {
                        label: 'Мінімум',
                        data: ings.map(i => i.min),
                        backgroundColor: 'rgba(160,113,79,.2)', borderRadius: 4
                    }
                ]
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#7a5230' } }
                },
                scales: {
                    x: { grid: { color: 'rgba(160,113,79,.1)' }, ticks: { color: '#7a5230' } },
                    y: { grid: { display: false },               ticks: { color: '#7a5230', font: { size: 11 } } }
                },
                responsive: true, maintainAspectRatio: false
            }
        }
    );
}