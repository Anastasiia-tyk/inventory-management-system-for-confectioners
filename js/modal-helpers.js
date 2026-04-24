// ═══════════════════════════════════════════════════
// js/modal-helpers.js — відкриття/закриття модалів
// ═══════════════════════════════════════════════════

export function openModal(id) {
    document.getElementById(id).classList.add('open');
    document.body.style.overflow = 'hidden';
}

export function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    document.body.style.overflow = '';
}

// Закрити модаль по кліку на підложку
export function initModalOverlays() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeModal(overlay.id);
        });
    });
}