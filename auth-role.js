import { supabase, getUserRole, ensureUserRow } from './supabaseClient.js';

/*
  auth-role.js
  - Enforces page-level access based on single 'role' text column in 'users' table.
  - Allowed roles: 'admin', 'manager', 'agent'
  - Signup default handled via ensureUserRow (insert role 'agent' if missing)
  - Pages should include this file as a module: <script type="module" src="auth-role.js"></script>
*/

const ADMIN_PAGES = ['dashboard.html','rtm-dashboard.html','audit.html','admin-dashboard.html'];
const AGENT_PAGES = ['agent-portal.html'];
const CORE_PAGE = 'core-flow.html';

function basename(path) {
    return path.split('/').pop().split('?')[0].toLowerCase();
}

function showAccessPopupAndRedirect() {
    // Create popup
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.left = 0;
    modal.style.top = 0;
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.zIndex = 99999;

    const card = document.createElement('div');
    card.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))';
    card.style.border = '1px solid rgba(255,255,255,0.06)';
    card.style.backdropFilter = 'blur(8px)';
    card.style.padding = '1.5rem 1.75rem';
    card.style.borderRadius = '12px';
    card.style.maxWidth = '520px';
    card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.6)';
    card.style.color = '#fff';
    card.innerHTML = `
      <h3 style="margin:0 0 .5rem 0;font-size:1.25rem;color:#fff">Access Restricted – This area is for administrators only.</h3>
      <p style="margin:0 0 1rem 0;color:rgba(255,255,255,0.8)">You do not have sufficient permissions to view this page.</p>
    `;

    const btn = document.createElement('button');
    btn.textContent = 'Okay';
    btn.style.marginTop = '0.5rem';
    btn.style.padding = '.6rem 1rem';
    btn.style.borderRadius = '10px';
    btn.style.border = 'none';
    btn.style.cursor = 'pointer';
    btn.style.background = 'linear-gradient(90deg,#4e8cff,#6ea8ff)';
    btn.style.color = '#fff';
    btn.onclick = () => {
        document.body.removeChild(modal);
        // Redirect to core flow
        window.location.href = CORE_PAGE;
    };

    card.appendChild(btn);
    modal.appendChild(card);
    document.body.appendChild(modal);
}

async function enforceRole() {
    const page = basename(window.location.pathname || window.location.href);

    // Core page allowed to all
    if (page === CORE_PAGE) return;

    try {
        // If no user, redirect to login (keep existing behavior)
        let { data: { session } } = await supabase.auth.getSession();
let user = session?.user;

// في حالة لسه Supabase بيحمّل الجلسة من localStorage
if (!user) {
  console.log("Waiting for Supabase session...");
  for (let i = 0; i < 5; i++) { // يجرب 5 مرات كل 500ms
    await new Promise(r => setTimeout(r, 500));
    const { data: { session: s2 } } = await supabase.auth.getSession();
    if (s2?.user) {
      user = s2.user;
      break;
    }
  }
}

if (!user) {
  console.warn("No active session found. Redirecting to login...");
  window.location.href = 'index.html';
  return;
}
  // Ensure there's a user row in users table (sets default 'agent' if missing)
        await ensureUserRow();

        // Get role
        const role = await getUserRole();

        // Agent-only page
        if (AGENT_PAGES.includes(page)) {
            if (role !== 'agent') {
                showAccessPopupAndRedirect();
            }
            return;
        }

        // Admin/Manager pages
        if (ADMIN_PAGES.includes(page) || page.endsWith('dashboard.html')) {
            if (role !== 'admin' && role !== 'manager') {
                showAccessPopupAndRedirect();
            }
            return;
        }

        // Fallback: allow
    } catch (err) {
        console.error('Role enforcement error:', err);
        // In case of errors, be conservative: redirect to core
        showAccessPopupAndRedirect();
    }
}

// Run enforcement on DOMContentLoaded to avoid interfering with existing logic
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceRole);
} else {
    enforceRole();
}
