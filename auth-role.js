// --- START OF FILE auth-role.js ---

/* 
 * auth-role.js - Unified helper for role-based access control.
 * - getCurrentUserRole(): Fetches the role of the logged-in user.
 * - showAccessDeniedModal(): Displays a full-screen modal for restricted access.
 * - applyNavVisibility(): Hides or protects navigation links based on user role.
 */
import { supabase } from './supabaseClient.js';

/**
 * Gets the current user's role from the 'users' table.
 * @returns {Promise<string|null>} The user's role (e.g., 'admin', 'agent') or null.
 */
export async function getCurrentUserRole() {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user role. This might be due to RLS policies on the `users` table.', error);
      return null; // Critical failure, likely RLS
    }

    return profile?.role || 'agent'; // Default to 'agent' if role is not set
  } catch (e) {
    console.error('Exception occurred in getCurrentUserRole:', e);
    return null;
  }
}

/**
 * Makes the "Access Denied" modal visible.
 */
export function showAccessDeniedModal() {
  const modal = document.getElementById('accessDeniedModal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

/**
 * Hides or protects navigation links based on user role.
 * Links with `data-role-required="admin"` will be hidden from non-admins.
 * @param {string|null} role The current user's role.
 */
export function applyNavVisibility(role) {
  document.querySelectorAll('[data-role-required]').forEach(el => {
    const requiredRole = el.getAttribute('data-role-required');
    if (role !== requiredRole) {
      el.style.display = 'none';
    } else {
      el.style.display = ''; // Or 'inline-flex', 'block', etc., depending on the element.
    }
  });
}
