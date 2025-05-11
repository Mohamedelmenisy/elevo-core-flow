document.addEventListener('DOMContentLoaded', async () => {
    console.log("Dashboard.js DOMContentLoaded - Final Fixes on Your Provided Code");

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
    const userNameDisplayHeader = document.getElementById('userNameDisplay'); 
    const dashboardUserGreeting = document.getElementById('dashboardUserGreeting');
    const dashboardUserSubtext = document.getElementById('dashboardUserSubtext');
    // ✅ MODIFIED: Get the div for character avatar instead of img
    const userAvatarCharEl = document.getElementById('userAvatarCharacter'); 
    // const userAvatarEl = document.getElementById('userAvatar'); // This line was for <img>, now commented/removed
    const logoutButton = document.getElementById('logoutButton');
    const userInfoDivHeader = document.getElementById('userInfo'); 

    const loadingMessageDiv = document.getElementById('loadingMessage');
    const statsGridDiv = document.getElementById('statsGrid');
    const recentActivitySectionDiv = document.getElementById('recentActivitySection');
    
    const totalCallsEl = document.getElementById('totalCalls');
    const avgCallDurationEl = document.getElementById('avgCallDuration');
    const completionRateEl = document.getElementById('completionRate'); 
    const lastCallDateEl = document.getElementById('lastCallDate'); 
    
    const gaugeGoodEl = document.getElementById('gaugeGood');
    const gaugeNormalEl = document.getElementById('gaugeNormal');
    const gaugeBadEl = document.getElementById('gaugeBad');
    const avgQualityTextEl = document.getElementById('avgQualityText');

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

        const userEmailPrefix = user.email ? user.email.split('@')[0] : 'Agent';
        const capitalizedUserName = userEmailPrefix.charAt(0).toUpperCase() + userEmailPrefix.slice(1);
        const initialLetter = capitalizedUserName.charAt(0).toUpperCase();


        if (userNameDisplayHeader) userNameDisplayHeader.textContent = capitalizedUserName;
        if (dashboardUserGreeting) dashboardUserGreeting.textContent = `Welcome back, ${capitalizedUserName}!`;
        if (dashboardUserSubtext) dashboardUserSubtext.textContent = "Here's your performance overview.";
        if (userInfoDivHeader) userInfoDivHeader.style.display = 'flex';
        
        // ✅ MODIFIED: Set character in the div, no img src or alt handling needed
        if (userAvatarCharEl) {
            userAvatarCharEl.textContent = initialLetter;
        }


        if(logoutButton) {
            logoutButton.addEventListener('click', async () => { 
                const { error } = await supabase.auth.signOut();
                if (error) console.error("Logout error:", error);
                else window.location.href = '../legacy/login.html'; 
            });
        }

        const { data: callSessions, error: sessionsError } = await supabase
            .from('call_sessions')
            .select('start_time, total_duration_seconds, completed_all_steps, scenario_id, call_quality, quality_reason, call_scenarios(name)') 
            .eq('user_id', user.id)
            .order('start_time', { ascending: false }); 

        if (sessionsError) {
            console.error("Error fetching call sessions:", sessionsError);
            if (loadingMessageDiv) loadingMessageDiv.innerHTML = `<p style="color:red;">Could not load activity data. Error: ${sessionsError.message}</p>`;
            return;
        }

        if (callSessions && callSessions.length > 0) {
            if (totalCallsEl) totalCallsEl.textContent = callSessions.length;

            const completedSessionsCount = callSessions.filter(s => s.completed_all_steps === true).length;
            if (completionRateEl) { 
                const rate = callSessions.length > 0 ? Math.round((completedSessionsCount / callSessions.length) * 100) : 0;
                completionRateEl.textContent = `${rate}%`;
            }

            const totalDurationSum = callSessions.reduce((sum, session) => sum + (session.total_duration_seconds || 0), 0);
            const avgDuration = callSessions.length > 0 ? Math.round(totalDurationSum / callSessions.length) : 0;
            if (avgCallDurationEl) {
                const minutes = Math.floor(avgDuration / 60);
                const seconds = avgDuration % 60;
                avgCallDurationEl.textContent = `${minutes}m ${seconds}s`;
            }
            
            // if (lastCallDateEl && callSessions[0].start_time) {
            //    lastCallDateEl.textContent = new Date(callSessions[0].start_time).toLocaleDateString();
            // }

            let goodCalls = 0, normalCalls = 0, badCalls = 0;
            callSessions.forEach(s => {
                if (s.call_quality === 'Good') goodCalls++;
                else if (s.call_quality === 'Normal') normalCalls++;
                else if (s.call_quality === 'Bad') badCalls++;
            });

            const totalRatedCalls = goodCalls + normalCalls + badCalls;
            if (totalRatedCalls > 0) {
                if (gaugeGoodEl) gaugeGoodEl.style.width = `${(goodCalls / totalRatedCalls) * 100}%`;
                if (gaugeNormalEl) gaugeNormalEl.style.width = `${(normalCalls / totalRatedCalls) * 100}%`;
                if (gaugeBadEl) gaugeBadEl.style.width = `${(badCalls / totalRatedCalls) * 100}%`;
                
                if (avgQualityTextEl) { 
                    if (goodCalls >= normalCalls && goodCalls >= badCalls && goodCalls > 0) avgQualityTextEl.textContent = "Mostly Good";
                    else if (normalCalls > goodCalls && normalCalls >= badCalls) avgQualityTextEl.textContent = "Mostly Normal";
                    else if (badCalls > goodCalls && badCalls > normalCalls) avgQualityTextEl.textContent = "Needs Improvement";
                    else avgQualityTextEl.textContent = "Mixed / N/A";
                }
            } else {
                if (gaugeGoodEl) gaugeGoodEl.style.width = `0%`;
                if (gaugeNormalEl) gaugeNormalEl.style.width = `0%`;
                if (gaugeBadEl) gaugeBadEl.style.width = `0%`;
                if (avgQualityTextEl) avgQualityTextEl.textContent = "No Rated Calls";
            }

            if (recentCallsTableBody) {
                recentCallsTableBody.innerHTML = ''; 
                const recentToDisplay = callSessions.slice(0, 5); 

                if (recentToDisplay.length === 0) {
                    recentCallsTableBody.innerHTML = '<tr><td colspan="6" class="placeholder-text">No call activity yet.</td></tr>';
                } else {
                    recentToDisplay.forEach(session => {
                        const row = recentCallsTableBody.insertRow();
                        const scenarioName = session.call_scenarios ? session.call_scenarios.name : (session.scenario_id || 'N/A');
                        const startTime = session.start_time ? new Date(session.start_time).toLocaleString() : 'N/A';
                        const durationSec = session.total_duration_seconds || 0;
                        const durationFormatted = `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;
                        const completedText = session.completed_all_steps ? 'Yes' : 'No';
                        const qualityText = session.call_quality || 'N/A';
                        const reasonText = session.quality_reason || '-';

                        row.insertCell().textContent = scenarioName;
                        row.insertCell().textContent = startTime;
                        row.insertCell().textContent = durationFormatted;
                        row.insertCell().textContent = completedText;
                        
                        const qualityCell = row.insertCell();
                        qualityCell.textContent = qualityText;
                        if(session.call_quality) qualityCell.classList.add(`quality-${session.call_quality.toLowerCase()}`);
                        
                        row.insertCell().textContent = reasonText;
                    });
                }
            }
            if (statsGridDiv) statsGridDiv.style.display = 'grid';
            if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'block';

        } else { 
            if (totalCallsEl) totalCallsEl.textContent = '0';
            if (avgCallDurationEl) avgCallDurationEl.textContent = '0m 0s';
            if (completionRateEl) completionRateEl.textContent = '0%'; 
            if (gaugeGoodEl) gaugeGoodEl.style.width = `0%`;
            if (gaugeNormalEl) gaugeNormalEl.style.width = `0%`;
            if (gaugeBadEl) gaugeBadEl.style.width = `0%`;
            if (avgQualityTextEl) avgQualityTextEl.textContent = "No Calls Yet";
            if (recentCallsTableBody) recentCallsTableBody.innerHTML = '<tr><td colspan="6" class="placeholder-text">No call activity yet.</td></tr>';
            
            if (statsGridDiv) statsGridDiv.style.display = 'grid'; 
            if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'block'; 
        }

        if (loadingMessageDiv) loadingMessageDiv.style.display = 'none';
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { alert("Please log in to export data."); return; }

            console.log("Export button clicked. Fetching all sessions for user:", user.id);

            // ✅ MODIFIED: Select from call_sessions and only join call_scenarios. 
            // We will get user.email from the auth.getUser() call directly.
            const { data: allSessions, error } = await supabase
                .from('call_sessions')
                .select(`
                    id, 
                    user_id, 
                    scenario_id, 
                    start_time, 
                    end_time, 
                    total_duration_seconds, 
                    completed_all_steps, 
                    call_quality, 
                    quality_reason, 
                    created_at,
                    call_scenarios ( name )
                `) 
                .eq('user_id', user.id)
                .order('start_time', { ascending: false });

            if (error) { 
                console.error("Error fetching data for export:", error); 
                alert(`Could not fetch data. Error: ${error.message}`); 
                return; 
            }
            if (!allSessions || allSessions.length === 0) { 
                alert("No data to export for this user."); 
                return; 
            }

            console.log("Data fetched for export:", allSessions.length, "sessions");

            const headers = [
                "Session_ID", "User_Email", "Scenario_Name", "Start_Time", "End_Time", 
                "Total_Duration_Seconds", "Completed_All_Steps", "Call_Quality", "Quality_Reason", "Session_Created_At"
            ];
            const csvRows = [headers.join(',')]; 

            allSessions.forEach(session => {
                const userEmail = user.email ? `"${user.email}"` : '""'; // ✅ Get email from the authenticated user object
                const scenarioName = session.call_scenarios ? `"${(session.call_scenarios.name || '').replace(/"/g, '""')}"` : '""';
                
                const values = [
                    session.id,
                    userEmail, 
                    scenarioName,
                    session.start_time ? `"${new Date(session.start_time).toLocaleString()}"` : '""',
                    session.end_time ? `"${new Date(session.end_time).toLocaleString()}"` : '""',
                    session.total_duration_seconds === null ? '' : session.total_duration_seconds,
                    session.completed_all_steps,
                    session.call_quality === null ? '' : `"${session.call_quality}"`,
                    session.quality_reason === null ? '' : `"${(session.quality_reason || '').replace(/"/g, '""')}"`,
                    session.created_at ? `"${new Date(session.created_at).toLocaleString()}"` : '""'
                ];
                csvRows.push(values.join(','));
            });

            const csvString = csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            if (link.download !== undefined) {
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `elevo_call_data_${userEmailPrefix}_${new Date().toISOString().slice(0,10)}.csv`); // Use userEmailPrefix for filename
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
