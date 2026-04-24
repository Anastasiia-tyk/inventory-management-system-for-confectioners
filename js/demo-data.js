// ═══════════════════════════════════════════════════
// js/demo-data.js — початкові демо-дані
// ═══════════════════════════════════════════════════

import {
    getUsers, setUsers,
    getIngredients, setIngredients,
    setInventory,
    setProducts,
    setProdLogs,
    setInvLogs,
} from './database.js';

export function seedDemoData() {
    if (getUsers().length > 0) return;

    setUsers([{
        id: 'u1', name: 'Олена Коваль',
        email: 'manager@test.com', password: '123456',
        role: 'manager', createdAt: new Date().toISOString()
    }]);

    const ings = [
        { id: 'i1',  name: 'Борошно пшеничне',  unit: 'кг',  qty: 15.0, min: 5   },
        { id: 'i2',  name: 'Цукор',              unit: 'кг',  qty: 10.0, min: 3   },
        { id: 'i3',  name: 'Масло вершкове',     unit: 'кг',  qty: 8.0,  min: 2   },
        { id: 'i4',  name: 'Яйця курячі',        unit: 'шт',  qty: 120,  min: 30  },
        { id: 'i5',  name: 'Молоко',             unit: 'л',   qty: 12.0, min: 3   },
        { id: 'i6',  name: 'Вершки 33%',         unit: 'л',   qty: 6.0,  min: 2   },
        { id: 'i7',  name: 'Какао-порошок',      unit: 'кг',  qty: 3.0,  min: 1   },
        { id: 'i8',  name: 'Шоколад чорний',     unit: 'кг',  qty: 4.0,  min: 1   },
        { id: 'i9',  name: 'Розпушувач',         unit: 'г',   qty: 500,  min: 100 },
        { id: 'i10', name: 'Ванільний екстракт', unit: 'мл',  qty: 200,  min: 50  },
    ];
    setIngredients(ings);
    setInventory(ings.map(i => ({ ingId: i.id, qty: i.qty, todayUsed: 0 })));

    setProducts([
        {
            id: 'p1', name: 'Торт Наполеон', icon: '🎂',
            recipe: [
                { ingId: 'i1', qty: 0.35, unit: 'кг' },
                { ingId: 'i2', qty: 0.20, unit: 'кг' },
                { ingId: 'i3', qty: 0.25, unit: 'кг' },
                { ingId: 'i4', qty: 3,    unit: 'шт' },
                { ingId: 'i5', qty: 0.40, unit: 'л'  },
            ]
        },
        {
            id: 'p2', name: 'Шоколадний брауні', icon: '🍫',
            recipe: [
                { ingId: 'i8', qty: 0.10, unit: 'кг' },
                { ingId: 'i3', qty: 0.08, unit: 'кг' },
                { ingId: 'i2', qty: 0.12, unit: 'кг' },
                { ingId: 'i4', qty: 2,    unit: 'шт' },
                { ingId: 'i7', qty: 0.03, unit: 'кг' },
            ]
        },
        {
            id: 'p3', name: 'Профітролі (15 шт)', icon: '🍰',
            recipe: [
                { ingId: 'i1', qty: 0.15, unit: 'кг' },
                { ingId: 'i3', qty: 0.08, unit: 'кг' },
                { ingId: 'i4', qty: 4,    unit: 'шт' },
                { ingId: 'i6', qty: 0.20, unit: 'л'  },
            ]
        },
        {
            id: 'p4', name: 'Ванільний бісквіт', icon: '🧁',
            recipe: [
                { ingId: 'i1',  qty: 0.20, unit: 'кг'  },
                { ingId: 'i2',  qty: 0.18, unit: 'кг'  },
                { ingId: 'i4',  qty: 5,    unit: 'шт'  },
                { ingId: 'i9',  qty: 5,    unit: 'г'   },
                { ingId: 'i10', qty: 5,    unit: 'мл'  },
            ]
        },
    ]);

    // Демо-записи виробництва за останні 14 днів
    const logs  = [];
    const today = new Date();
    for (let d = 13; d >= 1; d--) {
        const date    = new Date(today);
        date.setDate(date.getDate() - d);
        const dateStr = date.toISOString().split('T')[0];
        const items   = [
            { prodId: 'p1', qty: Math.floor(Math.random() * 4) + 1 },
            { prodId: 'p2', qty: Math.floor(Math.random() * 8) + 2 },
            { prodId: 'p3', qty: Math.floor(Math.random() * 6) + 2 },
            { prodId: 'p4', qty: Math.floor(Math.random() * 4) + 1 },
        ].filter(() => Math.random() > 0.2);
        if (items.length > 0) {
            logs.push({ id: 'log' + d, date: dateStr, items, confirmed: true, createdAt: date.toISOString() });
        }
    }
    setProdLogs(logs);

    // Демо-журнал складу
    const invLogs = [];
    for (let d = 10; d >= 1; d--) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        invLogs.push({
            id: 'il' + d,
            date: date.toISOString().split('T')[0],
            ingId: 'i1', ingName: 'Борошно пшеничне',
            type: 'deduction', qty: -1.5, qtyAfter: 15 - d * 0.3,
            note: 'Виробництво'
        });
    }
    setInvLogs(invLogs);
}