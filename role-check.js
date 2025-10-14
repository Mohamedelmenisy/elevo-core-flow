// role-check.js
// Usage: <script type="module" src="role-check.js"></script>
// This script centralizes role reading + nav protection + Access Restricted modal.
// It expects window.supabase to be available (imported in each page).

/*
  Behavior summary:
  - getCurrentUserRole() reads supabase.auth.getUser() then queries table 'users' for 'role'.
    If a legacy 'is_admin' field exists and is true, returns 'admin'.
    If no role found, returns 'agent' (safe default).
  - applyNavVisibility(role) shows/hides admin links and attaches protection for protected links.
  - showProtectedModal() displays a small modal when an unauthorized user clicks a protected link.
  - attachProtectedHandler() is applied to any element with data-protected-role attribute.
*/

const RoleCheck = (function () {
  // Config - adjust selectors if your HTML uses different IDs/classes.
  const NAV_PROTECTED_SELECTOR = '[data-protected-role]'; // elements with data-protected-role="admin" etc
  const ADMIN_LINKS = '.admin-only'; // optional: links with this class will be hidden for non-admins
  const ADMIN_LINKS_INLINE = '[data-show-for="admin"]'; // alt: attribute based
  const USER_INFO_SELECTOR = '#userInfo'; // where to show user info
  const USER_NAME_SELECTOR = '#userName';
  const DEFAULT_ROLE = 'agent';

  // Create modal DOM and styles (minimal & self-contained)
  function createProtectionModal() {
    if (document.getElementById('accessRestrictedModal')) return;

    const style = document.createElement('style');
    style.id = 'accessRestrictedModalStyle';
    style.textContent = `
      /* Modal styles (scoped) */
      #accessRestrictedModal {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(2,6,23,0.55);
        z-index: 12000;
        opacity: 0;
        visibility: hidden;
        transition: opacity .22s ease, visibility .22s;
        font-family: Inter, system-ui, -apple-system, 'Cairo', 'Poppins', sans-serif;
      }
      #accessRestrictedModal.show {
        opacity: 1;
        visibility: visible;
      }
      #accessRestrictedModal .modal-card {
        background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02));
        border-radius: 12px;
        max-width: 420px;
        width: calc(100% - 40px);
        padding: 1.6rem;
        box-shadow: 0 8px 30px rgba(2,6,23,0.6);
        border: 1px solid rgba(255,255,255,0.04);
        text-align: center;
        color: #e6eef8;
        backdrop-filter: blur(6px);
      }
      #accessRestrictedModal .icon {
        font-size: 2.6rem;
        margin-bottom: 0.6rem;
      }
      #accessRestrictedModal h2 {
        margin: 0;
        font-size: 1.25rem;
        margin-bottom: .35rem;
        color: #f8fafc;
        font-weight: 700;
      }
      #accessRestrictedModal p {
        margin: 0;
        margin-bottom: 1rem;
        color: #cbd5e1;
        font-size: 0.95rem;
        line-height: 1.4;
      }
      #accessRestrictedModal .modal-actions {
        display:flex;
        justify-content:center;
        gap:.6rem;
        margin-top:.6rem;
      }
      #accessRestrictedModal button {
        padding: .5rem 1rem;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        font-weight: 600;
        font-size: .95rem;
      }
      #accessRestrictedModal .btn-ok {
        background: linear-gradient(90deg,#3b82f6,#2563eb);
        color: white;
        box-shadow: 0 6px 18px rgba(37,99,235,0.18);
      }
      #accessRestrictedModal .btn-cancel {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.06);
        color: #cbd5e1;
      }
    `;
    document.head.appendChild(style);

    const modal = document.createElement('div');
    modal.id = 'accessRestrictedModal';
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="accessRestrictedTitle">
        <div class="icon">🔒</div>
        <h2 id="accessRestrictedTitle">Access Restricted</h2>
        <p>This area is for administrators only.</p>
        <div class="modal-actions">
          <button class="btn-ok" id="accessRestrictedOk">Okay</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // events
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeProtectionModal();
    });
    const ok = modal.querySelector('#accessRestrictedOk');
    ok.addEventListener('click', () => closeProtectionModal());
  }

  function openProtectionModal() {
    createProtectionModal();
    const modal = document.getElementById('accessRestrictedModal');
    if (!modal) return;
    modal.classList.add('show');
    // focus management
    const ok = modal.querySelector('#accessRestrictedOk');
    if (ok) ok.focus();
  }

  function closeProtectionModal() {
    const modal = document.getElementById('accessRestrictedModal');
    if (!modal) return;
    modal.classList.remove('show');
  }

  // Read current user's role from Supabase
  // returns: 'admin' | 'agent' | 'manager' | null if unauthenticated
  async function getCurrentUserRole() {
    try {
      if (!window.supabase) {
        console.warn('Supabase client not found on window.');
        return null;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData || !authData.user) {
        return null;
      }
      const user = authData.user;
      // read profile row from users table (id, role, optional is_admin)
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, role, is_admin, name, email')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('role-check: error fetching profile', error);
        return DEFAULT_ROLE;
      }
      // Backwards compatibility: if is_admin exists and is true -> admin
      if (profile && profile.is_admin === true) return 'admin';
      // Use role if present
      if (profile && profile.role) return profile.role;
      return DEFAULT_ROLE;
    } catch (err) {
      console.error('role-check getCurrentUserRole error', err);
      return DEFAULT_ROLE;
    }
  }

  // Apply nav visibility & protected-link handlers.
  // Protected links: elements with data-protected-role attribute (comma separated roles allowed)
  // e.g. <a href="dashboard.html" data-protected-role="admin,manager">Dashboard</a>
  function applyNavVisibility(role) {
    try {
      // show/hide admin-only elements (if you use a class)
      document.querySelectorAll(ADMIN_LINKS).forEach(el => {
        if (role === 'admin') {
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });
      // attribute-based
      document.querySelectorAll(ADMIN_LINKS_INLINE).forEach(el => {
        const shouldShow = el.getAttribute('data-show-for') === role || el.getAttribute('data-show-for').split(',').map(s => s.trim()).includes(role);
        el.style.display = shouldShow ? '' : 'none';
      });

      // Attach protection handlers on any element with data-protected-role
      document.querySelectorAll(NAV_PROTECTED_SELECTOR).forEach(el => {
        // ensure link is visible (we keep link visible for agents but intercept click)
        el.style.pointerEvents = '';
        el.addEventListener('click', function (evt) {
          const allowed = (el.getAttribute('data-protected-role') || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          if (allowed.length === 0) return; // nothing to protect
          if (!allowed.includes(role)) {
            // prevent navigation and show modal
            evt.preventDefault();
            openProtectionModal();
          }
          // else allow default navigation
        });
      });

      // Fill basic user info in header if present
      const userInfoEl = document.querySelector(USER_INFO_SELECTOR);
      const userNameEl = document.querySelector(USER_NAME_SELECTOR);
      if (userInfoEl && userNameEl && window.supabase) {
        // if supabase auth has a user, show email/name
        supabase.auth.getUser().then(({ data }) => {
          if (data && data.user) {
            userInfoEl.style.display = 'flex';
            userNameEl.textContent = data.user.email || (data.user.user_metadata && data.user.user_metadata.name) || '';
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.error('applyNavVisibility error', err);
    }
  }

  // Public initializer to call on page load
  async function initRoleChecks() {
    try {
      createProtectionModal();
      const role = await getCurrentUserRole();
      // if role is null (not signed in) -> redirect to login page (consistent with your current behavior)
      if (role === null) return; // leave it to page's own auth handling to redirect

      applyNavVisibility(role);
      return role;
    } catch (err) {
      console.error('initRoleChecks error', err);
      return null;
    }
  }

  return {
    getCurrentUserRole,
    applyNavVisibility,
    initRoleChecks,
    openProtectionModal,
    closeProtectionModal
  };
})();

// Auto-init on DOMContentLoaded to simplify integration
document.addEventListener('DOMContentLoaded', async () => {
  // Wait a tick to ensure supabase global exists (your pages initialize supabase in inline scripts)
  if (window.supabase) {
    await RoleCheck.initRoleChecks();
  } else {
    // If supabase not yet declared, poll a few times
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (window.supabase) {
        clearInterval(interval);
        await RoleCheck.initRoleChecks();
      } else if (attempts > 10) {
        clearInterval(interval);
        console.warn('role-check: supabase not found after polling.');
      }
    }, 150);
  }
});

export default RoleCheck;
