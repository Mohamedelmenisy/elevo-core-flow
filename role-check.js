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
      background: radial-gradient(circle at 20% 20%, rgba(78,140,255,0.2), rgba(15,23,42,0.95));
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.4s ease;
      backdrop-filter: blur(18px);
      overflow: hidden;
    `;

    modal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(31,41,55,0.9), rgba(17,24,39,0.95));
        padding: 3rem;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,0.15);
        box-shadow: 0 25px 60px rgba(0,0,0,0.6);
        text-align: center;
        max-width: 420px;
        width: 90%;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        position: relative;
      ">
        <div style="
          width: 85px; height: 85px;
          margin: 0 auto 1.5rem;
          background: rgba(239,68,68,0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(239,68,68,0.4);
          box-shadow: 0 0 25px rgba(239,68,68,0.2);
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        <h3 style="font-size: 1.6rem; margin-bottom: 1rem; color: #f9fafb; font-weight: 700;">
          Access Restricted
        </h3>

        <p style="
          margin-bottom: 2rem;
          color: #d1d5db;
          line-height: 1.6;
          font-size: 1rem;
        ">${message}</p>

        <button id="modal-close-btn" style="
          background: linear-gradient(135deg, #4e8cff, #2563eb);
          color: white;
          border: none;
          padding: 0.8rem 2.2rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          box-shadow: 0 0 15px rgba(78,140,255,0.3);
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

    // إظهار الرسالة بانيميشن
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
