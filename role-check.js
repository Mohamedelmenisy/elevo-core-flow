/**
 * role-check.js - نظام الصلاحيات الموثوق لـ Elevo Core
 * 
 * يعتمد على نفس Supabase client اللي بيكون مهيأ داخل الصفحة.
 * لازم الكود ده يتحط بعد تعريف `const supabase = ...`
 */

window.roleCheck = {
  /**
   * التحقق من الصلاحيات
   * @param {string[]} allowedRoles - الأدوار المسموح بها
   */
  async checkAccess(allowedRoles) {
    const mainContent = document.querySelector('#dashboardContent, #portalContent, #appContainerContent, #initial-view');
    const authLoading = document.getElementById('auth-loading');

    if (mainContent) mainContent.style.display = 'none';
    if (authLoading) authLoading.style.display = 'flex';

    try {
      if (typeof supabase === 'undefined') {
        throw new Error('Supabase not initialized.');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        throw new Error(error?.message || 'User data not found');
      }

      const role = data.role?.toLowerCase();

      if (!allowedRoles.includes(role)) {
        this.showAccessDenied(role);
        return;
      }

      this.updateUserUI(data);

      if (authLoading) authLoading.style.display = 'none';
      if (mainContent) mainContent.style.display = mainContent.classList.contains('initial-card') ? 'grid' : 'block';

      return data;
    } catch (err) {
      console.error('Access check error:', err.message);
      this.showAccessDenied();
    }
  },

  showAccessDenied(role) {
    document.body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:white;text-align:center;">
        <h1>Access Denied</h1>
        <p>Your role (${role || "unknown"}) doesn't have access to this page.</p>
        <button style="margin-top:20px;padding:10px 20px;border:none;border-radius:8px;background:#3b82f6;color:white;cursor:pointer;"
          onclick="window.location.href='core-flow.html'">
          🔙 Return to App
        </button>
      </div>`;
  },

  updateUserUI(userData) {
    // تحديث اسم المستخدم في الواجهة
    document.querySelectorAll('#userName, .user-name-display').forEach(el => {
      el.textContent = userData.name || userData.email || 'User';
    });

    // إظهار روابط الأدمن فقط إن وُجدت
    const adminLinks = document.querySelectorAll(
      '#dashboardLink, a[href="dashboard.html"], a[href="rtm-dashboard.html"]'
    );
    adminLinks.forEach(link => {
      link.style.display = (userData.role === 'admin' || userData.role === 'manager') ? 'inline-flex' : 'none';
    });
  }
};
