
document.addEventListener('DOMContentLoaded', async () => {
    console.log("Dashboard.js DOMContentLoaded - Explicit Join Fix Applied");

    const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3V0bXVzcGNhcmFseWR5Y21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDY3MDEsImV4cCI6MjA2MTAyMjcwMX0.3u5Y7pkH2NNnnoGLMWVfAa5b8fq88o1itRYnG1K38tE';
    
    let supabase;
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase client initialized in dashboard.js");
    } catch (error) {
        console.error("Supabase client initialization failed in dashboard.js:", error);
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) loadingMsg.innerHTML = '<p style="color:red;">Error connecting to services.</p>';
        return;
    }

    // DOM Elements
    const userNameDisplay = document.getElementById('userNameDisplay'); 
    const dashboardUserName = document.getElementById('dashboardUserName'); 
    const logoutButton = document.getElementById('logoutButton');
    const userInfoDiv = document.getElementById('userInfo');
    const loadingMessageDiv = document.getElementById('loadingMessage');
    const statsGridDiv = document.getElementById('statsGrid');
    const recentActivitySectionDiv = document.getElementById('recentActivitySection');
    const totalCallsEl = document.getElementById('totalCalls');
    const avgCallDurationEl = document.getElementById('avgCallDuration');
    const scenariosCompletedEl = document.getElementById('scenariosCompleted');
    const lastCallDateEl = document.getElementById('lastCallDate');
    const recentCallsTableBody = document.querySelector('#recentCallsTable tbody');
    const exportDataBtn = document.getElementById('exportDataBtn');

    async function loadDashboardData() {
        if (loadingMessageDiv) loadingMessageDiv.style.display = 'flex';
        if (statsGridDiv) statsGridDiv.style.display = 'none';
        if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'none';

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            console.error("Error fetching user or user not logged in:", userError);
            window.location.href = '../legacy/login.html?redirectTo=/core-flow/dashboard.html';
            return;
        }

        if (userNameDisplay && user.email) userNameDisplay.textContent = user.email.split('@')[0];
        if (dashboardUserName && user.email) dashboardUserName.textContent = user.email.split('@')[0];
        if (userInfoDiv) userInfoDiv.style.display = 'flex';
        
        if(logoutButton) {
            logoutButton.addEventListener('click', async () => { 
                const { error } = await supabase.auth.signOut();
                if (error) console.error("Logout error:", error);
                else window.location.href = '../legacy/login.html'; 
            });
        }

        console.log("Fetching call sessions for user:", user.id);
        const { data: callSessions, error: sessionsError } = await supabase
            .from('call_sessions')
            // ✅ THIS IS THE CORRECTED SELECT STATEMENT TO RESOLVE PGRST201
            // It explicitly tells Supabase to use the 'scenario_id' column from 'call_sessions'
            // to join with the 'call_scenarios' table.
            .select(`
                id, 
                start_time, 
                end_time, 
                total_duration_seconds, 
                completed_all_steps, 
                scenario_id, 
                call_scenarios!scenario_id(id, name)
            `) 
            .eq('user_id', user.id)
            .order('start_time', { ascending: false }); 

        if (sessionsError) {
            console.error("Error fetching call sessions:", sessionsError); 
            if (loadingMessageDiv) loadingMessageDiv.innerHTML = `<p style="color:red;">Could not load activity data. Error: ${sessionsError.message}</p>`;
            if (statsGridDiv) statsGridDiv.style.display = 'none'; 
            if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'none';
            return;
        }
        console.log("Fetched call sessions:", callSessions); 

        if (callSessions && callSessions.length > 0) {
            if (totalCallsEl) totalCallsEl.textContent = callSessions.length;
            const completedSessions = callSessions.filter(s => s.completed_all_steps === true);
            if (scenariosCompletedEl) scenariosCompletedEl.textContent = completedSessions.length;

            const totalDurationSum = callSessions.reduce((sum, session) => sum + (session.total_duration_seconds || 0), 0);
            const avgDuration = callSessions.length > 0 ? Math.round(totalDurationSum / callSessions.length) : 0;
            if (avgCallDurationEl) {
                const minutes = Math.floor(avgDuration / 60);
                const seconds = avgDuration % 60;
                avgCallDurationEl.textContent = `${minutes}m ${seconds}s`;
            }

            if (lastCallDateEl && callSessions[0].start_time) {
                const lastCall = new Date(callSessions[0].start_time);
                lastCallDateEl.textContent = lastCall.toLocaleDateString();
            }

            if (recentCallsTableBody) {
                recentCallsTableBody.innerHTML = ''; 
                const recentToDisplay = callSessions.slice(0, 5); 

                if (recentToDisplay.length === 0) {
                    recentCallsTableBody.innerHTML = '<tr><td colspan="4" class="placeholder-text">No call activity yet.</td></tr>';
                } else {
                    recentToDisplay.forEach(session => {
                        const row = recentCallsTableBody.insertRow();
                        // ✅ Accessing scenario name correctly (Supabase default property name for joined table)
                        const scenarioName = session.call_scenarios ? session.call_scenarios.name : (session.scenario_id || 'Unknown Scenario');
                        const startTime = session.start_time ? new Date(session.start_time).toLocaleString() : '-';
                        const durationSec = session.total_duration_seconds || 0;
                        const durationFormatted = `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;
                        const completedText = session.completed_all_steps ? 'Yes' : 'No';

                        row.insertCell().textContent = scenarioName;
                        row.insertCell().textContent = startTime;
                        row.insertCell().textContent = durationFormatted;
                        row.insertCell().textContent = completedText;
                    });
                }
            }
            if (statsGridDiv) statsGridDiv.style.display = 'grid';
            if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'block';

        } else { 
            console.log("No call sessions found for this user.");
            if (totalCallsEl) totalCallsEl.textContent = '0';
            if (avgCallDurationEl) avgCallDurationEl.textContent = '0m 0s';
            if (scenariosCompletedEl) scenariosCompletedEl.textContent = '0';
            if (lastCallDateEl) lastCallDateEl.textContent = '-';
            if (recentCallsTableBody) recentCallsTableBody.innerHTML = '<tr><td colspan="4" class="placeholder-text">No call activity yet.</td></tr>';
            if (statsGridDiv) statsGridDiv.style.display = 'grid'; 
            if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'block'; 
        }
        if (loadingMessageDiv) loadingMessageDiv.style.display = 'none';
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => { 
            const { data: { user } } = await supabase.auth.getUser(); 
            if (!user) { alert("Please log in to export data."); return; }

            const { data: allSessions, error } = await supabase
                .from('call_sessions')
                // ✅ Apply the same explicit join for export
                .select('*, call_scenarios!scenario_id(name)') 
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });
            
            if (error) {
                console.error("Error fetching data for export:", error);
                alert("Could not fetch data for export. " + error.message);
                return;
            }
            if (!allSessions || allSessions.length === 0) {
                alert("No data to export.");
                return;
            }
            
            const headers = Object.keys(allSessions[0]).filter(key => key !== 'call_scenarios'); 
            headers.push('scenario_name'); 
            const csvRows = [headers.join(',')]; 
            allSessions.forEach(session => {
                const values = headers.map(header => {
                    if (header === 'scenario_name') {
                        return session.call_scenarios ? `"${(session.call_scenarios.name || '').replace(/"/g, '""')}"` : '""'; 
                    }
                    const value = session[header];
                    if (typeof value === 'string') {
                        return `"${value.replace(/"/g, '""')}"`; 
                    }
                    return value === null || value === undefined ? '' : value;
                });
                csvRows.push(values.join(','));
            });
            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `elevo_call_data_${user.email.split('@')[0]}_${new Date().toISOString().slice(0,10)}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("CSV export not supported by your browser.");
            }
        });
    }
    loadDashboardData();
});
