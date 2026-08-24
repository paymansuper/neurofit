// ===== Visuelle Effekte: Konfetti & Toast-Benachrichtigungen =====
// Kein Audio – nur Augenschmaus. Respektiert prefers-reduced-motion.
import { t, L } from './i18n.js';

const COLORS = ['#4f6df5', '#22a06b', '#e8a13c', '#d64550', '#8b5cf6', '#d946ef', '#06b6d4'];
const SHAPES = ['▪', '●', '★', '▲'];

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Konfetti-Regen über den ganzen Bildschirm. */
export function confetti(count = 90) {
  if (reducedMotion()) return;
  const wrap = document.createElement('div');
  wrap.className = 'confetti-wrap';
  wrap.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'confetti-piece';
    p.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    p.style.fontSize = 0.6 + Math.random() * 1.1 + 'rem';
    p.style.animationDelay = Math.random() * 0.8 + 's';
    p.style.animationDuration = 2.2 + Math.random() * 1.8 + 's';
    p.style.setProperty('--drift', (Math.random() * 16 - 8) + 'vw');
    p.style.setProperty('--spin', (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540) + 'deg');
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4800);
}

/** Kleines Konfetti nur um ein Element herum (z. B. richtige Antwort). */
export function sparkle(el, count = 14) {
  if (reducedMotion() || !el || !el.isConnected) return;
  const rect = el.getBoundingClientRect();
  const wrap = document.createElement('div');
  wrap.className = 'sparkle-wrap';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.left = rect.left + rect.width / 2 + 'px';
  wrap.style.top = rect.top + rect.height / 2 + 'px';
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'sparkle-piece';
    s.textContent = '✦';
    s.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const angle = (i / count) * Math.PI * 2;
    const dist = 34 + Math.random() * 42;
    s.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    s.style.animationDelay = Math.random() * 0.1 + 's';
    wrap.appendChild(s);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1200);
}

/** Toast unten rechts – für Achievements & Meilensteine. Stapelbar. */
export function toast(html, { duration = 4200 } = {}) {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    stack.setAttribute('role', 'status');
    stack.setAttribute('aria-live', 'polite');
    document.body.appendChild(stack);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = html;
  stack.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => { t.remove(); if (!stack.children.length) stack.remove(); }, 350);
  }, duration);
}

/** Zeigt frisch freigeschaltete Abzeichen als Toasts + Konfetti. */
export function celebrateAchievements(unlocked) {
  if (!unlocked.length) return;
  confetti(60);
  unlocked.forEach((a, i) => {
    setTimeout(() => toast(
      `<span class="toast-emoji">${a.emoji}</span>
       <span><strong>${t('toast.badge')}</strong><br>${L(a.name)} – ${L(a.desc)}</span>`
    ), i * 700);
  });
}
