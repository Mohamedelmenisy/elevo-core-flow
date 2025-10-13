// ✅ role-check.js - Unified Role Validation and Redirection System
window.roleCheck = {
  supabase: null,
  currentUser: null,

  // This function is called by the main application to check access
  async checkAgentAccess() {
    // 1. Initialize Supabase Client
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
      // 2. Get the authenticated user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        window.location.replace("login.html");
        return null;
      }

      // 3. Fetch user details and role from the 'users' table
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

      // 4. Update the UI with the user's name
      this.updateUserInterface(userData);

      // 5. Perform role-based redirection
      if (userData.role === 'agent') {
        window.location.href = 'agent-portal.html';
        return null; // Return null to halt execution on the current page
      }

      // 6. Check if the user has permission for the current page (non-agents)
      const allowedRoles = ['admin', 'manager', 'owner'];
      if (!allowedRoles.includes(userData.role)) {
        this.showAccessDenied(userData.role);
        return null;
      }

      // 7. If all checks pass, return the user data to the application
      console.log(`Access granted for: ${userData.role}`);
      return userData;

    } catch (err) {
      console.error("Access check error:", err.message);
      this.showAccessDenied();
      return null;
    }
  },

  updateUserInterface(userData) {
    const nameEl = document.getElementById("userName");
    if (nameEl) {
      nameEl.textContent = userData.name || userData.email || "User";
    }
    const dashboardLink = document.getElementById("dashboardLink");
    if (dashboardLink && (userData.role === 'admin' || userData.role === 'manager')) {
        dashboardLink.style.display = 'inline-flex';
    }
  },

  showAccessDenied(role = "unknown") {
    // Hide the main application content
    const mainViews = ['auth-loading', 'initial-view', 'call-flow-view', 'postCallSummary'];
    mainViews.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = 'none';
    });
    
    // Show the modal
    const modal = document.getElementById("accessDeniedModal");
    if (modal) {
      const desc = document.getElementById("accessDeniedDesc");
      if(desc) desc.innerHTML = `You don't have permission to view this page. This section is available for <strong>Admins</strong> only.`;
      
      modal.style.display = "flex";
      
      const returnBtn = document.getElementById("returnToAppBtn");
      if(returnBtn) returnBtn.addEventListener('click', () => {
          // Attempt to log out before redirecting
          if(this.supabase) this.supabase.auth.signOut();
          window.location.href = 'login.html';
      });
    }
  }
};
