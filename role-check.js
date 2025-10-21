// role-check.js
import { supabase } from './supabaseClient.js';

async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') {
        throw error;
    }
    
    return {
        ...user,
        ...profile,
        role: profile?.role || 'agent'
    };

  } catch (e) {
    console.error('Error getting user profile:', e.message);
    return null;
  }
}

export function showProtectedModal(message = "This area is for administrators only.", redirectUrl = 'core-flow.html') {
  let modal = document.getElementById('access-restricted-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'access-restricted-modal';
    modal.style.cssText = `
        position: fixed; 
        top: 0; left: 0; 
        width: 100%; height: 100%; 
        background-color: rgba(0, 0, 0, 0.8);
        display: flex; 
        justify-content: center; 
        align-items: center;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    
    modal.innerHTML = `
      <div style="
          background: linear-gradient(135deg, #1e293b, #334155);
          padding: 3rem;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          text-align: center;
          max-width: 400px;
          width: 90%;
          transform: scale(0.9);
          transition: transform 0.3s ease;
      ">
        <div style="
            width: 80px; height: 80px; 
            margin: 0 auto 1.5rem; 
            background: rgba(239, 68, 68, 0.1); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 2px solid rgba(239, 68, 68, 0.3);
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>
        
        <h3 style="
            font-size: 1.5rem; 
            margin-bottom: 1rem; 
            color: #f9fafb; 
            font-weight: 700;
        ">Access Restricted</h3>
        
        <p style="
            margin-bottom: 2rem; 
            color: #d1d5db; 
            line-height: 1.6;
            font-size: 1rem;
        ">${message}</p>
        
        <button id="modal-close-btn" style="
            background: linear-gradient(135deg, #4e8cff, #3b82f6);
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
        ">Okay</button>
      </div>
    `;
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('#modal-close-btn');
    const modalContainer = modal.querySelector('div');

    const hideModal = () => {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.visibility = 'hidden';
            // If the redirect URL is the current page, it might just close the modal
            // without a full reload, which is fine.
            if (window.location.pathname.endsWith(redirectUrl) === false) {
                 window.location.href = redirectUrl;
            }
        }, 300);
    };

    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });

    // Show modal with animation
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modalContainer.style.transform = 'scale(1)';
    }, 10);
  } else {
    // If modal exists, just show it
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    const modalContainer = modal.querySelector('div');
    if (modalContainer) modalContainer.style.transform = 'scale(1)';
  }
}

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
        userNameEl.textContent = userProfile.name || userProfile.email;
    }

    // Check if the current page is protected and if the user has access
    if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
        // **FIX:** Immediately redirect to a safe page with an error flag
        window.location.href = `core-flow.html?auth_error=restricted&role=${userProfile.role}`;
        return; // Stop further execution on this page
    }
    
    // Special case for Agent Portal: If admin, show banner
    if (window.location.pathname.includes('agent-portal.html') && userProfile.role === 'admin') {
        const banner = document.createElement('div');
        banner.textContent = "👋 Admin View: This dashboard is intended for agents.";
        banner.style.cssText = `
            background: linear-gradient(90deg, #1e3a8a, #2563eb); 
            color: white; 
            text-align: center; 
            padding: 12px; 
            font-weight: 500; 
            border-bottom: 1px solid #1e40af;
            font-size: 0.9rem;
        `;
        const header = document.querySelector('.app-header');
        if (header) {
            header.parentNode.insertBefore(banner, header.nextSibling);
        }
    }
}
