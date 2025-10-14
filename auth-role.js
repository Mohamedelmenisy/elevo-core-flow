/* role-check.js - unified role helper and UI helper functions
   - getCurrentUserRole() returns 'admin'|'manager'|'agent' or null
   - applyNavVisibility(role) updates header links and attaches protection for admin-only pages
   - showProtectedModal() shows a warning when agent tries to open admin-only pages
*/
import { supabase } from './supabase.js';

export async function getCurrentUserRole() {
  try {
    // Supabase auth user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;
    // Read role column from users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.error('Error fetching profile', error);
      return null;
    }
    const role = profile?.role || 'agent';
    return role;
  } catch (e) {
    console.error('getCurrentUserRole error', e);
    return null;
  }
}

export function applyNavVisibility(role) {
  // header link elements must have data-role-required attributes if they are admin/manager-only
  document.querySelectorAll('[data-role-required]').forEach(el => {
    const req = el.getAttribute('data-role-required'); // e.g. "admin,manager"
    if (!req) return;
    const allowed = req.split(',').map(s => s.trim());
    if (!role || !allowed.includes(role)) {
      // disable link but keep visible
      el.classList.add('protected-link');
      el.addEventListener('click', protectedClickHandler);
      el.setAttribute('aria-disabled','true');
    } else {
      el.classList.remove('protected-link');
      el.removeEventListener('click', protectedClickHandler);
      el.removeAttribute('aria-disabled');
    }
  });

  // update any role label UI
  const roleBadge = document.getElementById('role-badge');
  if (roleBadge) roleBadge.textContent = role || 'guest';
}

function protectedClickHandler(e){
  // allow sidebar viewing for agents, but warn when opening admin pages
  e.preventDefault();
  showProtectedModal();
}

export function showProtectedModal() {
  let modal = document.getElementById('protected-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'protected-modal';
    modal.className = 'protected-modal';
    modal.innerHTML = `
      <div class="protected-modal-card">
        <h3>Restricted</h3>
        <p>This area is for managers and administrators only. If you believe you should have access, please contact your admin.</p>
        <div class="protected-modal-actions">
          <button id="pm-close">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('pm-close').addEventListener('click', ()=> modal.classList.remove('open'));
  }
  modal.classList.add('open');
}
