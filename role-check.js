// ✅ role-check.js - Unified Role Validation System
window.roleCheck = {
  async init(allowedRoles = []) {
    try {
      if (!window.supabase) throw new Error("Supabase not loaded");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("login.html");
        return null;
      }

      const { data: userData, error } = await supabase
        .from("users")
        .select("id, name, email, role")
        .eq("id", user.id)
        .single();

      if (error || !userData) {
        console.error("User data fetch failed:", error);
        window.location.replace("login.html");
        return null;
      }

      // ✅ تحديث واجهة المستخدم
      this.updateUI(userData);

      // ✅ التحقق من الصلاحيات
      if (allowedRoles.includes(userData.role)) {
        console.log(`✅ Access granted for ${userData.role}`);
        return userData;
      } else {
        this.showAccessDenied(userData.role);
        return null;
      }

    } catch (err) {
      console.error("Access Error:", err.message);
      this.showAccessDenied();
      return null;
    }
  },

  updateUI(userData) {
    document.querySelectorAll("#userName, .user-name-display").forEach(el => {
      el.textContent = userData.name || userData.email;
    });

    const dashboardLink = document.querySelector('a[href="dashboard.html"]');
    const rtmLink = document.querySelector('a[href="rtm-dashboard.html"]');
    const kbLink = document.querySelector('a[href="knowledge-base.html"]');

    // إخفاء الكل في البداية
    [dashboardLink, rtmLink, kbLink].forEach(l => l && (l.style.display = "none"));

    if (userData.role === "admin" || userData.role === "manager") {
      if (dashboardLink) dashboardLink.style.display = "inline-flex";
      if (rtmLink) rtmLink.style.display = "inline-flex";
    }

    if (kbLink) kbLink.style.display = "inline-flex"; // الكل يشوفها
  },

  showAccessDenied(role = "unknown") {
    const modal = document.createElement("div");
    modal.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); display: flex; justify-content: center;
        align-items: center; z-index: 9999; color: white; text-align: center;
        flex-direction: column;
      ">
        <h1 style="color: #ff4d4d;">Access Restricted</h1>
        <p>Your role <strong>${role}</strong> does not have permission to access this page.</p>
        <button style="
          background: #4e8cff; border: none; padding: 0.75rem 1.5rem;
          border-radius: 10px; color: white; font-weight: 600; cursor: pointer;
          margin-top: 1rem;
        " onclick="window.location.href='core-flow.html'">
          🔙 Return to Core Flow
        </button>
      </div>
    `;
    document.body.innerHTML = "";
    document.body.appendChild(modal);
  }
};
