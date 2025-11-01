// role-check.js — Premium Edition ✨
import { supabase } from './supabaseClient.js';

// 🧠 Get current user + profile + role
async function getCurrentUserProfile() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
      .from('users')
      .select('id, role, name, email')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

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

// 🚫 Sleek “Access Restricted” modal
function showProtectedModal(message = "This area is for administrators only.", redirectUrl = 'core-flow.html') {
  // Remove any existing modal before creating a new one
  const existing = document.getElementById('access-restricted-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'access-restricted-modal';
  modal.className = 'access-modal';
  modal.innerHTML = `
    <div class="access-overlay"></div>
    <div class="access-card">
      <div class="access-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>

      <h2 class="access-title">Access Restricted</h2>
      <p class="access-text">${message}</p>

      <button id="modal-close-btn" class="access-btn">
        <span>Okay</span>
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  setTimeout(() => modal.classList.add('open'), 10);

  // close logic
  const closeBtn = modal.querySelector('#modal-close-btn');
  closeBtn.addEventListener('click', () => hideModal());
  modal.addEventListener('click', (e) => { if (e.target === modal.querySelector('.access-overlay')) hideModal(); });

  function hideModal() {
    modal.classList.remove('open');
    setTimeout(() => {
      modal.remove();
      if (redirectUrl) window.location.href = redirectUrl;
      else history.replaceState(null, '', 'core-flow.html');
    }, 350);
  }
}

// 🔐 Role protection for any page (Final Version)
export async function protectPage(allowedRoles = [], contentId = 'app-content') {
  const userProfile = await getCurrentUserProfile();
  const authLoader = document.getElementById('auth-loader');
  const appContent = document.getElementById(contentId);

  // Case 1: No user is logged in, redirect to login
  if (!userProfile) {
    window.location.href = './login.html';
    return null;
  }

  // Update the user name display if it exists
  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = userProfile.name || userProfile.email;

  // Case 2: User does not have the required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    if (authLoader) authLoader.style.display = 'none'; // Hide loader
    if (appContent) appContent.style.display = 'none'; // Hide main content
    
    // We REMOVED the line that wipes the body (document.body.innerHTML = '')
    
    showProtectedModal(
      `Access Denied<br>Your current role: <strong>${userProfile.role}</strong>`,
      'core-flow.html'
    );
    return null; // Return null to signal failure and stop further script execution
  }

  // Case 3: Success! User has the required role
  if (authLoader) authLoader.style.display = 'none';
  if (appContent) {
      appContent.style.display = 'block';
  }
  
  return userProfile; // Return the user profile on success
}

// 🌌 Premium Styles injected dynamically
const style = document.createElement('style');
style.textContent = `
.access-modal {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
.access-modal.open {
  opacity: 1;
  pointer-events: all;
}
.access-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(10,10,10,0.92) 0%, rgba(0,0,0,0.96) 90%);
  backdrop-filter: blur(14px);
  animation: fadeIn 0.5s ease forwards;
}
.access-card {
  position: relative;
  z-index: 1;
  background: rgba(25, 30, 45, 0.8);
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.08);
  padding: 3rem 2.5rem;
  width: 90%;
  max-width: 440px;
  color: #fff;
  text-align: center;
  box-shadow: 0 0 80px rgba(0,0,0,0.6);
  transform: scale(0.9);
  opacity: 0;
  animation: cardPop 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.access-icon {
  width: 90px; height: 90px;
  margin: 0 auto 1.8rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(96,165,250,0.15), rgba(96,165,250,0.05));
  border: 1px solid rgba(96,165,250,0.3);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 35px rgba(96,165,250,0.25);
  animation: pulse 2s infinite ease-in-out;
}
.access-title {
  font-size: 1.7rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #ffffff, #a5b4fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.4px;
}
.access-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #cbd5e1;
  opacity: 0.9;
  margin-bottom: 2rem;
}
.access-btn {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border: none;
  padding: 0.9rem 2.4rem;
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  cursor: pointer;
  box-shadow: 0 0 25px rgba(78,140,255,0.25);
  transition: all 0.25s ease;
}
.access-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 35px rgba(96,165,250,0.4);
}
.access-btn:active {
  transform: scale(0.93);
  box-shadow: 0 0 15px rgba(96,165,250,0.4);
}

@keyframes fadeIn {
  from { opacity: 0; } to { opacity: 1; }
}
@keyframes cardPop {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes pulse {
  0%,100% { transform: scale(1); box-shadow: 0 0 30px rgba(96,165,250,0.25); }
  50% { transform: scale(1.05); box-shadow: 0 0 60px rgba(96,165,250,0.4); }
}
`;
document.head.appendChild(style);
