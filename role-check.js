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
 * Shows a modern, non-intrusive modal for restricted access.
 */
function showProtectedModal(message = "This area is for administrators only.") {
  let modal = document.getElementById('access-restricted-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'access-restricted-modal';
    // Using styles consistent with the existing modal system
    modal.style.cssText = `
        position: fixed; inset: 0; z-index: 10000;
        background-color: rgba(0, 0, 0, .7);
        display: flex; justify-content: center; align-items: center;
        opacity: 0; visibility: hidden; transition: opacity .3s ease, visibility .3s ease;
        backdrop-filter: blur(5px);
    `;
    
    // Modernized modal content using existing CSS variables for a consistent look
    modal.innerHTML = `
      <div class="modal-container" style="text-align: center; transform: scale(.9); transition: transform .3s ease; border-color: #F44336;">
        <div style="width: 72px; height: 72px; margin: 0 auto 1.5rem; background: rgba(244, 67, 54, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(244, 67, 54, 0.2);">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F44336" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
        </div>
        <h3 class="modal-title" style="font-size: 1.75rem; margin-bottom: 1rem; color: #f0f0f0;">Access Denied</h3>
        <p class="modal-body" style="margin-bottom: 2.5rem; font-size: 1.1rem;">${message}</p>
        <div class="modal-actions">
            <button id="modal-close-btn" class="nav-button danger-button">Okay</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('#modal-close-btn');
    const modalContainer = modal.querySelector('.modal-container');

    const hideModal = () => {
        if (modalContainer) modalContainer.style.transform = 'scale(0.9)';
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.visibility = 'hidden';
            // IMPORTANT: No longer redirects the user away from the page.
        }, 300);
    };

    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
  }

  // Show modal logic
  modal.style.visibility = 'visible';
  setTimeout(() => {
      modal.style.opacity = '1';
      const modalContainer = modal.querySelector('.modal-container');
      if (modalContainer) modalContainer.style.transform = 'scale(1)';
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

    // Set user's name in the header
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = userProfile.name || userProfile.email; // Prioritize name
    }
    
    // First, handle role-based link visibility
    const adminDashboardLink = document.querySelector('a[href*="dashboard.html"]');
    const rtmDashboardLink = document.querySelector('a[href*="rtm-dashboard.html"]');
    
    if (userProfile.role === 'admin') {
        if (adminDashboardLink) adminDashboardLink.style.display = 'inline-flex';
        if (rtmDashboardLink) rtmDashboardLink.style.display = 'inline-flex';
    } else {
        if (adminDashboardLink) adminDashboardLink.style.display = 'none';
        if (rtmDashboardLink) rtmDashboardLink.style.display = 'none';
    }

    // Now, check if the current page is protected and if the user has access
    if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
        // User is not allowed, show modal and hide content
        showProtectedModal(`This content requires administrative privileges.`);
        const mainContent = document.querySelector('.app-main');
        if (mainContent) mainContent.style.visibility = 'hidden';
        return; // Stop further execution for this page
    }
    
    // Special case for Agent Portal: If admin, show banner
    if (window.location.pathname.includes('agent-portal.html') && userProfile.role === 'admin') {
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
