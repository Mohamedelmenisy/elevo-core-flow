// ✅ role-check.js - Unified Role Validation and Redirection System
window.roleCheck = {
  supabase: null,
  currentUser: null,

  // 🔹 Common check for any page
  async checkAccessByRole(allowedRoles = []) {
    // 1. Initialize Supabase
    if (!this.supabase) {
      const SUPABASE_URL = "https://aefiigottnlcmjzilqnh.supabase.co";
      const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4";
      try {
        this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      } catch (e) {
        console.error("Supabase client initialization failed:", e);
        this.showAccessDenied("Service connection error");
        return null;
      }
    }

    try {
      // 2. Get Authenticated User
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        window.location.replace("login.html");
        return null;
      }

      // 3. Get User Data
      const { data: userData, error } = await this.supabase
        .from("users")
        .select("id, name, email, role")
        .eq("id", user.id)
        .single();

      if (error || !userData) {
        console.error("User data fetch failed:", error);
        window.location.replace("login.html");
        return null;
      }

      this.currentUser = userData;
      this.updateUserInterface(userData);

      // 4. Role Validation
      if (!allowedRoles.includes(userData.role)) {
        this.showAccessDenied(userData.role);
        return null;
      }

      console.log(`✅ Access granted for ${userData.role}`);
      return userData;

    } catch (err) {
      console.error("Access check error:", err.message);
      this.showAccessDenied();
      return null;
    }
  },

  // 🔹 Check for Agent
  async checkAgentAccess() {
    return await this.checkAccessByRole(['agent']);
  },

  // 🔹 Check for Admin / Manager
  async checkAdminAccess() {
    return await this.checkAccessByRole(['admin', 'manager']);
  },

  // 🔹 Update Name / Header Info
  updateUserInterface(userData) {
    const nameEl = document.getElementById("userName");
    if (nameEl) {
      nameEl.textContent = userData.name || userData.email || "User";
    }
  },

  // 🔹 Access Denied UI
  showAccessDenied(role = "unknown") {
    const mainViews = ['auth-loading', 'initial-view', 'call-flow-view', 'postCallSummary'];
    mainViews.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    // Create modal dynamically if not exists
    if (!document.getElementById("accessDeniedModal")) {
      const modalHTML = `
        <div id="accessDeniedModal" style="position:fixed;top:0;left:0;width:100%;height:100%;
          background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;">
          <div style="background:#1e1e2f;color:white;padding:2rem;border-radius:14px;text-align:center;width:380px;">
            <h2 style="margin-bottom:1rem;">Access Denied</h2>
            <p>You don't have permission to access this page.<br><br>
            This section is for <strong>Admins / Managers</strong> only.</p>
            <button id="returnToAppBtn" style="margin-top:1.5rem;background:#4e8cff;
              color:white;border:none;border-radius:8px;padding:0.7rem 1.5rem;cursor:pointer;">
              🔙 Return to Login
            </button>
          </div>
        </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Handle return
    const returnBtn = document.getElementById("returnToAppBtn");
    if (returnBtn) {
      returnBtn.addEventListener('click', async () => {
        if (this.supabase) await this.supabase.auth.signOut();
        window.location.href = "login.html";
      });
    }
  }
};
