// ═══════════════════════════════════════════════════
// js/toast.js — сповіщення-тости
// ═══════════════════════════════════════════════════

export function toast(msg, type = 'info') {
    const container = document.getElementById('toast');
    const el        = document.createElement('div');
    el.className    = `toast-item ${type}`;
    el.textContent  = msg;
    container.appendChild(el);
    setTimeout(() => {
        el.style.cssText += 'opacity:0;transform:translateX(20px);transition:all .3s';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}