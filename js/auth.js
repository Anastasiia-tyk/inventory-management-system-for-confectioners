// ═══════════════════════════════════════════════════
// js/auth.js — автентифікація користувача
// ═══════════════════════════════════════════════════

import {
    getUsers, setUsers,
    getCurrentUser, setCurrentUser,
    getInventory, setInventory,
} from './database.js';
import { toast }               from './toast.js';
import { showPage }            from './navigation.js';
import { updateTodayLabel }    from './products.js';
import { updateNotifications } from './notifications.js';

export function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach((t, i) => {
        t.classList.toggle('active',
            (tab === 'login' && i === 0) || (tab === 'register' && i === 1)
        );
    });
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', tab !== 'register');
}

export function login() {
    const email = document.getElementById('login-email').value.trim();
    const pass  = document.getElementById('login-password').value;
    if (!email || !pass) { toast('Заповніть всі поля', 'error'); return; }

    const user = getUsers().find(u => u.email === email && u.password === pass);
    if (!user) { toast('Невірний email або пароль', 'error'); return; }

    setCurrentUser(user);
    initApp(user);
}

export function register() {
    const name  = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pass  = document.getElementById('reg-password').value;
    const role  = document.getElementById('reg-role').value;

    if (!name || !email || !pass) { toast('Заповніть всі поля', 'error'); return; }
    if (pass.length < 6) { toast('Пароль мінімум 6 символів', 'error'); return; }

    const users = getUsers();
    if (users.find(u => u.email === email)) { toast('Email вже зареєстрований', 'error'); return; }

    const newUser = {
        id: 'u' + Date.now(), name, email,
        password: pass, role, createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    toast('Реєстрація успішна! Ласкаво просимо!', 'success');
    initApp(newUser);
}

export function logout() {
    setCurrentUser({});
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app').classList.remove('visible');
    document.getElementById('login-email').value    = '';
    document.getElementById('login-password').value = '';
}

export function initApp(user) {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').classList.add('visible');

    const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    document.getElementById('user-avatar').textContent       = initials;
    document.getElementById('user-name-display').textContent = user.name;

    // Скидаємо денний лічильник витрат
    const inventory = getInventory();
    inventory.forEach(i => { i.todayUsed = 0; });
    setInventory(inventory);

    showPage('products');
    updateTodayLabel();
    updateNotifications();
}