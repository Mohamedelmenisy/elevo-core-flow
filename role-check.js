
// role-check.js
// Shared Role-Based Access Control (RBAC) script.
// Uses existing window.supabase if available (Supabase JS v2).
// If window.supabase is not available, the script will warn and do nothing.
//
// Behavior:
// - Determines page type (admin-only pages) using filename/title heuristics.
// - Fetches current user and their role from 'users' table.
// - If the role is not authorized for this page, shows a styled popup overlay (English).
//
// Note: Ensure your pages include Supabase client (window.supabase) or modify this file to init it.

(async function(){
  // small helper
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Determine allowed roles per page
  const pathname = location.pathname.toLowerCase();
  const title = (document.title || "").toLowerCase();

  // default: allow everyone
  let allowedRoles = null; // null means allow all authenticated users

  // heuristics for admin pages (matches filenames or title keywords)
  const isAdminPage = pathname.includes('dashboard admin') || title.includes('admin dashboard') || pathname.includes('dashboard-admin') || pathname.includes('admin-dashboard');
  const isRtmPage = pathname.includes('rtm') || title.includes('rtm dashboard') || pathname.includes('rtm-dashboard');

  if (isAdminPage || isRtmPage) {
    allowedRoles = ['admin', 'manager'];
  } else {
    // other pages (core flow, agent portal) allow all authenticated users (agents, admin, manager)
    allowedRoles = ['agent', 'admin', 'manager'];
  }

  // If user isn't authenticated, don't block — let page handle login flow.
  // Check for window.supabase
  if (!window.supabase || typeof window.supabase.auth?.getUser !== 'function') {
    console.warn('[role-check] window.supabase or supabase.auth.getUser() not found. Skipping RBAC check. If you want role-check to work, ensure Supabase client is initialized as window.supabase (v2).');
    return;
  }

  try {
    const userRes = await window.supabase.auth.getUser();
    const user = userRes?.data?.user;
    if (!user) {
      // not logged in — do not block here
      return;
    }

    // fetch role from users table
    const { data, error } = await window.supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      console.warn('[role-check] could not fetch role for user:', error);
      return;
    }

    const role = (data.role || '').toLowerCase();

    // if allowedRoles is null -> allow everyone
    if (Array.isArray(allowedRoles) && !allowedRoles.includes(role)) {
      // show popup
      showAccessPopup(role, allowedRoles);
    } else {
      // allowed — nothing to do
    }

  } catch (e) {
    console.error('[role-check] unexpected error', e);
  }

  // creates and shows overlay popup
  function showAccessPopup(role, allowedRoles) {
    // prevent multiple popups
    if (document.getElementById('rbac-overlay')) return;

    // overlay
    const overlay = document.createElement('div');
    overlay.id = 'rbac-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(2,6,23,0.6)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '99999';
    overlay.style.backdropFilter = 'blur(4px)';

    // popup box
    const box = document.createElement('div');
    box.id = 'rbac-box';
    box.style.maxWidth = '520px';
    box.style.width = '92%';
    box.style.background = 'linear-gradient(180deg, rgba(17,24,39,0.98), rgba(31,41,55,0.98))';
    box.style.border = '1px solid rgba(99,102,241,0.12)';
    box.style.borderRadius = '12px';
    box.style.padding = '26px';
    box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
    box.style.color = '#e6eef8';
    box.style.fontFamily = 'Inter, Poppins, system-ui, sans-serif';

    // title
    const title = document.createElement('h2');
    title.textContent = '⚠️ Access Restricted';
    title.style.margin = '0 0 8px 0';
    title.style.fontSize = '20px';
    title.style.letterSpacing = '0.2px';

    // message
    const msg = document.createElement('p');
    msg.textContent = 'This page is for admins only.';
    msg.style.margin = '0 0 18px 0';
    msg.style.color = '#c7d2fe';

    // small info
    const info = document.createElement('p');
    info.textContent = `Your role: ${role || 'unknown'}  •  Required: ${allowedRoles.join(', ')}`;
    info.style.margin = '0 0 18px 0';
    info.style.fontSize = '13px';
    info.style.color = '#9ca3af';

    // buttons container
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '10px';
    actions.style.justifyContent = 'flex-end';

    // back button
    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back to Dashboard';
    backBtn.style.padding = '10px 14px';
    backBtn.style.borderRadius = '10px';
    backBtn.style.border = 'none';
    backBtn.style.cursor = 'pointer';
    backBtn.style.fontWeight = '600';
    backBtn.style.background = 'linear-gradient(90deg,#6366f1,#58a6ff)';
    backBtn.style.color = 'white';
    backBtn.onclick = () => {
      // try to navigate to agent portal or core flow
      const fallback = '/agent-portal core flow .html';
      // If current page has an agent dashboard link, prefer that; otherwise fallback
      window.location.href = fallback;
    };

    // close button (dismiss overlay)
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.padding = '10px 14px';
    closeBtn.style.borderRadius = '10px';
    closeBtn.style.border = '1px solid rgba(99,102,241,0.14)';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = '600';
    closeBtn.style.background = 'transparent';
    closeBtn.style.color = '#e6eef8';
    closeBtn.onclick = () => {
      overlay.remove();
    };

    actions.appendChild(closeBtn);
    actions.appendChild(backBtn);

    // append elements
    box.appendChild(title);
    box.appendChild(msg);
    box.appendChild(info);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // prevent interaction with background
    document.body.style.pointerEvents = 'none';
    box.style.pointerEvents = 'auto';
    // restore pointer events when overlay removed
    overlay.addEventListener('remove', () => {
      document.body.style.pointerEvents = '';
    });
  }

})();
