/* ============================================================
   PERSONAL LEARNING DASHBOARD - UI HELPERS
   Escape helpers, badge builders, toasts, modals
   ============================================================ */

const UI = {
  esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  },

  impBadge(imp) {
    const m = window.LD.IMPORTANCE_META[imp] || window.LD.IMPORTANCE_META[window.LD.IMPORTANCE.IMPORTANT];
    const cls = imp === window.LD.IMPORTANCE.MUST ? 'badge-yellow'
      : imp === window.LD.IMPORTANCE.IMPORTANT ? 'badge-blue' : 'badge-gray';
    return `<span class="badge ${cls}" title="${window.LD.esc(m.label)}">${m.icon} ${window.LD.esc(m.label)}</span>`;
  },

  statusBadge(st) {
    const m = window.LD.STATUS_META[st] || window.LD.STATUS_META[window.LD.STATUS.NOT_STARTED];
    const cls = {
      not_started: 'badge-gray',
      learning: 'badge-yellow',
      practiced: 'badge-blue',
      tested: 'badge-green',
      mastered: 'badge-purple'
    }[st] || 'badge-gray';
    return `<span class="badge ${cls}">${m.icon} ${m.label}</span>`;
  },

  programStatBadge(st) {
    const cls = {
      'In Progress': 'badge-blue',
      'Completed': 'badge-green',
      'Overdue': 'badge-red',
      'Not Started': 'badge-gray'
    }[st] || 'badge-gray';
    return `<span class="badge ${cls}">${window.LD.esc(st)}</span>`;
  },

  deadlineBadge(d) {
    const cls = {
      ontrack: 'badge-green',
      ahead_ish: 'badge-orange',
      behind: 'badge-red',
      critical: 'badge-red',
      overdue: 'badge-red',
      done: 'badge-green'
    }[d.key] || 'badge-gray';
    return `<span class="badge ${cls}">${d.icon} ${window.LD.esc(d.label)}</span>`;
  },

  progLink(p) {
    if (!p) return '';
    return `<a class="text-muted" data-nav-to="programs" data-prog="${window.LD.esc(p.id)}" style="text-decoration:underline;cursor:pointer">${window.LD.esc(p.name)}</a>`;
  }
};

// Also expose UI text helpers on LD (used throughout app.js)
if (window.LD) {
  window.LD.esc = UI.esc;
  window.LD.impBadge = UI.impBadge;
  window.LD.statusBadge = UI.statusBadge;
  window.LD.programStatBadge = UI.programStatBadge;
  window.LD.deadlineBadge = UI.deadlineBadge;
  window.LD.progLink = UI.progLink;
}

/* ---------- Toast ---------- */
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

window.showToast = showToast;

/* ---------- Modal ---------- */
function openModal(title, bodyHTML, footerHTML) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog">
      <div class="modal-header">
        <h2>${window.LD.esc(title)}</h2>
        <button class="modal-close" data-close>✕</button>
      </div>
      <div class="modal-body">${bodyHTML || ''}</div>
      ${footerHTML ? `<div class="mt-16 flex-between modal-footer" style="justify-content:flex-end">${footerHTML}</div>` : ''}
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('[data-close]').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  return overlay;
}

function closeModal(overlay) {
  if (overlay) overlay.remove();
}

window.openModal = openModal;
window.closeModal = closeModal;
