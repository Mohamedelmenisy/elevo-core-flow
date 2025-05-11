document.addEventListener('DOMContentLoaded', async () => {
    console.log("Dashboard.js DOMContentLoaded");

    const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co'; // استبدل إذا لزم الأمر
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3V0bXVzcGNhcmFseWR5Y21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDY3MDEsImV4cCI6MjA2MTAyMjcwMX0.3u5Y7pkH2NNnnoGLMWVfAa5b8fq88o1itRYnG1K38tE'; // استبدل إذا لزم الأمر
    
    let supabase;
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase client initialized in dashboard.js");
    } catch (error) {
        console.error("Supabase client initialization failed in dashboard.js:", error);
        // Display error to user on dashboard page
        const loadingMsg = document.getElementById('loadingMessage');
        if (loadingMsg) loadingMsg.innerHTML = '<p style="color:red;">Error connecting to services.</p>';
        return;
    }

    // DOM Elements
    const userNameDisplay = document.getElementById('userNameDisplay'); // For header
    const dashboardUserName = document.getElementById('dashboardUserName'); // For dashboard greeting
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
            // Redirect to login if not authenticated, as this page requires login
            window.location.href = '../legacy/login.html?redirectTo=/core-flow/dashboard.html';
            return;
        }

        if (userNameDisplay) userNameDisplay.textContent = user.email ? user.email.split('@')[0] : 'Agent';
        if (dashboardUserName) dashboardUserName.textContent = user.email ? user.email.split('@')[0] : 'Agent';
        if (userInfoDiv) userInfoDiv.style.display = 'flex';
        
        if(logoutButton) {
            logoutButton.addEventListener('click', async () => { 
                const { error } = await supabase.auth.signOut();
                if (error) console.error("Logout error:", error);
                else window.location.href = '../legacy/login.html'; 
            });
        }

        // Fetch call sessions for the current user
        const { data: callSessions, error: sessionsError } = await supabase
            .from('call_sessions')
            .select('start_time, total_duration_seconds, completed_all_steps, scenario_id, call_scenarios(name)') // Join with call_scenarios to get name
            .eq('user_id', user.id)
            .order('start_time', { ascending: false }); // Get recent calls first

        if (sessionsError) {
            console.error("Error fetching call sessions:", sessionsError);
            if (loadingMessageDiv) loadingMessageDiv.innerHTML = '<p style="color:red;">Could not load activity data.</p>';
            return;
        }

        if (callSessions && callSessions.length > 0) {
            // Calculate Stats
            if (totalCallsEl) totalCallsEl.textContent = callSessions.length;

            const completedSessions = callSessions.filter(s => s.completed_all_steps);
            if (scenariosCompletedEl) scenariosCompletedEl.textContent = completedSessions.length;

            const totalDurationSum = callSessions.reduce((sum, session) => sum + (session.total_duration_seconds || 0), 0);
            const avgDuration = callSessions.length > 0 ? Math.round(totalDurationSum / callSessions.length) : 0;
            if (avgCallDurationEl) {
                const minutes = Math.floor(avgDuration / 60);
                const seconds = avgDuration % 60;
                avgCallDurationEl.textContent = `${minutes}m ${seconds}s`;
            }

            if (lastCallDateEl) {
                const lastCall = new Date(callSessions[0].start_time);
                lastCallDateEl.textContent = lastCall.toLocaleDateString();
            }

            // Populate Recent Calls Table
            if (recentCallsTableBody) {
                recentCallsTableBody.innerHTML = ''; // Clear placeholder or old data
                const recentToDisplay = callSessions.slice(0, 5); // Display last 5 calls

                if (recentToDisplay.length === 0) {
                    recentCallsTableBody.innerHTML = '<tr><td colspan="4" class="placeholder-text">No call activity yet.</td></tr>';
                } else {
                    recentToDisplay.forEach(session => {
                        const row = recentCallsTableBody.insertRow();
                        const scenarioName = session.call_scenarios ? session.call_scenarios.name : (session.scenario_id || 'Unknown Scenario');
                        const startTime = new Date(session.start_time).toLocaleString();
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
            if (totalCallsEl) totalCallsEl.textContent = '0';
            if (avgCallDurationEl) avgCallDurationEl.textContent = '0m 0s';
            if (scenariosCompletedEl) scenariosCompletedEl.textContent = '0';
            if (lastCallDateEl) lastCallDateEl.textContent = '-';
            if (recentCallsTableBody) recentCallsTableBody.innerHTML = '<tr><td colspan="4" class="placeholder-text">No call activity yet.</td></tr>';
            
            if (statsGridDiv) statsGridDiv.style.display = 'grid'; // Show stats even if zero
            if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'block'; // Show table section with "no activity" message
        }

        if (loadingMessageDiv) loadingMessageDiv.style.display = 'none';
    }
    
    // Export Data Functionality
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please log in to export data.");
                return;
            }

            const { data: allSessions, error } = await supabase
                .from('call_sessions')
                .select('*, call_scenarios(name)') // Select all columns and scenario name
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });

            if (error) {
                console.error("Error fetching data for export:", error);
                alert("Could not fetch data for export.");
                return;
            }

            if (!allSessions || allSessions.length === 0) {
                alert("No data to export.");
                return;
            }

            // Convert JSON to CSV
            const headers = Object.keys(allSessions[0]).filter(key => key !== 'call_scenarios'); // Exclude nested object for simple CSV
            headers.push('scenario_name'); // Add scenario_name as a header

            const csvRows = [headers.join(',')]; // Header row

            allSessions.forEach(session => {
                const values = headers.map(header => {
                    if (header === 'scenario_name') {
                        return session.call_scenarios ? `"${session.call_scenarios.name}"` : '""';
                    }
                    const value = session[header];
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value}"`; // Enclose in quotes if it contains a comma
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


    // Initial load
    loadDashboardData();
});
