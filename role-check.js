// ======================================================
// role-check.js
// نظام التحقق من الصلاحيات + منع اللوب بين الصفحات
// ======================================================

// 🧩 أولاً: انتظر Supabase client يكون جاهز قبل أي تنفيذ
document.addEventListener('DOMContentLoaded', async () => {
  const waitForSupabase = () =>
    new Promise(resolve => {
      const check = () => {
        if (window.supabaseClient || window.supabase) resolve();
        else setTimeout(check, 150);
      };
      check();
    });

  await waitForSupabase();

  // بعد ما supabase جاهز نبدأ تشغيل التحقق
  startRoleCheck();
});

function startRoleCheck() {
  const currentPage = window.location.pathname;

  const isKnownPage =
    currentPage.includes("agent-portal.html") ||
    currentPage.includes("admin-dashboard.html") ||
    currentPage.includes("core-flow.html");

  if (!isKnownPage) {
    console.log("Skipped role-check on:", currentPage);
    return;
  }

  console.log("Role check running on:", currentPage);

  (function () {
    'use strict';

    // محاولة الحصول على Supabase Client
    function getSupabaseClient() {
      if (window.supabaseClient) return window.supabaseClient;
      if (window.supabase && typeof window.supabase === 'object') {
        if (typeof window.supabase.from === 'function' || typeof window.supabase.auth === 'object') {
          return window.supabase;
        }
      }
      return null;
    }

    // الحالة الداخلية
    let _supabase = getSupabaseClient();
    let currentUser = null;
    let userProfile = null;
    let userRole = null;
    let userName = null;

    // 🧠 عرض مودال تنبيه للمطور لو مفيش Supabase Client
    function showDeveloperSupabaseMissingModal() {
      const existing = document.getElementById('accessDeniedModal');
      if (existing) return;

      const modalHTML = `
        <div id="accessDeniedModal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);z-index:99999;">
          <div style="max-width:600px;width:90%;background:#2b2b3d;color:#fff;border-radius:16px;padding:24px;text-align:center;">
            <h2 style="color:#FFC107;">Supabase client not found</h2>
            <p>Initialize Supabase before loading role-check.js.</p>
            <pre style="text-align:left;background:#111;padding:10px;border-radius:8px;color:#ccc;">
&lt;script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"&gt;&lt;/script&gt;
&lt;script&gt;
  window.supabaseClient = supabase.createClient('https://your.supabase.url','anon-key');
&lt;/script&gt;
&lt;script src="role-check.js"&gt;&lt;/script&gt;
            </pre>
            <button id="closeDevModal" style="margin-top:10px;padding:8px 16px;border:none;border-radius:8px;background:#4e8cff;color:#fff;font-weight:600;cursor:pointer;">Close</button>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      document.getElementById('closeDevModal').onclick = () => {
        document.getElementById('accessDeniedModal').remove();
      };
    }

    // ⚠️ مودال الرفض العادي للمستخدم
    function showAccessRestrictedModal(options = {}) {
      const title = options.title || 'Access Restricted';
      const message = options.message || 'You do not have permission to view this page.';
      const allowedRolesText = options.allowedRolesText || '';

      let modal = document.getElementById('accessDeniedModal');
      if (!modal) {
        const html = `
          <div id="accessDeniedModal" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);z-index:99999;">
            <div style="max-width:480px;width:92%;background:#2b2b3d;color:#f0f0f0;border-radius:16px;padding:26px;text-align:center;border:1px solid #444;">
              <h3 style="color:#FFC107;font-size:1.4rem;">${title}</h3>
              <p style="margin:12px 0 20px;color:#bbb;">${message}<br>${allowedRolesText}</p>
              <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
                <button id="backBtn" style="background:#4e8cff;border:none;color:#fff;padding:8px 14px;border-radius:8px;font-weight:600;">Back</button>
                <button id="logoutBtn" style="background:transparent;border:1px solid #777;color:#ccc;padding:8px 14px;border-radius:8px;font-weight:600;">Logout</button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('backBtn').onclick = () => (window.location.href = 'index.html');
        document.getElementById('logoutBtn').onclick = async () => {
          if (_supabase && _supabase.auth && typeof _supabase.auth.signOut === 'function') {
            await _supabase.auth.signOut();
          }
          window.location.href = 'index.html';
        };
      }
    }

    // تحديث الاسم في الهيدر
    function updateUserInterface() {
      const nameToShow = userName || (userProfile && userProfile.name) || (currentUser && currentUser.email) || '';
      document.querySelectorAll('#userName, .user-name-display').forEach(el => (el.textContent = nameToShow));
    }

    // جلب بيانات المستخدم من جدول users
    async function fetchUserProfile(userId) {
      if (!_supabase) return null;
      try {
        const { data, error } = await _supabase.from('users').select('id, name, email, role').eq('id', userId).single();
        if (error) return null;
        return data;
      } catch {
        return null;
      }
    }

    // 🧩 الوظيفة الأساسية للتحقق من الصلاحية
    async function checkAccess(allowedRoles = []) {
      if (!_supabase) _supabase = getSupabaseClient();
      if (!_supabase) {
        showDeveloperSupabaseMissingModal();
        return null;
      }

      try {
        const result = await _supabase.auth.getUser();
        const user = result?.data?.user || null;
        if (!user) {
          window.location.href = 'index.html';
          return null;
        }

        currentUser = user;
        const profile = await fetchUserProfile(user.id);

        if (profile) {
          userProfile = profile;
          userRole = profile.role;
          userName = profile.name || profile.email;
        } else {
          userRole = user.user_metadata?.role || null;
          userName = user.user_metadata?.name || user.email;
        }

        updateUserInterface();

        const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
        const roleNormalized = userRole ? userRole.toLowerCase() : null;

        if (normalizedAllowed.length === 0 || normalizedAllowed.includes(roleNormalized)) {
          return currentUser;
        }

        showAccessRestrictedModal({
          message: 'This page is for specific roles only.',
          allowedRolesText: `Allowed roles: <strong>${normalizedAllowed.join(', ')}</strong>`
        });
        return null;
      } catch (err) {
        console.error('checkAccess error:', err);
        showAccessRestrictedModal({
          title: 'Access Error',
          message: 'Error verifying permissions.'
        });
        return null;
      }
    }

    // ✅ واجهة استخدام جاهزة في window
    window.RoleCheck = {
      checkAccess,
      checkAccessAdminManager: () => checkAccess(['admin', 'manager']),
      checkAccessAgentAdminManager: () => checkAccess(['agent', 'admin', 'manager']),
      getCurrentUser: () => currentUser,
      getUserProfile: () => userProfile,
      getUserRole: () => userRole,
      getUserName: () => userName,
      bindSupabaseClient: client => (_supabase = client)
    };

    // 🧩 تعبئة الاسم تلقائياً في الهيدر
    document.addEventListener('DOMContentLoaded', async () => {
      if (!_supabase) _supabase = getSupabaseClient();
      if (_supabase && _supabase.auth?.getUser) {
        const result = await _supabase.auth.getUser();
        const user = result?.data?.user;
        if (user) {
          currentUser = user;
          const profile = await fetchUserProfile(user.id);
          userName = profile?.name || user.email;
          updateUserInterface();
        }
      }
    });
  })();
}
