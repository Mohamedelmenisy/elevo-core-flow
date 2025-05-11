document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded - Cleaned with Post-Call Summary");

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

    // DOM Elements
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
    // ✅ NEW DOM Elements for Post Call Summary
    const postCallSummaryDiv = document.getElementById('postCallSummary');
    const callSummaryContentDiv = document.getElementById('callSummaryContent');
    const returnToInitialViewBtn = document.getElementById('returnToInitialViewBtn');


    // State Variables
    let currentScenarioName = null;
    let currentSteps = [];
    let currentStepIndex = 0;
    let stepTimerInterval = null; 
    let stepStartTime = 0;       
    let stepDurations = [];      
    let currentCallSessionId = null; 
    let assistantTimeout = null;
    let typingInterval = null; 

    // --- 1. CHECK AUTHENTICATION & USER INFO ---
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
    function updateSystemStatus(statusText, statusClass = 'status-waiting') { /* ... (كما هو) ... */ }
    function startStepTimer() { /* ... (كما هو) ... */ }
    function stopAndRecordStepTimer() { /* ... (كما هو) ... */ }
    function resetCallSessionState() { /* ... (كما هو) ... */ }
    function determineCallQuality(totalDuration, allStepsCompleted, stepsArrayLength, stepDurationsArray) { /* ... (كما هو من الرد السابق، مع التأكد من أنه يعيد quality و reason) ... */ 
        let quality = "Normal"; 
        let reason = "Standard call flow.";
        if (!allStepsCompleted) { quality = "Bad"; reason = "Call ended prematurely."; }
        else if (stepsArrayLength > 0 && totalDuration < 30 && totalDuration < 60) { quality = "Bad"; reason = "Call duration very short.";}
        else if (totalDuration > 300 && stepsArrayLength > 0) { quality = "Normal"; reason = "Call duration was extended.";}
        else { quality = "Good"; reason = "Call completed efficiently.";}
        console.log(`Determined Call Quality: ${quality}, Reason: ${reason}`);
        return { quality, reason }; 
    }
    function renderProgressTracker() { /* ... (كما هو) ... */ }
    function typeWriterEffect(element, message, speed, callback) { /* ... (كما هو) ... */ }
    function showAssistantMessage(message, showImmediately, duration, onHideCallback) { /* ... (كما هو) ... */ }

    // ✅ NEW FUNCTION to display post-call summary
    function displayPostCallSummary(quality, reason, totalDuration) {
        if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
        if (progressTrackerContainer) progressTrackerContainer.style.display = 'none';
        if (callTimerDiv) callTimerDiv.style.display = 'none';
        if (assistantBox) assistantBox.classList.remove('show');

        if (callSummaryContentDiv && postCallSummaryDiv) {
            let summaryHTML = `
                <p><strong>Call Quality:</strong> <span class="quality-text quality-${quality.toLowerCase()}">${quality}</span></p>
                <p><strong>Reason:</strong> ${reason || "N/A"}</p>
                <p><strong>Total Duration:</strong> ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s</p>
                <hr style="margin: 1rem 0;">
                <p><strong>Step Durations:</strong></p>
                <ul style="list-style: none; padding-left: 0;">`;
            
            currentSteps.forEach((stepText, index) => {
                summaryHTML += `<li>Step ${index + 1} ("${stepText.substring(0,25)}..."): ${Math.floor((stepDurations[index] || 0) / 60)}m ${(stepDurations[index] || 0) % 60}s</li>`;
            });
            summaryHTML += `</ul>`;
            
            callSummaryContentDiv.innerHTML = summaryHTML;
            postCallSummaryDiv.style.display = 'block';
        }
        updateSystemStatus("📊 Review Call Summary", "status-completed");
    }

    if (returnToInitialViewBtn) {
        returnToInitialViewBtn.addEventListener('click', () => {
            if (postCallSummaryDiv) postCallSummaryDiv.style.display = 'none';
            if (initialViewDiv) initialViewDiv.style.display = 'block';
            updateSystemStatus("🔴 Waiting for Call");
            showAssistantMessage("💡 Ready for the next call!", true, 7000, () => {
                if (initialViewDiv && initialViewDiv.style.display === 'block') {
                    showAssistantMessage("💡 Tip: Click 'Receive Call' to start.", true, 0);
                }
            });
        });
    }


    // --- 2. "RECEIVE CALL" BUTTON FUNCTIONALITY --- (لا تغييرات كبيرة هنا، فقط التأكد من استدعاء resetCallSessionState)
    if (receiveCallBtn) { /* ... (كما هو من الرد السابق، مع التأكد من استدعاء resetCallSessionState() في البداية) ... */ }

    // --- 3. RENDER STEP FUNCTION --- (لا تغييرات هنا)
    function renderStep() { /* ... (كما هو من الرد السابق) ... */ }

    // --- 4. NAVIGATION BUTTONS ---
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', async () => { 
            stopAndRecordStepTimer(); 
            if (currentStepIndex < currentSteps.length - 1) {
                currentStepIndex++;
                renderStep();
            } else if (currentStepIndex === currentSteps.length - 1) { 
                // "Finish Scenario" was clicked
                updateSystemStatus("✅ Call Completed", "status-completed");
                let totalDuration = stepDurations.reduce((acc, duration) => acc + (duration || 0), 0);
                const { quality, reason } = determineCallQuality(totalDuration, true, currentSteps.length, stepDurations); 

                if (currentCallSessionId) {
                    const { error: updateError } = await supabase
                        .from('call_sessions')
                        .update({ end_time: new Date().toISOString(), total_duration_seconds: totalDuration, completed_all_steps: true, call_quality: quality, quality_reason: reason })
                        .eq('id', currentCallSessionId);
                    if (updateError) console.error("Failed to update call session on completion:", updateError);
                    else console.log("Call session updated on FULL completion.");
                }
                
                displayPostCallSummary(quality, reason, totalDuration); // ✅ Show summary UI
                
                // Hide call flow buttons as summary is now shown
                if (nextStepBtn) nextStepBtn.style.display = 'none';
                if (prevStepBtn) prevStepBtn.style.display = 'none';
                if (endCallBtn) endCallBtn.style.display = 'none'; // End call button is also hidden
            }
        });
    }

    if (prevStepBtn) { /* ... (كما هو من الرد السابق) ... */ }
    
    // --- 5. END CALL BUTTON ---
    if (endCallBtn) {
        endCallBtn.addEventListener('click', async () => { 
            stopAndRecordStepTimer(); 
            let totalDuration = stepDurations.reduce((acc, duration) => acc + (duration || 0), 0);
            console.log("End Call button clicked by user.");

            if (currentCallSessionId) {
                const isScenarioEffectivelyCompleted = 
                    (currentSteps.length > 0 && currentStepIndex >= currentSteps.length - 1) &&
                    (!nextStepBtn || nextStepBtn.style.display === 'none'); // Check if "Finish" was the state
                
                const { quality, reason } = determineCallQuality(totalDuration, isScenarioEffectivelyCompleted, currentSteps.length, stepDurations);

                const { error: updateError } = await supabase
                    .from('call_sessions')
                    .update({ end_time: new Date().toISOString(), total_duration_seconds: totalDuration, completed_all_steps: isScenarioEffectivelyCompleted, call_quality: quality, quality_reason: reason })
                    .eq('id', currentCallSessionId);
                if (updateError) console.error("Failed to update call session on end call:", updateError);
                else console.log(`Call session updated on end call. Completed: ${isScenarioEffectivelyCompleted}`);
                
                displayPostCallSummary(quality, reason, totalDuration); // ✅ Show summary UI
            } else {
                // If no session ID, just go back to initial view
                resetCallSessionState(); 
                if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
                if (initialViewDiv) initialViewDiv.style.display = 'block';
                updateSystemStatus("🔴 Waiting for Call");
            }
             // Hide call flow buttons as summary is now shown
            if (nextStepBtn) nextStepBtn.style.display = 'none';
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            if (endCallBtn) endCallBtn.style.display = 'none';
        });
    }

    console.log("CoreFlow.js script fully loaded - Cleaned with Post-Call Summary.");
});
