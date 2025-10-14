 const supabaseUrl = 'https://aefiigottnlcmjzilqnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZmlpZ290dG5sY21qemlscW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNzY2MDQsImV4cCI6MjA2Mjc1MjYwNH0.FypB02v3tGMnxXV9ZmZMdMC0oQpREKOJWgHMPxUzwX4';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
    }
});

// Function to get user role
export async function getUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (error) throw error;
    return data?.role || 'agent';
}

// Realtime subscription helper
export function subscribeToTable(table, callback) {
    return supabase.from(table).on('*', callback).subscribe();
}
