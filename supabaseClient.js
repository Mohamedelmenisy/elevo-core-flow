import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = 'https://aefiigottnlcmjzilqnh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Ensure there is a row in 'users' table for this authenticated user.
 * If missing, insert with default role 'agent'.
 */
export async function ensureUserRow() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data, error } = await supabase.from('users').select('id, role').eq('id', user.id).single();
        if (error && error.code === 'PGRST116') {
            // no row found - insert
            const { error: insertError } = await supabase.from('users').insert({ id: user.id, email: user.email, role: 'agent' });
            if (insertError) throw insertError;
            return 'agent';
        }
        if (!data) {
            // upsert default
            const { error: upsertError } = await supabase.from('users').upsert({ id: user.id, email: user.email, role: 'agent' }, { onConflict: 'id' });
            if (upsertError) throw upsertError;
            return 'agent';
        }
        return data.role || 'agent';
    } catch (err) {
        console.warn('ensureUserRow error', err);
        return 'agent';
    }
}

export async function getUserRole() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (error) {
            console.warn('getUserRole supabase error', error);
            return 'agent';
        }
        return data?.role || 'agent';
    } catch (err) {
        console.warn('getUserRole error', err);
        return 'agent';
    }
}

// Listen for sign-in to ensure users table row exists
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
        try {
            await ensureUserRow();
        } catch (e) {
            console.warn('Error ensuring user row:', e);
        }
    }
});
