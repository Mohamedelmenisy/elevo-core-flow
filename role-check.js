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

function showAccessDeniedInCurrentPage(message = "This area is for administrators only.") {
  // نخفي كل محتوى الصفحة الحالية
  const mainContent = document.querySelector('.app-main');
  if (mainContent) mainContent.style.display = 'none';
  
  const statusBar = document.querySelector('.status-bar');
  if (statusBar) statusBar.style.display = 'none';
  
  const footer = document.querySelector('.app-footer');
  if (footer) footer.style.display = 'none';

  // نعرض رسالة جميلة في وسط الصفحة
  const accessDeniedHTML = `
    <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 70vh;
        text-align: center;
        padding: 2rem;
    ">
        <div style="
            width: 100px; height: 100px; 
            margin-bottom: 2rem; 
            background: rgba(239, 68, 68, 0.1); 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 3px solid rgba(239, 68, 68, 0.3);
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>
        
        <h1 style="
            font-size: 2rem; 
            margin-bottom: 1rem; 
            color: #f9fafb; 
            font-weight: 700;
        ">Access Restricted</h1>
        
        <p style="
            margin-bottom: 2.5rem; 
            color: #d1d5db; 
            line-height: 1.6;
            font-size: 1.1rem;
            max-width: 500px;
        ">${message}</p>
        
        <button onclick="window.location.href='core-flow.html'" style="
            background: linear-gradient(135deg, #4e8cff, #3b82f6);
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.5rem;">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Back to Core Flow
        </button>
    </div>
  `;

  // نضيف الرسالة للصفحة
  const container = document.querySelector('.app-container') || document.body;
  container.insertAdjacentHTML('beforeend', accessDeniedHTML);
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
        // نمنع الوصول ونعرض الرسالة في الصفحة الحالية
        showAccessDeniedInCurrentPage(
            `This area requires administrative privileges.<br><br>
            Your current role: <strong style="color: #ef4444;">${userProfile.role}</strong><br><br>
            Please contact your administrator if you need access to this section.`
        );
        return;
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
