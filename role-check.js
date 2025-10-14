// role-check.js
import { supabase, getUserRow } from './supabaseClient.js';
export function showAccessBanner(message = "This area is intended for agents and managers.") {
  const existing = document.querySelector('.access-banner');
  if (existing) existing.remove();
  const container = document.createElement('div');
  container.className = 'access-banner';
  container.style.position = 'fixed';
  container.style.left = '50%';
  container.style.top = '16px';
  container.style.transform = 'translateX(-50%)';
  container.style.zIndex = '9999';
  container.innerHTML = `
    <div style="background: linear-gradient(90deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95)); color: white; padding: 10px 16px; border-radius: 10px; box-shadow: 0 6px 20px rgba(0,0,0,0.25); font-weight:600; font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; display:flex;gap:12px;align-items:center;">
      <div style="font-size:1.1rem">🔒</div>
      <div style="font-size:0.95rem">${message}</div>
      <div style="margin-left:12px">
        <button class="accessDismissBtn" style="background: rgba(255,255,255,0.12); color:#fff; border: none; padding:6px 10px; border-radius:8px; cursor:pointer;">Dismiss</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  const btn = container.querySelector('.accessDismissBtn');
  if (btn) btn.addEventListener('click', () => container.remove());
}
export function showAccessDeniedModal(message = "Access Restricted – This area is for administrators only.") {
  const existing = document.querySelector('.modal-backdrop.access-restricted');
  if (existing) existing.remove();
  const container = document.createElement('div');
  container.className = 'modal-backdrop access-restricted';
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.background = 'rgba(0,0,0,0.55)';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.zIndex = '9999';
  container.innerHTML = `
    <div role="dialog" aria-modal="true" aria-label="Access Restricted" style="max-width:520px; width:92%; background: linear-gradient(145deg, rgba(23,23,27,0.98), rgba(20,20,25,0.98)); border-radius:12px; padding:1.25rem 1.25rem; box-shadow: 0 10px 30px rgba(0,0,0,0.6); color: #fff; border: 1px solid rgba(255,255,255,0.04);">
      <div style="display:flex;gap:0.75rem;align-items:flex-start;">
        <div style="font-size:1.6rem;">⚠️</div>
        <div style="flex:1;">
          <h3 style="margin:0 0 0.5rem 0;font-size:1.05rem;">Access Restricted</h3>
          <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.4;">${message}</p>
        </div>
      </div>
      <div style="text-align:right;margin-top:16px;">
        <button id="accessOkBtn" style="background: linear-gradient(135deg,#4e8cff,#3d7eff); color:#fff;border:none;padding:0.5rem 0.9rem;border-radius:8px;cursor:pointer;font-weight:600;">Okay</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  const btn = document.getElementById('accessOkBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      container.remove();
      window.location.href = 'core-flow.html';
    });
  }
}
export async function fetchCurrentUserRow() {
  try {
    const sessionObj = await supabase.auth.getSession();
    const session = sessionObj?.data?.session ?? null;
    if (!session) return null;
    const userId = session.user?.id;
    if (!userId) return null;
    return await getUserRow(userId);
  } catch (err) {
    console.error('fetchCurrentUserRow error', err);
    return null;
  }
}
export async function enforcePageAccess(allowedRoles = [], options = { blockAdminRedirect: true }) {
  try {
    document.body.classList.add('loading-access');
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    if (!session) {
      window.location.href = 'login.html';
      return { allowed: false, role: null, userRow: null };
    }
    const userRow = await getUserRow(session.user.id);
    const role = userRow?.role || 'agent';
    const name = userRow?.name || session.user.email || 'Unknown';
    const el = document.getElementById('userName') || document.getElementById('userDisplay');
    if (el) el.textContent = name;
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      document.body.classList.replace('loading-access','ready-access');
      return { allowed: true, role, userRow };
    }
    if (!allowedRoles.includes(role)) {
      if (role === 'admin') {
        showAccessBanner("This area is intended for agents and managers. Admins can view data in Admin Dashboards.");
        document.body.classList.replace('loading-access','ready-access');
        return { allowed: false, role, userRow };
      }
      showAccessDeniedModal();
      return { allowed: false, role, userRow };
    }
    document.body.classList.replace('loading-access','ready-access');
    return { allowed: true, role, userRow };
  } catch (err) {
    console.error('enforcePageAccess error', err);
    try { window.location.href = 'login.html'; } catch(e){}
    document.body.classList.replace('loading-access','ready-access');
    return { allowed: false, role: null, userRow: null };
  }
}
