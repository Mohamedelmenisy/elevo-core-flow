document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded - Final Clean Version");

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
    function updateSystemStatus(statusText, statusClass = 'status-waiting') {
        if (systemStatusDiv) {
            systemStatusDiv.textContent = statusText;
            systemStatusDiv.className = `status-indicator ${statusClass}`;
        }
    }
    
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

    function stopAndRecordStepTimer() {
        clearInterval(stepTimerInterval);
        stepTimerInterval = null;
        if (stepStartTime > 0 && currentStepIndex >= 0 && currentStepIndex < currentSteps.length) { 
            const duration = Math.floor((Date.now() - stepStartTime) / 1000); 
            stepDurations[currentStepIndex] = (stepDurations[currentStepIndex] || 0) + duration; 
            console.log(`Step ${currentStepIndex + 1} duration recorded: ${duration}s. Accumulated: ${stepDurations[currentStepIndex]}s`);
            stepStartTime = 0; 
        }
    }

    function resetCallSessionState() {
        stopAndRecordStepTimer(); 
        if (callTimerDiv) {
            callTimerDiv.textContent = '00:00';
            callTimerDiv.style.display = 'none';
        }
        stepDurations = [];
        currentCallSessionId = null; 
        // currentScenarioName, currentSteps, currentStepIndex are reset when a new scenario is loaded by receiveCallBtn
        console.log("Call session state (durations, session ID) reset.");
    }

    function determineCallQuality(totalDuration, allStepsCompleted, stepsArrayLength, stepDurationsArray) {
        let quality = "Normal"; 
        let reason = "Standard call flow."; 
        if (!allStepsCompleted) { quality = "Bad"; reason = "Call ended prematurely before completing all steps."; }
        else if (stepsArrayLength > 0 && totalDuration < 30 * stepsArrayLength && totalDuration < 60) { quality = "Bad"; reason = "Call duration very short; potentially unresolved or rushed.";}
        else if (totalDuration > 300 && stepsArrayLength > 0) { 
            quality = "Normal"; 
            reason = "Call duration was extended.";
            const longStepThreshold = 120; 
            for (let i = 0; i < stepDurationsArray.length; i++) {
                if ((stepDurationsArray[i] || 0) > longStepThreshold) {
                    quality = "Bad"; 
                    reason = `Extended duration on step ${i + 1}. Overall call long.`;
                    break;
                }
            }
        } else { quality = "Good"; reason = "Call completed efficiently within expected parameters.";}
        console.log(`Determined Call Quality: ${quality}. Reason: ${reason}`);
        return { quality, reason }; 
    }

    function renderProgressTracker() { /* ... (Your existing implementation) ... */ }
    function typeWriterEffect(element, message, speed, callback) { /* ... (Your existing implementation) ... */ }
    function showAssistantMessage(message, showImmediately, duration, onHideCallback) { /* ... (Your existing implementation) ... */ }
    
    function displayPostCallSummary(quality, reason, totalDuration) {
        if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
        if (progressTrackerContainer) progressTrackerContainer.style.display = 'none';
        if (callTimerDiv) callTimerDiv.style.display = 'none'; // Hide main call timer
        if (assistantBox) assistantBox.classList.remove('show');

        if (callSummaryContentDiv && postCallSummaryDiv) {
            let summaryHTML = `
                <p><strong>Call Quality:</strong> <span class="quality-text quality-${quality.toLowerCase()}">${quality}</span></p>
                <p><strong>Reason:</strong> ${reason || "N/A"}</p>
                <p><strong>Total Duration:</strong> ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s</p>
                <hr style="margin: 1rem 0; border-color: var(--border-color);">
                <p><strong>Step Durations:</strong></p>
                <ul style="list-style: none; padding-left: 0; max-height: 150px; overflow-y: auto;">`; // Added scroll for many steps
            
            currentSteps.forEach((stepText, index) => {
                summaryHTML += `<li style="margin-bottom: 0.3rem;">Step ${index + 1} ("${stepText.length > 20 ? stepText.substring(0, 17) + "..." : stepText}"): ${Math.floor((stepDurations[index] || 0) / 60)}m ${(stepDurations[index] || 0) % 60}s</li>`;
            });
            summaryHTML += `</ul>`;
            
            callSummaryContentDiv.innerHTML = summaryHTML;
            postCallSummaryDiv.style.display = 'block';
        }
        updateSystemStatus("📊 Review Call Summary", "status-completed"); // Updated status
    }

    if (returnToInitialViewBtn) {
        returnToInitialViewBtn.addEventListener('click', () => {
            if (postCallSummaryDiv) postCallSummaryDiv.style.display = 'none';
            if (initialViewDiv) initialViewDiv.style.display = 'block';
            updateSystemStatus("🔴 Waiting for Call");
            // Reset UI elements that were part of call flow view
            if (nextStepBtn) { nextStepBtn.innerHTML = `<span>Next Step</span>...`; nextStepBtn.style.display = 'none'; }
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            if (endCallBtn) endCallBtn.style.display = 'none'; 
            if (progressTrackerContainer) progressTrackerContainer.style.display = 'none';
            if (callTimerDiv) { callTimerDiv.textContent = '00:00'; callTimerDiv.style.display = 'none'; }
            if (scenarioTitleElement) scenarioTitleElement.textContent = "Call Scenario"; 
            if (stepsContainer) stepsContainer.innerHTML = '<p class="placeholder-text">Ready for a new call.</p>';

            showAssistantMessage("💡 Ready for the next call!", true, 7000, () => {
                if (initialViewDiv && initialViewDiv.style.display === 'block') {
                    showAssistantMessage("💡 Tip: Click 'Receive Call' to start.", true, 0);
                }
            });
        });
    }

    // --- 2. "RECEIVE CALL" BUTTON FUNCTIONALITY ---
    if (receiveCallBtn) { /* ... (Your existing, cleaned up receiveCallBtn logic, ensuring it calls resetCallSessionState() and the Supabase insert for new session) ... */ }

    // --- 3. RENDER STEP FUNCTION ---
    function renderStep() { /* ... (Your existing, cleaned up renderStep logic, ensuring it calls startStepTimer()) ... */ }

    // --- 4. NAVIGATION BUTTONS ---
    if (nextStepBtn) { /* ... (Your existing, cleaned up nextStepBtn logic, ensuring it calls stopAndRecordStepTimer(), updates Supabase with call_quality, and calls displayPostCallSummary()) ... */ }
    if (prevStepBtn) { /* ... (Your existing, cleaned up prevStepBtn logic, ensuring it calls stopAndRecordStepTimer()) ... */ }
    
    // --- 5. END CALL BUTTON ---
    if (endCallBtn) { /* ... (Your existing, cleaned up endCallBtn logic, ensuring it calls stopAndRecordStepTimer(), updates Supabase with call_quality, and calls displayPostCallSummary()) ... */ }

    console.log("CoreFlow.js script fully loaded - Cleaned with Post-Call Summary Implemented.");
});
