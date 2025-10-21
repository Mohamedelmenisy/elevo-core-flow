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
      background: radial-gradient(circle at center, rgba(10,10,10,0.95) 0%, rgba(0,0,0,1) 80%);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.4s ease;
      backdrop-filter: blur(10px);
    `;

    modal.innerHTML = `
      <div style="
        background: rgba(20, 24, 35, 0.7);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 0 80px rgba(78,140,255,0.15);
        border-radius: 24px;
        padding: 3rem 2.5rem;
        max-width: 420px;
        width: 90%;
        text-align: center;
        transform: scale(0.9);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        animation: modalPop 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        <div style="
          width: 88px; height: 88px;
          margin: 0 auto 1.8rem;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(78,140,255,0.15), rgba(78,140,255,0.05));
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(78,140,255,0.3);
          box-shadow: 0 0 25px rgba(78,140,255,0.25);
          animation: pulseGlow 2s infinite ease-in-out;
        ">
          <svg xmlns="http://www.w3.org/2000/svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        <h3 style="
          font-size: 1.7rem;
          font-weight: 700;
          margin-bottom: 1rem;
          color: #f9fafb;
          letter-spacing: 0.3px;
          background: linear-gradient(90deg, #ffffff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        ">
          Access Restricted
        </h3>

        <p style="
          margin-bottom: 2rem;
          color: #cbd5e1;
          line-height: 1.6;
          font-size: 1rem;
          opacity: 0.9;
        ">${message}</p>

        <button id="modal-close-btn" style="
          background: linear-gradient(135deg, #3b82f6, #60a5fa);
          color: white;
          border: none;
          padding: 0.9rem 2.4rem;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          font-size: 1rem;
          box-shadow: 0 0 25px rgba(78,140,255,0.25);
        ">Okay</button>
      </div>

      <style>
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 25px rgba(78,140,255,0.25); transform: scale(1); }
          50% { box-shadow: 0 0 45px rgba(78,140,255,0.4); transform: scale(1.05); }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes buttonPress {
          0% { transform: scale(1); box-shadow: 0 0 25px rgba(78,140,255,0.25); }
          40% { transform: scale(0.93); box-shadow: 0 0 10px rgba(78,140,255,0.5); }
          100% { transform: scale(1); box-shadow: 0 0 25px rgba(78,140,255,0.25); }
        }
        #modal-close-btn:hover {
          transform: scale(1.04);
          box-shadow: 0 0 35px rgba(96,165,250,0.4);
        }
        #modal-close-btn:active {
          animation: buttonPress 0.25s ease;
        }
      </style>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#modal-close-btn');
    const modalContainer = modal.querySelector('div');

    const hideModal = () => {
      closeBtn.style.animation = 'buttonPress 0.25s ease';
      setTimeout(() => {
        modal.style.opacity = '0';
        setTimeout(() => {
          modal.style.visibility = 'hidden';
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            history.replaceState(null, '', 'core-flow.html');
            location.reload();
          }
        }, 250);
      }, 100);
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
