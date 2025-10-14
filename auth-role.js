import { supabase } from './supabaseClient.js';

const ADMIN_PAGES = ['dashboard.html', 'rtm-dashboard.html', 'audit.html', 'admin-dashboard.html'];
const AGENT_PAGES = ['agent-portal.html'];
const CORE_PAGE = 'core-flow.html';

function basename(path) {
  return path.split('/').pop().split('?')[0].toLowerCase();
}

async function getCurrentUserRole() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('getCurrentUserRole error:', error);
      return null;
    }

    return data?.role || 'agent';
  } catch (e) {
    console.error('Error fetching user role:', e);
    return null;
  }
}

function showAccessModal() {
  let modal = document.getElementById('restricted-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'restricted-modal';
    modal.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:99999;
    `;
    modal.innerHTML = `
      <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border-radius:12px;padding:20px 25px;max-width:420px;text-align:center;color:#fff;">
        <h3 style="margin:0 0 8px 0;">Access Restricted</h3>
        <p style="margin:0 0 12px 0;">This area is for administrators or managers only.</p>
        <button id="restricted-ok" style="padding:8px 16px;border:none;border-radius:8px;background:#4e8cff;color:#fff;cursor:pointer;">Okay</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('restricted-ok').onclick = () => {
      modal.remove();
      window.location.href = CORE_PAGE;
    };
  }
}

async function checkRoleAccess() {
  const page = basename(window.location.pathname);
  const role = await getCurrentUserRole();

  if (!role) {
    console.log('No user session detected → showing as guest.');
    return; // no redirect — just leave the page blank/limited
  }

  if (AGENT_PAGES.includes(page) && role !== 'agent') {
    showAccessModal();
    return;
  }

  if (ADMIN_PAGES.includes(page) && !['admin', 'manager'].includes(role)) {
    showAccessModal();
    return;
  }
}

// Execute
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkRoleAccess);
} else {
  checkRoleAccess();
}
