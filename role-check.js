// 🧩 منع اللوب بين الصفحات + تشغيل الكود فقط في الصفحات المسموحة
const currentPage = window.location.pathname;

const isKnownPage =
  currentPage.includes("agent-portal.html") ||
  currentPage.includes("admin-dashboard.html") ||
  currentPage.includes("core-flow.html");

if (!isKnownPage) {
  console.log("Skipped role-check on:", currentPage);
} else {
  console.log("Role check running on:", currentPage);

  (function () {
    'use strict';

  /**
   * محاولة الحصول على كائن عميل Supabase الموجود في الصفحة.
   * لا ننشئ createClient جديد هنا — هذا ملف صلاحيات فقط ويعتمد على العميل الموجود مسبقاً.
   */
  function getSupabaseClient() {
    // الأولوية: window.supabaseClient (واضح ومخصص)
    if (window.supabaseClient) return window.supabaseClient;

    // ثانياً: window.supabase قد يكون هو client نفسه (بعض مشاريع تربطه هناك)
    if (window.supabase && typeof window.supabase === 'object') {
      // بعض المشاريع يضعون createClient تحت window.supabase.createClient
      // وفي هذه الحالة لا ننشئ client هنا لأنك طلبت صراحة عدم فتح اتصال جديد.
      // إذا كان window.supabase فعلاً client (مثلاً نتيجة createClient) نستخدمه.
      // أفضل فحص بسيط: وجود طرق أساسية على كائن client
      if (typeof window.supabase.from === 'function' || typeof window.supabase.auth === 'object') {
        return window.supabase;
      }
    }

    // لا يوجد client جاهز
    return null;
  }

  // Internal state
  let _supabase = getSupabaseClient();
  let currentUser = null; // supabase user object
  let userProfile = null; // row from users table (expects columns: id, name, role, email, ...) 
  let userRole = null;
  let userName = null;

  /**
   * Helper: show an informative modal telling developer to wire supabase client,
   * or show access restricted if client exists but user not allowed.
   */
  function showDeveloperSupabaseMissingModal() {
    const existing = document.getElementById('accessDeniedModal');
    if (existing) return;

    const modalHTML = `
      <div id="accessDeniedModal" style="
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0,0,0,0.8);
        z-index: 99999;
        backdrop-filter: blur(8px);
      ">
        <div style="
          max-width: 640px;
          width: 92%;
          background: #2b2b3d;
          color: #f0f0f0;
          border: 1px solid #444;
          border-radius: 16px;
          padding: 28px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,.6);
        ">
          <h2 style="margin:0 0 8px;font-size:1.4rem;color:#FFC107;">Configuration required</h2>
          <p style="color:#a0a0b0;margin:0 0 16px;line-height:1.6;">
            role-check.js expects a Supabase client to be available on the page.
            Please initialize the client in your HTML before loading role-check.js, for example:
          </p>
          <pre style="text-align:left;background:#111;padding:12px;border-radius:8px;color:#dcdcdc;overflow:auto;font-size:0.9rem;">
&lt;script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"&gt;&lt;/script&gt;
&lt;script&gt;
  // create client once and attach to window
  // window.supabaseClient = supabase.createClient('https://your.supabase.url', 'anon-key');
&lt;/script&gt;
&lt;script src="role-check.js"&gt;&lt;/script&gt;
          </pre>
          <div style="margin-top:18px;">
            <button id="closeDevModal" style="
              padding:10px 18px;border-radius:10px;border:none;background:linear-gradient(135deg,#4e8cff,#3d7eff);color:#fff;font-weight:700;cursor:pointer;
            ">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('closeDevModal').addEventListener('click', () => {
      const m = document.getElementById('accessDeniedModal');
      if (m) m.remove();
    });
  }

  /**
   * Show "Access Restricted" modal (user-facing). Matches aesthetic of project.
   * Accepts optional message override and redirect URL for back button.
   */
  function showAccessRestrictedModal(options = {}) {
    const title = options.title || 'Access Restricted';
    const message = options.message || 'This page is restricted. You do not have permission to view it.';
    const allowedRolesText = options.allowedRolesText || '';

    // If modal exists, update message and show
    let modal = document.getElementById('accessDeniedModal');
    if (!modal) {
      const html = `
        <div id="accessDeniedModal" style="
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.8);
          z-index: 99999;
          backdrop-filter: blur(8px);
        ">
          <div class="access-denied-content" style="
            max-width: 520px;
            width: 94%;
            background: #2b2b3d;
            color: #f0f0f0;
            border-radius: 16px;
            padding: 28px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,.6);
            border: 1px solid #444444;
          ">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FFC107" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <h3 id="accessDeniedTitle" style="font-size:1.6rem;margin:0 0 8px;color:#f0f0f0;">${title}</h3>
            <p id="accessDeniedMessage" style="color:#a0a0b0;font-size:1rem;line-height:1.6;margin:0 0 18px;">
              ${message} ${allowedRolesText}
            </p>
            <div style="display:flex;gap:12px;justify-content:center;margin-top:10px;flex-wrap:wrap;">
              <button id="backToDashboardBtnModal" style="
                background: linear-gradient(135deg, #4e8cff, #3d7eff);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 10px 18px;
                font-weight: 700;
                cursor: pointer;
              ">Back to Dashboard</button>
              <button id="logoutBtnModal" style="
                background: transparent;
                color: #f0f0f0;
                border: 1px solid rgba(255,255,255,.06);
                border-radius: 12px;
                padding: 10px 14px;
                font-weight: 600;
                cursor:pointer;
              ">Logout</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', html);

      document.getElementById('backToDashboardBtnModal').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
      });
      document.getElementById('logoutBtnModal').addEventListener('click', async () => {
        try {
          if (_supabase && _supabase.auth && typeof _supabase.auth.signOut === 'function') {
            await _supabase.auth.signOut();
          }
        } catch (e) {
          console.warn('Error signing out:', e);
        } finally {
          window.location.href = 'index.html';
        }
      });
    } else {
      // update contents
      const titleEl = modal.querySelector('#accessDeniedTitle');
      const msgEl = modal.querySelector('#accessDeniedMessage');
      if (titleEl) titleEl.textContent = title;
      if (msgEl) msgEl.innerHTML = `${message} ${allowedRolesText}`;
      modal.style.display = 'flex';
    }
  }

  /**
   * Update header/user elements with name (not email).
   * Looks for #userName and .user-name-display elements and fills them.
   */
  function updateUserInterface() {
    const nameToShow = userName || (userProfile && userProfile.name) || (currentUser && currentUser.email) || '';
    const els = document.querySelectorAll('#userName, .user-name-display');
    els.forEach(el => {
      if (el) el.textContent = nameToShow;
    });

    // show container if exists
    const userInfo = document.getElementById('userInfo');
    if (userInfo) userInfo.style.display = nameToShow ? 'flex' : 'none';
  }

  /**
   * Internal: fetch profile row from `users` table (expects column `role` and `name`)
   * If the project uses a different table/name, adjust or store the row in user metadata.
   */
  async function fetchUserProfile(userId) {
    if (!_supabase) return null;
    try {
      const { data, error } = await _supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('fetchUserProfile error:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.warn('fetchUserProfile exception:', err);
      return null;
    }
  }

  /**
   * Public: checkAccess(allowedRoles)
   * - allowedRoles: array of role strings (e.g. ['admin', 'manager'])
   * Behavior:
   * - If no supabase client on page: show developer modal that instructs to wire client (does NOT redirect).
   * - If user not logged in: redirect to index.html (login).
   * - If user's role is in allowedRoles -> returns the current user object (and sets UI name).
   * - Else shows Access Restricted modal and returns null.
   */
  async function checkAccess(allowedRoles = []) {
    // refresh supabase client reference if it was not found earlier but maybe set later
    if (!_supabase) _supabase = getSupabaseClient();

    if (!_supabase) {
      // Developer forgot to provide supabase client on the page.
      // Show a modal that instructs how to initialize client in HTML.
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showDeveloperSupabaseMissingModal);
      } else {
        showDeveloperSupabaseMissingModal();
      }
      return null;
    }

    // if supabase available but no auth functions, warn dev
    if (!_supabase.auth || typeof _supabase.auth.getUser !== 'function') {
      console.warn('Supabase client found but auth API not available. Ensure you are using supabase-js v2 createClient.');
    }

    try {
      // get current user from supabase auth
      let user = null;
      if (_supabase.auth && typeof _supabase.auth.getUser === 'function') {
        const result = await _supabase.auth.getUser();
        user = result && result.data && result.data.user ? result.data.user : null;
      } else if (_supabase.auth && _supabase.auth.user) {
        user = _supabase.auth.user();
      }

      if (!user) {
        // not authenticated
        window.location.href = 'index.html';
        return null;
      }

      currentUser = user;

      // try to get profile/role from users table
      const profile = await fetchUserProfile(user.id);
      if (profile) {
        userProfile = profile;
        userRole = profile.role;
        userName = profile.name || profile.email || (user.user_metadata && user.user_metadata.full_name) || user.email;
      } else {
        // fallback: try to read role from user metadata if present
        userRole = (user.user_metadata && user.user_metadata.role) ? user.user_metadata.role : null;
        userName = (user.user_metadata && (user.user_metadata.name || user.user_metadata.full_name)) || user.email;
      }

      updateUserInterface();

      // Normalize allowedRoles to strings lowercased
      const normalizedAllowed = Array.isArray(allowedRoles) ? allowedRoles.map(r => String(r).toLowerCase()) : [];

      if (normalizedAllowed.length === 0) {
        // No restrictions -> allow
        return currentUser;
      }

      const roleNormalized = userRole ? String(userRole).toLowerCase() : null;

      if (roleNormalized && normalizedAllowed.includes(roleNormalized)) {
        return currentUser;
      } else {
        // Not allowed -> show access restricted
        const allowedText = normalizedAllowed.length ? `Allowed roles: <strong style="color:#4e8cff;">${normalizedAllowed.join(', ')}</strong>.` : '';
        showAccessRestrictedModal({
          title: 'Access Restricted',
          message: 'This page is for specific roles only.',
          allowedRolesText: allowedText
        });
        return null;
      }
    } catch (err) {
      console.error('checkAccess error:', err);
      showAccessRestrictedModal({
        title: 'Access Error',
        message: 'There was an error verifying your permissions. Please contact support.'
      });
      return null;
    }
  }

  /**
   * Convenience wrappers: for common pages
   */
  async function checkAccessAdminManager() {
    return checkAccess(['admin', 'manager']);
  }
  async function checkAccessAgentAdminManager() {
    return checkAccess(['agent', 'admin', 'manager']);
  }

  // Expose public API on window
  window.RoleCheck = {
    checkAccess,
    checkAccessAdminManager,
    checkAccessAgentAdminManager,
    getCurrentUser: () => currentUser,
    getUserProfile: () => userProfile,
    getUserRole: () => userRole,
    getUserName: () => userName,
    // For debugging: allow re-binding to a client if the page sets it later
    bindSupabaseClient: function (client) {
      _supabase = client;
    }
  };

  // Auto-run small initializer after DOM ready to populate name if possible
  document.addEventListener('DOMContentLoaded', async function () {
    // Attempt a silent check to fill the name in header without forcing modal/redirect.
    if (!_supabase) _supabase = getSupabaseClient();
    if (_supabase && _supabase.auth && typeof _supabase.auth.getUser === 'function') {
      try {
        const result = await _supabase.auth.getUser();
        const user = result && result.data && result.data.user ? result.data.user : null;
        if (user) {
          currentUser = user;
          // fetch profile but ignore failures
          try {
            const profile = await fetchUserProfile(user.id);
            if (profile) {
              userProfile = profile;
              userRole = profile.role;
              userName = profile.name || profile.email;
            } else {
              userName = (user.user_metadata && (user.user_metadata.name || user.user_metadata.full_name)) || user.email;
            }
            updateUserInterface();
          } catch (e) { /* ignore */ }
        }
      } catch (e) {
        // ignore silent fetch errors
      }
    }
  });

})();
})();
}
