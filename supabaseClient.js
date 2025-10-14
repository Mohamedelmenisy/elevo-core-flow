// supabaseClient.js
// Full file - creates a Supabase client, exposes window.supabase for compatibility,
// provides helper functions: getUserRole, subscribeToTable
// IMPORTANT: Replace the URL/KEY below with your environment-secure values if using server-side secrets.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aefiigottnlcmjzilqnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // persistSession: true is default; explicit for clarity
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      // tuning if needed
      eventsPerSecond: 10
    }
  }
});

// expose global for scripts that expect window.supabase (role-check.js)
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

// Auth state change listener (keeps behavior and logs consistent)
supabase.auth.onAuthStateChange((event, session) => {
  try {
    if (event === 'SIGNED_IN') {
      console.log('[supabase] User signed in:', session?.user?.email || session?.user?.id || session?.user);
    } else if (event === 'SIGNED_OUT') {
      console.log('[supabase] User signed out');
    } else {
      console.log('[supabase] Auth event:', event);
    }
  } catch (e) {
    console.warn('[supabase] onAuthStateChange handler error', e);
  }
});

/**
 * getUserRole
 * - returns: 'admin' | 'agent' | 'manager' | null (if not authenticated)
 * - throws only if Supabase call fails unexpectedly (network/db error)
 */
export async function getUserRole() {
  try {
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.warn('getUserRole: auth getUser error', authErr);
      return null;
    }
    const user = authData?.user;
    if (!user) return null;

    // Query role + is_admin (backwards compatibility)
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, role, is_admin, name, email')
      .eq('id', user.id)
      .single();

    if (error) {
      // If row-level policy denies access, fallback to default role 'agent'
      console.warn('getUserRole: profile fetch error', error);
      return 'agent';
    }
    // Backwards compatibility: if is_admin true -> admin
    if (profile && profile.is_admin === true) return 'admin';
    if (profile && profile.role) return profile.role;
    return 'agent';
  } catch (err) {
    console.error('getUserRole unexpected error', err);
    // fail-safe default
    return 'agent';
  }
}

/**
 * subscribeToTable(table, callback)
 * - helper to subscribe to realtime changes
 * - callback receives payload object
 * - returns subscription reference (so caller can unsubscribe)
 */
export function subscribeToTable(table, callback) {
  try {
    const subscription = supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        try {
          callback(payload);
        } catch (cbErr) {
          console.error('subscribeToTable callback error', cbErr);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[supabase] subscribed to ${table}`);
        }
      });

    return subscription;
  } catch (err) {
    console.error('subscribeToTable error', err);
    return null;
  }
}

/**
 * Utility: safeFetchUserProfile
 * - returns profile object or null
 */
export async function safeFetchUserProfile() {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return null;
    const { data, error } = await supabase.from('users').select('id, role, name, email, is_admin').eq('id', user.id).single();
    if (error) {
      console.warn('safeFetchUserProfile error', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('safeFetchUserProfile unexpected error', err);
    return null;
  }
}

/**
 * Optional helper to sign out (keeps consistency)
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('signOutUser error', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('signOutUser unexpected error', err);
    return false;
  }
}

// Default export for convenience
export default supabase;
