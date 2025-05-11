document.addEventListener('DOMContentLoaded', async () => {
    console.log("Dashboard.js DOMContentLoaded - Attempting Resource Embedding with Specific FK Column");

    const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3V0bXVzcGNhcmFseWR5Y21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDY3MDEsImV4cCI6MjA2MTAyMjcwMX0.3u5Y7pkH2NNnnoGLMWVfAa5b8fq88o1itRYnG1K38tE';
    
    let supabase;
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase client initialized in dashboard.js");
    } catch (error) { /* ... */ return; }

    // DOM Elements (as before)
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
        // ... (hide other sections)

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) { /* ... (redirect to login) ... */ return; }
        // ... (update user name displays)
        
        if(logoutButton) { /* ... (logout listener) ... */ }

        console.log("Fetching call sessions for user:", user.id);
        const { data: callSessions, error: sessionsError } = await supabase
            .from('call_sessions')
            // ✅✅✅ THIS IS THE NEW CRITICAL CHANGE ✅✅✅
            // We specify the foreign key column on the current table 'call_sessions'
            // that points to 'call_scenarios'.
            .select('id, start_time, end_time, total_duration_seconds, completed_all_steps, scenario_id, call_scenarios!inner(id, name)') 
            // The !inner part is optional. The key part is just 'call_scenarios(columns...)'
            // If the above still fails, try explicitly stating the FK column from call_sessions:
            // .select('id, start_time, ..., scenario_id, referenced_scenario:call_scenarios!scenario_id(id, name)')
            // The line above should be:
            // .select('id, start_time, end_time, total_duration_seconds, completed_all_steps, scenario_id, call_scenarios:scenario_id(id, name)')
            // LET'S TRY THE MOST EXPLICIT FORM for Supabase v2 resource embedding:
            // tableB!foreignKeyColumnInTableA(columnsFromTableB)
            // Here tableA is call_sessions, tableB is call_scenarios, foreignKeyColumnInTableA is scenario_id
            .select(`
                id, 
                start_time, 
                end_time, 
                total_duration_seconds, 
                completed_all_steps, 
                scenario_id, 
                call_scenarios_via_scenario_id:call_scenarios ( id, name )
            `)
            // The above uses a hint for the foreign key column if ambiguity exists
            // The standard way, if there's only ONE FK from call_sessions.scenario_id to call_scenarios:
            // .select('*, call_scenarios(name)') SHOULD work.
            // Given the error, let's be very explicit using the column name as the hint
            // .select('*, call_scenarios!scenario_id(name)')
            // Or, using an alias and inner join:
            // .select('*, scenario:call_scenarios!inner!scenario_id(name)')

            // TRYING THE RECOMMENDED SYNTAX FOR AMBIGUOUS RELATIONSHIPS:
            // foreign_table!hint_foreign_key_column_name_on_this_table(columns_from_foreign_table)
            .eq('user_id', user.id)
            .order('start_time', { ascending: false }); 

        if (sessionsError) {
            console.error("Error fetching call sessions:", sessionsError); 
            if (loadingMessageDiv) loadingMessageDiv.innerHTML = `<p style="color:red;">Could not load activity data. Error: ${sessionsError.message}</p>`;
            return;
        }
        console.log("Fetched call sessions:", callSessions);

        if (callSessions && callSessions.length > 0) {
            // When accessing, use the alias if provided, or the table name
            // If using `call_scenarios_via_scenario_id:call_scenarios ( id, name )`
            // then it will be `session.call_scenarios_via_scenario_id.name`
            // If Supabase correctly infers it as `call_scenarios` object, then `session.call_scenarios.name`
            
            callSessions.forEach(session => {
                // Let's log the session object to see how Supabase structures the joined data
                console.log("Session object from Supabase:", session); 
                
                // Try to access the scenario name, adjusting based on actual returned structure
                let scenarioName = 'Unknown Scenario';
                if (session.call_scenarios_via_scenario_id && session.call_scenarios_via_scenario_id.name) {
                    scenarioName = session.call_scenarios_via_scenario_id.name;
                } else if (session.call_scenarios && session.call_scenarios.name) { // Fallback to default if alias not used
                    scenarioName = session.call_scenarios.name;
                } else if (session.scenario_id) {
                    scenarioName = `Scenario ID: ${session.scenario_id}`;
                }
                // ... rest of the table population logic using scenarioName ...
            });
            // ... (Populate stats and table) ...
        } else { 
            // ... (Handle no sessions) ...
        }
        if (loadingMessageDiv) loadingMessageDiv.style.display = 'none';
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', async () => { 
            // ... (User fetch) ...
            const { data: allSessions, error } = await supabase
                .from('call_sessions')
                .select('*, call_scenarios_via_scenario_id:call_scenarios(name)') // Apply same explicit join
                .eq('user_id', user.id) // Ensure user is defined
                .order('start_time', { ascending: false });
            // ... (rest of export logic, adjusting access to scenario name)
        });
    }
    loadDashboardData();
});
