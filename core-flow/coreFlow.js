document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded - Per-Step Timer & Session Logging on Provided Base");

    const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3V0bXVzcGNhcmFseWR5Y21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDY3MDEsImV4cCI6MjA2MTAyMjcwMX0.3u5Y7pkH2NNnnoGLMWVfAa5b8fq88o1itRYnG1K38tE';
    
    let supabase;
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase client initialized in coreFlow.js");
    } catch (error) {
        console.error("Supabase client initialization failed:", error);
        const authLoadingDiv = document.getElementById('auth-loading');
        if (authLoadingDiv) authLoadingDiv.innerHTML = '<p style="color:red;">Error: Could not connect to services.</p>';
        return;
    }

    // DOM Elements (as provided by you)
    const authLoadingDiv = document.getElementById('auth-loading');
    const initialViewDiv = document.getElementById('initial-view');
    const callFlowViewDiv = document.getElementById('call-flow-view');
    const receiveCallBtn = document.getElementById('receive-call-btn');
    const stepsContainer = document.getElementById('steps-container');
    const nextStepBtn = document.getElementById('next-step-btn');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const endCallBtn = document.getElementById('end-call-btn');
    const scenarioTitleElement = document.getElementById('scenario-title');
    const userInfoDiv = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');
    const systemStatusDiv = document.getElementById('systemStatus');
    const callTimerDiv = document.getElementById('callTimer');
    const progressTrackerContainer = document.getElementById('progressTracker');
    const assistantBox = document.getElementById('assistantBox');
    const assistantMessageElement = document.getElementById('assistantMessageElement');

    // State Variables
    let currentScenarioName = null;
    let currentSteps = [];
    let currentStepIndex = 0;
    // ✅ MODIFIED/NEW VARIABLES FOR PER-STEP TIMER & SESSION
    let stepTimerInterval = null; 
    let stepStartTime = 0;       
    let stepDurations = [];      
    let currentCallSessionId = null; 
    // Removed callTimerInterval and callStartTime as they are replaced by step-specific ones

    let assistantTimeout = null;
    let typingInterval = null; 

    // --- 1. CHECK AUTHENTICATION & USER INFO --- (Keeping your existing auth logic)
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session) {
            const currentPath = window.location.pathname.replace('/elevo-core-flow', '') + window.location.search + window.location.hash;
            window.location.href = `../legacy/login.html?redirectTo=${encodeURIComponent(currentPath)}`;
            return; 
        }
        console.log('User is authenticated.');
        if (session.user.email && userNameSpan && userInfoDiv) {
            const emailPrefix = session.user.email.split('@')[0];
            userNameSpan.textContent = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            userInfoDiv.style.display = 'flex';
        }
        if(logoutButton) {
            logoutButton.addEventListener('click', async () => { 
                const { error } = await supabase.auth.signOut();
                if (error) console.error("Logout error:", error);
                else window.location.href = '../legacy/login.html'; 
            });
        }
        if (authLoadingDiv) authLoadingDiv.style.display = 'none';
        if (initialViewDiv) initialViewDiv.style.display = 'block';
        updateSystemStatus("🔴 Waiting for Call");
        showAssistantMessage("Welcome to Elevo Core!", true, 5000, () => {
            if (initialViewDiv && initialViewDiv.style.display === 'block') {
                showAssistantMessage("💡 Tip: Click 'Receive Call' to start.", true, 0); 
            }
        });
    } catch (error) {
        console.error("Auth error:", error);
        if (authLoadingDiv) authLoadingDiv.innerHTML = `<p style="color:red;">Auth Error: ${error.message}</p>`;
    }

    // --- UTILITY FUNCTIONS ---
    function updateSystemStatus(statusText, statusClass = 'status-waiting') {
        if (systemStatusDiv) {
            systemStatusDiv.textContent = statusText;
            systemStatusDiv.className = `status-indicator ${statusClass}`;
        }
    }
    
    // ✅ RENAMED and MODIFIED: This now starts/restarts the timer for the CURRENT step
    function startStepTimer() {
        if (callTimerDiv) {
            callTimerDiv.style.display = 'block'; 
            callTimerDiv.textContent = '00:00'; 
        }
        stepStartTime = Date.now(); 
        if (stepTimerInterval) clearInterval(stepTimerInterval);
        stepTimerInterval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - stepStartTime) / 1000);
            const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
            const seconds = String(elapsedTime % 60).padStart(2, '0');
            if (callTimerDiv) callTimerDiv.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    // ✅ NEW: Stops the current step's timer and records its duration
    function stopAndRecordStepTimer() {
        clearInterval(stepTimerInterval);
        stepTimerInterval = null;
        if (stepStartTime > 0 && currentStepIndex >= 0 && currentStepIndex < currentSteps.length) { 
            const duration = Math.floor((Date.now() - stepStartTime) / 1000); 
            stepDurations[currentStepIndex] = (stepDurations[currentStepIndex] || 0) + duration; 
            console.log(`Step ${currentStepIndex + 1} duration recorded: ${duration}s. Accumulated for this step: ${stepDurations[currentStepIndex]}s`);
            stepStartTime = 0; 
        }
    }

    // ✅ NEW: Resets all timer, duration, and session ID states
    function resetCallSessionState() {
        stopAndRecordStepTimer(); 
        if (callTimerDiv) {
            callTimerDiv.textContent = '00:00';
            callTimerDiv.style.display = 'none';
        }
        stepDurations = [];
        currentCallSessionId = null; // Reset current session ID
        // Note: currentScenarioName, currentSteps, currentStepIndex are reset when a new scenario is loaded
        console.log("Call session state (durations, session ID) reset.");
    }


    function renderProgressTracker() { /* (Your existing implementation) */ }
    function typeWriterEffect(element, message, speed = 30, callback) { /* (Your existing implementation) */ }
    function showAssistantMessage(message, showImmediately = false, duration = 5000, onHideCallback) { /* (Your existing implementation) */ }

    // --- 2. "RECEIVE CALL" BUTTON FUNCTIONALITY ---
    if (receiveCallBtn) {
        receiveCallBtn.addEventListener('click', async () => {
            console.log("Receive Call button clicked");
            resetCallSessionState(); // ✅ Reset state for a new call

            // ... (UI updates for loading as in your code)
            if (initialViewDiv) initialViewDiv.style.display = 'none';
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'block';
            if (endCallBtn) endCallBtn.style.display = 'inline-flex';
            updateSystemStatus("🟡 Loading Scenario...", "status-waiting");
            if (stepsContainer) stepsContainer.innerHTML = '<p class="placeholder-text">Loading scenario...</p>';
            if (scenarioTitleElement) scenarioTitleElement.textContent = 'Loading Scenario...';
            if (progressTrackerContainer) progressTrackerContainer.style.display = 'none';
            if (nextStepBtn) nextStepBtn.style.display = 'none';
            if (prevStepBtn) prevStepBtn.style.display = 'none';


            try {
                const { data: { user } } = await supabase.auth.getUser(); 
                if (!user) {
                    console.error("User not found for creating session.");
                    showAssistantMessage("⚠️ User not identified. Cannot start call.", true, 7000);
                    return;
                }

                const { data: scenario, error: scenarioError } = await supabase
                    .from('call_scenarios') 
                    .select('id, name, steps') // ✅ Make sure your table has an 'id' column
                    .eq('is_active', true) 
                    .limit(1)              
                    .single();             

                if (scenarioError || !scenario || !scenario.steps || scenario.steps.length === 0) {
                    // ... (Your existing error handling for scenario load)
                    if (callTimerDiv) callTimerDiv.style.display = 'none';
                    let userMessage = "⚠️ An error occurred loading the scenario.";
                    if (scenarioError && scenarioError.code === 'PGRST116') { /* ... */ } else if (scenarioError) { /* ... */ } else { /* ... */ }
                    showAssistantMessage(userMessage, true, 7000);
                    if (stepsContainer) stepsContainer.innerHTML = `<p style="color:orange;">${userMessage.substring(3)}</p>`;
                    return;
                }

                currentScenarioName = scenario.name;
                currentSteps = scenario.steps; 
                currentStepIndex = 0;
                stepDurations = new Array(currentSteps.length).fill(0); // ✅ Initialize durations array

                // ✅ Create a new record in call_sessions
                const { data: newSession, error: sessionInsertError } = await supabase
                    .from('call_sessions')
                    .insert({ 
                        user_id: user.id, 
                        scenario_id: scenario.id, // Ensure 'scenario.id' is selected and correct type
                        start_time: new Date().toISOString(), 
                        completed_all_steps: false 
                    })
                    .select('id') 
                    .single();

                if (sessionInsertError || !newSession) {
                    console.error("Failed to create new call session record:", sessionInsertError);
                    showAssistantMessage("⚠️ Error starting call session. Please try again.", true, 7000);
                    return;
                }
                currentCallSessionId = newSession.id; 
                console.log("New call session created with ID:", currentCallSessionId);

                if (scenarioTitleElement) scenarioTitleElement.textContent = currentScenarioName;
                updateSystemStatus("🟢 In Call", "status-in-call");
                renderProgressTracker();
                renderStep(); 
                showAssistantMessage(`🚀 Scenario "${currentScenarioName}" started!`, true, 0);

            } catch (err) {
                console.error("Failed to process scenario or create session:", err);
                if (callTimerDiv) callTimerDiv.style.display = 'none';
                // ... (Your existing catch block error handling)
            }
        });
    }

    // --- 3. RENDER STEP FUNCTION ---
    function renderStep() {
        // ... (Your existing logic to display step content) ...
        if (!stepsContainer) return;
        if (currentSteps.length === 0) { /* ... */ return; }
        if (currentStepIndex >= 0 && currentStepIndex < currentSteps.length) {
            const stepContent = currentSteps[currentStepIndex];
            stepsContainer.innerHTML = `<p>${stepContent}</p>`;
            showAssistantMessage(`📌 ${stepContent.length > 45 ? stepContent.substring(0, 42) + "..." : stepContent}`, true, 0); 
            startStepTimer(); // ✅ Start/Restart timer for the current step
        }
        renderProgressTracker(); 
        // ... (Your existing logic for next/prev button visibility) ...
    }

    // --- 4. NAVIGATION BUTTONS ---
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', async () => { // ✅ Made async
            stopAndRecordStepTimer(); 
            if (currentStepIndex < currentSteps.length - 1) {
                currentStepIndex++;
                renderStep();
            } else if (currentStepIndex === currentSteps.length - 1) { 
                console.log(`Scenario ${currentScenarioName} finished by user.`);
                updateSystemStatus("✅ Call Completed", "status-completed");
                
                let totalDuration = stepDurations.reduce((acc, duration) => acc + (duration || 0), 0);
                
                // ✅ Update call_sessions record
                if (currentCallSessionId) {
                    const { error: updateError } = await supabase
                        .from('call_sessions')
                        .update({
                            end_time: new Date().toISOString(),
                            total_duration_seconds: totalDuration,
                            completed_all_steps: true
                        })
                        .eq('id', currentCallSessionId);
                    if (updateError) {
                        console.error("Failed to update call session on completion:", updateError);
                    } else {
                        console.log("Call session updated on completion. ID:", currentCallSessionId);
                    }
                }
                
                let summary = `Scenario "${currentScenarioName}" Completed!\nTotal Duration: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s\n\nStep Durations:\n`;
                currentSteps.forEach((stepText, index) => {
                    summary += `Step ${index + 1} ("${stepText.substring(0,20)}..."): ${Math.floor((stepDurations[index] || 0) / 60)}m ${(stepDurations[index] || 0) % 60}s\n`;
                });
                
                console.log("Detailed Step Durations:", stepDurations); 
                console.log(summary);
                if (stepsContainer) stepsContainer.innerHTML = `<div class="scenario-summary"><pre>${summary.replace(/\n/g, '<br>')}</pre></div>`;
                showAssistantMessage("🎉 Scenario Complete! Summary generated.", true, 10000);
                if (nextStepBtn) nextStepBtn.style.display = 'none';
                if (prevStepBtn) prevStepBtn.style.display = 'inline-flex';
            }
        });
    }

    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => { 
            stopAndRecordStepTimer(); 
            if (currentStepIndex > 0) {
                if (currentStepIndex >= currentSteps.length) { 
                    currentStepIndex = currentSteps.length -1; 
                } else {
                    currentStepIndex--;
                }
                renderStep();
            }
        });
    }
    
    // --- 5. END CALL BUTTON ---
    if (endCallBtn) {
        endCallBtn.addEventListener('click', async () => { // ✅ Made async
            stopAndRecordStepTimer(); 
            
            let totalDuration = stepDurations.reduce((acc, duration) => acc + (duration || 0), 0);

            console.log("End Call button clicked by user.");
            console.log("Final Step Durations:", stepDurations); 
            console.log("Final Total Call Duration:", totalDuration);

            // ✅ Update call_sessions record if call ended prematurely
            if (currentCallSessionId && (currentSteps.length === 0 || currentStepIndex < currentSteps.length -1 || !nextStepBtn || nextStepBtn.style.display !== 'none' ) ) { 
                // Condition to check if scenario wasn't "finished" via nextStep on the last step
                const { error: updateError } = await supabase
                    .from('call_sessions')
                    .update({
                        end_time: new Date().toISOString(),
                        total_duration_seconds: totalDuration,
                        completed_all_steps: false 
                    })
                    .eq('id', currentCallSessionId);
                if (updateError) {
                    console.error("Failed to update call session on early end:", updateError);
                } else {
                    console.log("Call session updated on early end. ID:", currentCallSessionId);
                }
            }
            
            resetCallSessionState(); 
            
            // ... (Your existing UI reset logic)
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
            if (initialViewDiv) initialViewDiv.style.display = 'block';
            if (progressTrackerContainer) progressTrackerContainer.style.display = 'none';
            updateSystemStatus("🔴 Waiting for Call");
            if (nextStepBtn) { /* Reset nextStepBtn as per your original code */ }
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            if (endCallBtn) endCallBtn.style.display = 'none'; 
            if (scenarioTitleElement) scenarioTitleElement.textContent = "Call Scenario"; 
            if (stepsContainer) stepsContainer.innerHTML = '<p class="placeholder-text">Ready for a new call.</p>';
            showAssistantMessage("💡 Ready for the next call!", true, 7000, () => {
                if (initialViewDiv && initialViewDiv.style.display === 'block') {
                    showAssistantMessage("💡 Tip: Click 'Receive Call' to start.", true, 0);
                }
            });
        });
    }

    console.log("CoreFlow.js script fully loaded - Per-Step Timer & Session Logging.");
});
