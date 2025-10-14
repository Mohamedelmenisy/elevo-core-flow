// role-check.js
// ESM module - import this from صفحاتك (مثال: import { enforcePageAccess } from './role-check.js')
import { supabase, getUserRow } from './supabaseClient.js';

/**
 * showAccessDenied modal — same look & feel as "knowledge" modal in your app
 * message param optional
 */
export function showAccessDenied(message = "Access Restricted – This area is for administrators only.") {
  // remove any existing modal first
  const existing = document.querySelector('.modal-backdrop.access-restricted');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.className = 'modal-backdrop access-restricted';
  container.style.position = 'fixed';
  container.style.inset = '0';
  container.style.background = 'rgba(0,0,0,0.6)';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.zIndex = '9999';
  container.innerHTML = `
    <div role="dialog" aria-modal="true" aria-label="Access Restricted" style="
        max-width:480px;
        width:90%;
        background: linear-gradient(145deg, rgba(30,30,40,0.98), rgba(24,24,30,0.98));
        border-radius:12px;
        padding:1.25rem 1.25rem;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        color: #fff;
        border: 1px solid rgba(255,255,255,0.04);
      ">
      <div style="display:flex;gap:0.75rem;align-items:flex-start;">
        <div style="font-size:1.6rem;">⚠️</div>
        <div style="flex:1;">
          <h3 style="margin:0 0 0.5rem 0;font-size:1.05rem;">Access Restricted</h3>
          <p style="margin:0;color:rgba(255,255,255,0.85);line-height:1.4;">${message}</p>
        </div>
      </div>
      <div style="text-align:right;margin-top:16px;">
        <button id="accessOkBtn" style="
            background: linear-gradient(135deg,#4e8cff,#3d7eff);
            color:#fff;border:none;padding:0.5rem 0.9rem;border-radius:8px;cursor:pointer;font-weight:600;
        ">Okay</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
  const btn = document.getElementById('accessOkBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      container.remove();
      // redirect to core-flow per your request
      window.location.href = 'core-flow.html';
    });
  }
}

/**
 * helper: get current user row (from DB) using session
 */
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

/**
 * enforcePageAccess(allowedRoles)
 * allowedRoles: array of strings (e.g., ['admin','manager'])
 * returns { allowed: boolean, role: string, userRow: object|null }
 *
 * - if no session: redirect to login.html
 * - if allowedRoles empty: no restriction (allowed true)
 * - if role not in allowedRoles: show modal then return allowed:false
 */
export async function enforcePageAccess(allowedRoles = []) {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    if (!session) {
      // no session -> go to login
      window.location.href = 'login.html';
      return { allowed: false, role: null, userRow: null };
    }

    const userRow = await getUserRow(session.user.id);
    const role = userRow?.role || 'agent';
    const name = userRow?.name || session.user.email || 'Unknown';

    // put name in header if element exists
    const el = document.getElementById('userName') || document.getElementById('userDisplay');
    if (el) el.textContent = name;

    // if no allowedRoles specified -> allow
    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return { allowed: true, role, userRow };
    }

    // check membership
    if (!allowedRoles.includes(role)) {
      // special behavior: show modal and redirect to core-flow
      showAccessDenied();
      return { allowed: false, role, userRow };
    }

    return { allowed: true, role, userRow };
  } catch (err) {
    console.error('enforcePageAccess error', err);
    // safe fallback: redirect to login
    try { window.location.href = 'login.html'; } catch (e) {}
    return { allowed: false, role: null, userRow: null };
  }
}
