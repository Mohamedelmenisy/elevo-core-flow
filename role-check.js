// role-check.js
// ESM module - import this from صفحاتك (مثال: import { enforcePageAccess } from './role-check.js')
import { supabase, getUserRow } from './supabaseClient.js';

/**
 * NEW: Shows a stylish, non-redirecting access denied modal inside the page.
 * It appears over the content and has an "Okay" button to go back.
 * @param {string} message - Optional custom message.
 */
export function showAccessDenied(message = "This area is for administrators only.") {
  // Remove any existing modal first to prevent duplicates
  const existingModal = document.querySelector('.access-restricted-backdrop');
  if (existingModal) existingModal.remove();

  const backdrop = document.createElement('div');
  backdrop.className = 'access-restricted-backdrop';
  
  // Create the modal content using the requested beautiful design
  backdrop.innerHTML = `
    <style>
      .access-restricted-backdrop {
        position: fixed; inset: 0;
        background: rgba(10, 10, 20, 0.7);
        backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        opacity: 0; transition: opacity 0.3s ease;
      }
      .access-restricted {
        text-align: center;
        color: #e5e7eb;
        background: rgba(255,255,255,0.03);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 14px;
        padding: 2.5rem 3rem;
        max-width: 420px;
        width: 90%;
        margin: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        transform: scale(0.95);
        transition: transform 0.3s ease;
      }
      .access-restricted .icon { font-size: 3rem; margin-bottom: 1rem; line-height: 1; }
      .access-restricted h2 { margin: 0 0 0.75rem 0; font-size: 1.5rem; color: #fff; }
      .access-restricted p { margin: 0 0 2rem 0; color: #cbd5e1; line-height: 1.6; }
      .access-restricted .back-btn {
          background: linear-gradient(90deg, #3b82f6, #2563eb);
          color: white; border: none; border-radius: 8px;
          padding: 0.7rem 1.4rem; cursor: pointer; transition: all 0.3s;
          font-weight: 600; font-size: 1rem;
      }
      .access-restricted .back-btn:hover { transform: scale(1.05); }
    </style>
    <div class="access-restricted">
      <div class="icon">🔒</div>
      <h2>Access Restricted</h2>
      <p>${message}</p>
      <button class="back-btn">Okay</button>
    </div>
  `;

  document.body.appendChild(backdrop);
  
  // Animate the modal in
  setTimeout(() => {
    backdrop.style.opacity = '1';
    backdrop.querySelector('.access-restricted').style.transform = 'scale(1)';
  }, 10);

  // Add event listener to the "Okay" button
  backdrop.querySelector('.back-btn').addEventListener('click', () => {
    // Redirect to a safe, default page as requested
    window.location.href = './core-flow.html';
  });
}

/**
 * NEW: Shows a banner at the top of the page for informational purposes.
 * @param {string} message The message to display in the banner.
 */
export function showAccessBanner(message = "This area is intended for agents and managers.") {
  const existingBanner = document.querySelector('.access-banner');
  if (existingBanner) existingBanner.remove();

  const banner = document.createElement('div');
  banner.className = 'access-banner';
  banner.textContent = message;
  
  // Inject banner styles dynamically
  const bannerStyle = document.createElement('style');
  bannerStyle.textContent = `
    .access-banner {
      background: linear-gradient(90deg, #2563eb, #1e3a8a);
      color: #fff;
      text-align: center;
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: fadeDown 0.4s ease-out;
    }
    @keyframes fadeDown {
      from { opacity: 0; transform: translateY(-100%); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(bannerStyle);
  
  // Prepend to body to ensure it's at the top
  document.body.prepend(banner);
}

/**
 * Enforce page access based on user roles.
 * allowedRoles: array of strings (e.g., ['admin', 'manager'])
 * returns { allowed: boolean, role: string, userRow: object|null }
 */
export async function enforcePageAccess(allowedRoles = []) {
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    if (!session) {
      window.location.href = './login.html';
      return { allowed: false, role: null, userRow: null };
    }

    const userRow = await getUserRow(session.user.id);
    const role = userRow?.role || 'agent'; // Default to 'agent' if role is not set
    const name = userRow?.name || session.user.email || 'Unknown';

    const el = document.getElementById('userName') || document.getElementById('userDisplay');
    if (el) el.textContent = name;

    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      // If no roles are specified, access is allowed by default.
      return { allowed: true, role, userRow };
    }

    if (!allowedRoles.includes(role)) {
      showAccessDenied(`This area is for ${allowedRoles.join(' and ')} users only.`);
      
      // Hide the main content to prevent interaction with the underlying page
      const mainContent = document.querySelector('.app-main');
      if (mainContent) mainContent.style.visibility = 'hidden';
      
      return { allowed: false, role, userRow };
    }

    // If we reach here, the user is allowed.
    return { allowed: true, role, userRow };
  } catch (err) {
    console.error('enforcePageAccess error', err);
    // Fallback to login page on any critical error
    try { window.location.href = './login.html'; } catch (e) {}
    return { allowed: false, role: null, userRow: null };
  }
}
