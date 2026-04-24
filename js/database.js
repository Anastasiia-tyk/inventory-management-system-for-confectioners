// ═══════════════════════════════════════════════════
// js/database.js — сховище даних (localStorage)
// ═══════════════════════════════════════════════════

const DB = {
    get(key)        { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
    set(key, val)   { localStorage.setItem(key, JSON.stringify(val)); },
    getObj(key)     { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } },
    setObj(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
};

export const getUsers         = ()  => DB.get('pat_users');
export const setUsers         = (v) => DB.set('pat_users', v);
export const getProducts      = ()  => DB.get('pat_products');
export const setProducts      = (v) => DB.set('pat_products', v);
export const getIngredients   = ()  => DB.get('pat_ingredients');
export const setIngredients   = (v) => DB.set('pat_ingredients', v);
export const getInventory     = ()  => DB.get('pat_inventory');
export const setInventory     = (v) => DB.set('pat_inventory', v);
export const getProdLogs      = ()  => DB.get('pat_prod_logs');
export const setProdLogs      = (v) => DB.set('pat_prod_logs', v);
export const getInvLogs       = ()  => DB.get('pat_inv_logs');
export const setInvLogs       = (v) => DB.set('pat_inv_logs', v);
export const getPurchaseLogs  = ()  => DB.get('pat_purchase_logs');
export const setPurchaseLogs  = (v) => DB.set('pat_purchase_logs', v);
export const getCurrentUser   = ()  => DB.getObj('pat_current_user');
export const setCurrentUser   = (v) => DB.setObj('pat_current_user', v);

// Глобальний стан застосунку
export let forecastHorizon = 7;
export const setForecastHorizon = (v) => { forecastHorizon = v; };

export let chartInstances = {};