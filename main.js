import { seedDemoData } from './js/demo-data.js';
import { getCurrentUser } from './js/database.js';
import { initApp, login, register, logout, switchAuthTab } from './js/auth.js';
import { showPage } from './js/navigation.js';
import {
    renderProducts,
    adjustCounter,
    updateTodayLabel,
    confirmDay,
    applyDayConfirmation,
    deleteProduct,
}                        from './js/products.js';
import {
    openProductModal,
    editProduct,
    addRecipeRow,
    saveProduct,
}                              from './js/product-modal.js';
import {
    renderInventory,
    openIngModal,
    saveIngredient,
    deleteIngredient,
    quickAdjust,
    openRestockModal,
    saveRestock,
}                              from './js/inventory.js';
import { updateNotifications } from './js/notifications.js';
import { setHorizon, renderForecast } from './js/forecast.js';
import { renderStats }         from './js/statistics.js';
import { openModal, closeModal, initModalOverlays } from './js/modal-helpers.js';
import { toast }               from './js/toast.js';
 
// ── Прив'язка до window.app ──────────────────────────
// Усі функції, що викликаються з HTML (onclick, onchange, oninput),
// мають бути доступні глобально через window.app
window.app = {
    // Auth
    switchAuthTab, login, register, logout,
 
    // Navigation
    showPage,
 
    // Products
    adjustCounter, updateTodayLabel, confirmDay, applyDayConfirmation, deleteProduct,
 
    // Product modal
    openProductModal, editProduct, addRecipeRow, saveProduct,
 
    // Inventory
    openIngModal, saveIngredient, deleteIngredient, quickAdjust, openRestockModal, saveRestock,
 
    // Forecast
    setHorizon,
 
    // Stats
    renderStats,
 
    // Modals
    openModal, closeModal,
 
    // Toast
    toast,
};
 
// ── Ініціалізація після завантаження DOM ─────────────
document.addEventListener('DOMContentLoaded', () => {
    initModalOverlays();
    seedDemoData();

    const savedUser = getCurrentUser();
    if (savedUser && savedUser.id) {
        initApp(savedUser);
    } else {
        document.getElementById('login-email').value    = 'manager@test.com';
        document.getElementById('login-password').value = '123456';
    }
});