// role-check.js
import { supabase } from './supabaseClient.js';

/**
 * Fetches the complete user profile, including name and role.
 * @returns {Promise<object|null>} User profile object or null.
 */
async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, role, name, email') // We need name and role
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Ignore 'not found' error for flexibility
        throw error;
    }
    
    // Return a combined object with auth data and profile data
    return {
        ...user,
        ...profile,
        role: profile?.role || 'agent' // Default to 'agent' if role is not set
    };

  } catch (e) {
    console.error('Error getting user profile:', e.message);
    return null;
  }
}

/**
 * Shows a non-intrusive modal for restricted access.
 */
function showProtectedModal(message = "This area is for administrators only.") {
  let modal = document.getElementById('access-restricted-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'access-restricted-modal';
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(10, 10, 20, 0.7); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s ease;
    `;
    modal.innerHTML = `
      <div style="text-align: center; color: #e5e7eb; background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 2.5rem;
        max-width: 420px; width: 90%; box-shadow: 0 4px 30px rgba(0,0,0,0.4);
        transform: scale(0.95); transition: transform 0.3s ease;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
        <h2 style="margin:0 0 0.75rem 0; font-size: 1.5rem;">Access Restricted</h2>
        <p style="margin-bottom: 2rem; color: #cbd5e1; line-height: 1.6;">${message}</p>
        <button class="modal-close-btn" style="background: #3b82f6; color: white; border: none; 
        border-radius: 8px; padding: 0.7rem 1.4rem; cursor: pointer; font-weight: 600; transition: background 0.2s ease;">Back to My Dashboard</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.modal-close-btn');
    
    closeBtn.addEventListener('mouseover', () => { closeBtn.style.background = '#2563eb'; });
    closeBtn.addEventListener('mouseout', () => { closeBtn.style.background = '#3b82f6'; });
    
    closeBtn.addEventListener('click', () => {
         modal.style.opacity = '0';
         modal.querySelector('div > div').style.transform = 'scale(0.95)';
         setTimeout(() => modal.style.display = 'none', 300);
         // Redirect to a safe page like core-flow after closing the modal
         window.location.href = './core-flow.html';
    });
  }
  modal.style.display = 'flex';
  setTimeout(() => {
      modal.style.opacity = '1';
      modal.querySelector('div > div').style.transform = 'scale(1)';
  }, 10);
}

/**
 * Main function to protect a page and set up the header.
 * @param {string[]} allowedRoles - Array of roles allowed to access the page (e.g., ['admin']).
 */
export async function protectPage(allowedRoles = []) {
    const userProfile = await getCurrentUserProfile();

    // If no user, redirect to login
    if (!userProfile) {
        window.location.href = './login.html';
        return;
    }

    const userInfoEl = document.getElementById('userInfo');
    if(userInfoEl) userInfoEl.style.display = 'flex';
    
    // Set user's name in the header
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = userProfile.name || userProfile.email; // Prioritize name
    }

    // Check if the user's role is in the allowed list
    const userRole = userProfile.role;
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // User is not allowed, show modal and hide content
        showProtectedModal(`This content requires administrative privileges.`);
        const mainContent = document.querySelector('.app-main');
        if (mainContent) mainContent.style.visibility = 'hidden';
        
        // Hide dashboard links if agent
        const adminDashboardLink = document.querySelector('a[href*="dashboard.html"]');
        const rtmDashboardLink = document.querySelector('a[href*="rtm-dashboard.html"]');
        if (adminDashboardLink) adminDashboardLink.style.display = 'none';
        if (rtmDashboardLink) rtmDashboardLink.style.display = 'none';
        
        return; // Stop further execution
    }
    
    // User is allowed, ensure admin links are visible if role is admin
    if (userRole === 'admin') {
        const adminDashboardLink = document.querySelector('a[href*="dashboard.html"]');
        const rtmDashboardLink = document.querySelector('a[href*="rtm-dashboard.html"]');
        if (adminDashboardLink) adminDashboardLink.style.display = 'inline-block';
        if (rtmDashboardLink) rtmDashboardLink.style.display = 'inline-block';
    }
    
    // Special case for Agent Portal: If admin, show banner
    if (window.location.pathname.includes('agent-portal.html') && userRole === 'admin') {
        const banner = document.createElement('div');
        banner.textContent = "👋 Admin View: This dashboard is intended for agents.";
        banner.style.cssText = `background: linear-gradient(90deg, #1e3a8a, #2563eb); color: white; text-align: center; padding: 12px; font-weight: 500; border-bottom: 1px solid #1e40af;`;
        const header = document.querySelector('.app-header');
        if (header) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        } else {
            document.body.prepend(banner);
        }
    }
}
