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
      if (window.supabaseClient) return window.supabaseClient;
      if (window.supabase && typeof window.supabase === 'object') {
        if (typeof window.supabase.from === 'function' || typeof window.supabase.auth === 'object') {
          return window.supabase;
        }
      }
      return null;
    }

    // Internal state
    let _supabase = getSupabaseClient();
    let currentUser = null;
    let userProfile = null;
    let userRole = null;
    let userName = null;

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
              role-check.js expects a Supabase client to be available on the page.<br>
              Please initialize the client in your HTML before loading role-check.js.
            </p>
            <pre style="text-align:left;background:#111;padding:12px;border-radius:8px;color:#dcdcdc;overflow:auto;font-size:0.9rem;">
&lt;script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"&gt;&lt;/script&gt;
&lt;script&gt;
  window.supabaseClient = supabase.createClient('https://your.supabase.url', 'anon-key');
&lt;/script&gt;
&lt;script src="role-check.js"&gt;&lt;/script&gt;
            </pre>
            <button id="closeDevModal" style="
              padding:10px 18px;border-radius:10px;border:none;
              background:linear-gradient(135deg,#4e8cff,#3d7eff);
              color:#fff;font-weight:700;cursor:pointer;
            ">Close</button>
          </div>
        </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      document.getElementById('closeDevModal').addEventListener('click', () => {
        const m = document.getElementById('accessDeniedModal');
        if (m) m.remove();
      });
    }

    function showAccessRestrictedModal(options = {}) {
      const title = options.title || 'Access Restricted';
      const message = options.message || 'This page is restricted. You do not have permission to view it.';
      const allowedRolesText = options.allowedRolesText || '';

      let modal = document.getElementById('accessDeniedModal');
      if (!modal) {
        const html = `
          <div id="accessDeniedModal" style="
            position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.8); z-index: 99999; backdrop-filter: blur(8px);
          ">
            <div style="
              max-width: 520px; width: 94%; background: #2b2b3d; color: #f0f0f0;
              border-radius: 16px; padding: 28px; text-align: center;
              box-shadow: 0 20px 60px rgba(0,0,0,.6); border: 1px solid #444;
            ">
              <h3 style="font-size:1.6rem;margin:0 0 8px;">${title}</h3>
              <p style="color:#a0a0b0;font-size:1rem;line-height:1.6;margin:0 0 18px;">
                ${message} ${allowedRolesText}
              </p>
              <button onclick="window.location.href='index.html'" style="
                background:linear-gradient(135deg,#4e8cff,#3d7eff);
                color:#fff;border:none;border-radius:10px;padding:10px 18px;cursor:pointer;
              ">Back</button>
            </div>
          </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
      }
    }

    function updateUserInterface() {
      const nameToShow =
        userName ||
        (userProfile && userProfile.name) ||
        (currentUser && currentUser.email) ||
        '';
      const els = document.querySelectorAll('#userName, .user-name-display');
      els.forEach(el => (el.textContent = nameToShow));
    }

    async function fetchUserProfile(userId) {
      if (!_supabase) return null;
      try {
        const { data, error } = await _supabase
          .from('users')
          .select('id, name, email, role')
          .eq('id', userId)
          .single();
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    }

    async function checkAccess(allowedRoles = []) {
      if (!_supabase) _supabase = getSupabaseClient();
      if (!_supabase) {
        showDeveloperSupabaseMissingModal();
        return null;
      }

      let user = null;
      try {
        const result = await _supabase.auth.getUser();
        user = result?.data?.user || null;
      } catch {
        user = null;
      }

      if (!user) {
        window.location.href = 'index.html';
        return null;
      }

      currentUser = user;
      const profile = await fetchUserProfile(user.id);
      userProfile = profile;
      userRole = profile?.role || user.user_metadata?.role;
      userName = profile?.name || user.user_metadata?.name || user.email;

      updateUserInterface();

      const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
      if (!normalizedAllowed.length) return currentUser;

      const roleNormalized = userRole ? userRole.toLowerCase() : null;
      if (roleNormalized && normalizedAllowed.includes(roleNormalized)) {
        return currentUser;
      } else {
        showAccessRestrictedModal({
          message: 'This page is for specific roles only.',
          allowedRolesText: `Allowed roles: ${normalizedAllowed.join(', ')}`
        });
        return null;
      }
    }

    window.RoleCheck = {
      checkAccess,
      checkAccessAdminManager: () => checkAccess(['admin', 'manager']),
      checkAccessAgentAdminManager: () => checkAccess(['agent', 'admin', 'manager']),
      getUserRole: () => userRole,
      getUserName: () => userName
    };

    document.addEventListener('DOMContentLoaded', async () => {
      if (!_supabase) _supabase = getSupabaseClient();
      if (_supabase?.auth?.getUser) {
        try {
          const result = await _supabase.auth.getUser();
          const user = result?.data?.user;
          if (user) {
            currentUser = user;
            const profile = await fetchUserProfile(user.id);
            if (profile) {
              userProfile = profile;
              userRole = profile.role;
              userName = profile.name || profile.email;
            }
            updateUserInterface();
          }
        } catch {}
      }
    });
  })(); // ✅ نهاية الـ IIFE
}
