// supabaseClient.js
// ESM module - drop this file in the same folder حيث باقي صفحات الـ frontend
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// ------ (تم تحديث هذه القيم من المشروع) ------
export const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';
// -----------------------------------

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Returns the current session object or null
 */
export async function getSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch (err) {
    console.error('getSession error', err);
    return null;
  }
}

/**
 * Query the users table for a single row by userId
 * Returns null on not found / error
 */
export async function getUserRow(userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('getUserRow error', error);
      return null;
    }
    return data ?? null;
  } catch (err) {
    console.error('getUserRow exception', err);
    return null;
  }
}

/**
 * Convenience: get current user's row using session (returns null if no session / no row)
 */
export async function getCurrentUserRow() {
  try {
    const sessionObj = await supabase.auth.getSession();
    const session = sessionObj?.data?.session ?? null;
    if (!session) return null;
    const userId = session.user?.id;
    if (!userId) return null;
    return await getUserRow(userId);
  } catch (err) {
    console.error('getCurrentUserRow error', err);
    return null;
  }
}

/**
 * Optional: small helper to sign out
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('signOut error', err);
    return false;
  }
}

// Keep a debug auth-state listener for convenience during development
supabase.auth.onAuthStateChange((event, session) => {
  console.debug('Supabase auth event:', event);
  // you may handle global redirects here if you prefer
});
