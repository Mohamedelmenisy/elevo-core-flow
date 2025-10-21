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

function showProtectedModal(message = "This area is for administrators only.", redirectUrl = 'core-flow.html') {
  let modal = document.getElementById('access-restricted-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'access-restricted-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: radial-gradient(circle at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.98) 70%, rgba(0,0,0,1) 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.4s ease;
      backdrop-filter: blur(8px);
      overflow: hidden;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(145deg, rgba(24, 24, 27, 0.95), rgba(15, 23, 42, 0.95));
        padding: 3rem;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.8), 0 0 120px rgba(78,140,255,0.1);
        text-align: center;
        max-width: 420px;
        width: 90%;
        transform: scale(0.9);
        transition: transform 0.3s ease;
      ">
        <div style="
          width: 90px; height: 90px;
          margin: 0 auto 1.8rem;
          background: radial-gradient(circle, rgba(239,68,68,0.2), rgba(239,68,68,0.05));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(239,68,68,0.4);
          box-shadow: 0 0 25px rgba(239,68,68,0.2);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        <h3 style="
          font-size: 1.7rem;
          margin-bottom: 1rem;
          color: #f9fafb;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-shadow: 0 0 10px rgba(255,255,255,0.15);
        ">
          Access Restricted
        </h3>

        <p style="
          margin-bottom: 2rem;
          color: #d1d5db;
          line-height: 1.6;
          font-size: 1rem;
          opacity: 0.9;
        ">${message}</p>

        <button id="modal-close-btn" style="
          background: linear-gradient(135deg, #4e8cff, #2563eb);
          color: white;
          border: none;
          padding: 0.9rem 2.4rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          box-shadow: 0 0 25px rgba(78,140,255,0.4);
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
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          history.replaceState(null, '', 'core-flow.html');
          location.reload();
        }
      }, 300);
    };

    closeBtn.addEventListener('click', hideModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

    setTimeout(() => {
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modalContainer.style.transform = 'scale(1)';
    }, 10);
  } else {
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    const modalContainer = modal.querySelector('div');
    if (modalContainer) modalContainer.style.transform = 'scale(1)';
  }
}

export async function protectPage(allowedRoles = []) {
  const userProfile = await getCurrentUserProfile();
  if (!userProfile) {
    window.location.href = './login.html';
    return;
  }

  const userNameEl = document.getElementById('userName');
  if (userNameEl) userNameEl.textContent = userProfile.name || userProfile.email;

  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    document.body.innerHTML = ''; // نوقف تحميل الصفحة
    showProtectedModal(
      `Access Denied.<br>Your current role: <strong>${userProfile.role}</strong>`,
      null
    );
    return;
  }
}
