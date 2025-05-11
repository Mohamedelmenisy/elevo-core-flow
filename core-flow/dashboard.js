document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded - Automatic Call Quality Logic");

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
            console.log(`Step ${currentStepIndex + 1} duration recorded: ${duration}s. Accumulated for this step: ${stepDurations[currentStepIndex]}s`);
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
        console.log("Call session state (durations, session ID) reset.");
    }

    // ✅ NEW: Function to determine call quality
    function determineCallQuality(totalDuration, allStepsCompleted, stepsArrayLength, stepDurationsArray) {
        let quality = "Normal"; 
        let reason = "Standard call flow."; // Default reason

        if (!allStepsCompleted) {
            quality = "Bad";
            reason = "Call ended prematurely before completing all steps.";
        } else if (stepsArrayLength > 0 && totalDuration < 30 * stepsArrayLength && totalDuration < 60) { // Example: less than 30s per step and less than 1 min total for short scenarios
            quality = "Bad";
            reason = "Call duration very short; potentially unresolved or rushed.";
        } else if (totalDuration > 300 && stepsArrayLength > 0) { // Example: over 5 minutes
            quality = "Normal"; // Could be 'Bad' if excessively long without complex steps
            reason = "Call duration was extended.";
             // Check individual steps for excessive time
            const longStepThreshold = 120; // 2 minutes for a single step
            for (let i = 0; i < stepDurationsArray.length; i++) {
                if (stepDurationsArray[i] > longStepThreshold) {
                    quality = "Bad"; // Downgrade if any step is too long
                    reason = `Extended duration on step ${i + 1}. Overall call long.`;
                    break;
                }
            }
        } else { // If completed and within reasonable time
            quality = "Good";
            reason = "Call completed efficiently within expected parameters.";
        }
        
        console.log(`Determined Call Quality: ${quality}. Reason: ${reason}`);
        return { quality, reason }; 
    }


    function renderProgressTracker() { 
        if (!progressTrackerContainer || currentSteps.length === 0) {
            if(progressTrackerContainer) progressTrackerContainer.style.display = 'none';
            return;
        }
        progressTrackerContainer.innerHTML = ''; 
        const stepperUl = document.createElement('ul');
        stepperUl.className = 'stepper';
        currentSteps.forEach((step, index) => {
            const stepLi = document.createElement('li');
            stepLi.className = 'step';
            if (index < currentStepIndex) stepLi.classList.add('completed');
            else if (index === currentStepIndex) stepLi.classList.add('active');
            stepLi.textContent = `Step ${index + 1}`; 
            stepperUl.appendChild(stepLi);
            if (index < currentSteps.length - 1) {
                const separator = document.createElement('li');
                separator.className = 'step-separator';
                separator.innerHTML = '→'; 
                stepperUl.appendChild(separator);
            }
        });
        progressTrackerContainer.appendChild(stepperUl);
        progressTrackerContainer.style.display = 'block'; 
    }

    function typeWriterEffect(element, message, speed = 30, callback) { 
        if (typingInterval) clearInterval(typingInterval); 
        element.textContent = ''; 
        let i = 0;
        typingInterval = setInterval(() => {
            if (i < message.length) { element.textContent += message.charAt(i); i++; } 
            else { clearInterval(typingInterval); typingInterval = null; if (callback) callback(); }
        }, speed);
    }

    function showAssistantMessage(message, showImmediately = false, duration = 5000, onHideCallback) { 
        if (assistantMessageElement && assistantBox) {
            clearTimeout(assistantTimeout);
            if (typingInterval) clearInterval(typingInterval); 
            const showBox = () => {
                assistantBox.style.display = 'flex'; 
                requestAnimationFrame(() => { assistantBox.classList.add('show'); });
                typeWriterEffect(assistantMessageElement, message, 30, () => { 
                    if (duration && duration > 0) {
                        assistantTimeout = setTimeout(() => {
                            assistantBox.classList.remove('show');
                            if (onHideCallback) onHideCallback();
                        }, duration);
                    }
                });
            };
            if (showImmediately || !assistantBox.classList.contains('show')) showBox();
            else if (assistantBox.classList.contains('show')) { 
                 typeWriterEffect(assistantMessageElement, message, 30, () => {
                    if (duration && duration > 0) {
                       assistantTimeout = setTimeout(() => {
                            assistantBox.classList.remove('show');
                            if (onHideCallback) onHideCallback();
                        }, duration);
                    }
                });
            }
        }
    }

    // --- 2. "RECEIVE CALL" BUTTON FUNCTIONALITY ---
    if (receiveCallBtn) {
        receiveCallBtn.addEventListener('click', async () => {
            console.log("Receive Call button clicked");
            resetCallSessionState(); 
            if (initialViewDiv) initialViewDiv.style.display = 'none';
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'block';
            if (endCallBtn) endCallBtn.style.display = 'inline-flex';
            updateSystemStatus("🟡 Loading Scenario...", "status-waiting");
            // ... (rest of UI updates for loading)

            try {
                const { data: { user } } = await supabase.auth.getUser(); 
                if (!user) throw new Error("User not identified. Cannot start call.");

                const { data: scenario, error: scenarioError } = await supabase
                    .from('call_scenarios').select('id, name, steps').eq('is_active', true).limit(1).single();             
                if (scenarioError) throw scenarioError; // Let catch block handle specific Supabase errors
                if (!scenario || !scenario.steps || scenario.steps.length === 0) throw new Error("Loaded scenario is invalid or has no steps.");

                currentScenarioName = scenario.name;
                currentSteps = scenario.steps; 
                currentStepIndex = 0;
                stepDurations = new Array(currentSteps.length).fill(0); 

                const { data: newSession, error: sessionInsertError } = await supabase
                    .from('call_sessions')
                    .insert({ user_id: user.id, scenario_id: scenario.id, start_time: new Date().toISOString(), completed_all_steps: false })
                    .select('id').single();
                if (sessionInsertError || !newSession) throw sessionInsertError || new Error("Failed to create session record.");
                
                currentCallSessionId = newSession.id; 
                console.log("New call session created with ID:", currentCallSessionId);

                if (scenarioTitleElement) scenarioTitleElement.textContent = currentScenarioName;
                updateSystemStatus("🟢 In Call", "status-in-call");
                renderProgressTracker();
                renderStep(); 
                showAssistantMessage(`🚀 Scenario "${currentScenarioName}" started!`, true, 0);

            } catch (err) {
                console.error("Error during call setup:", err);
                if (callTimerDiv) callTimerDiv.style.display = 'none';
                let userMessage = `⚠️ Error: ${err.message}`;
                if (err.code === 'PGRST116') userMessage = "⚠️ No active scenario found.";
                
                if (stepsContainer) stepsContainer.innerHTML = `<p style="color:red;">${userMessage.substring(3)}</p>`;
                if (scenarioTitleElement) scenarioTitleElement.textContent = 'Error Loading';
                updateSystemStatus("🔴 Error", "status-waiting");
                showAssistantMessage(userMessage, true, 7000);
                // Revert UI to initial state more gracefully
                if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
                if (initialViewDiv) initialViewDiv.style.display = 'block';
                if (endCallBtn) endCallBtn.style.display = 'none';
            }
        });
    }

    // --- 3. RENDER STEP FUNCTION ---
    function renderStep() {
        if (!stepsContainer) return;
        if (currentSteps.length === 0) { /* ... */ return; }
        if (currentStepIndex >= 0 && currentStepIndex < currentSteps.length) {
            const stepContent = currentSteps[currentStepIndex];
            stepsContainer.innerHTML = `<p>${stepContent}</p>`;
            showAssistantMessage(`📌 ${stepContent.length > 45 ? stepContent.substring(0, 42) + "..." : stepContent}`, true, 0); 
            startStepTimer(); 
        }
        renderProgressTracker(); 
        if (prevStepBtn) prevStepBtn.style.display = currentStepIndex > 0 ? 'inline-flex' : 'none';
        if (nextStepBtn) {
            if (currentStepIndex < currentSteps.length - 1) {
                nextStepBtn.innerHTML = `<span>Next Step</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                nextStepBtn.style.display = 'inline-flex';
            } else if (currentStepIndex === currentSteps.length - 1) {
                nextStepBtn.innerHTML = `<span>Finish Scenario</span>`; 
                nextStepBtn.style.display = 'inline-flex';
            } else { 
                nextStepBtn.style.display = 'none';
            }
        }
    }

    // --- 4. NAVIGATION BUTTONS ---
    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', async () => { 
            stopAndRecordStepTimer(); 
            if (currentStepIndex < currentSteps.length - 1) {
                currentStepIndex++;
                renderStep();
            } else if (currentStepIndex === currentSteps.length - 1) { 
                console.log(`Scenario ${currentScenarioName} fully completed by user.`);
                updateSystemStatus("✅ Call Completed", "status-completed");
                
                let totalDuration = stepDurations.reduce((acc, duration) => acc + (duration || 0), 0);
                const { quality, reason } = determineCallQuality(totalDuration, true, currentSteps.length, stepDurations); 

                if (currentCallSessionId) {
                    const { error: updateError } = await supabase
                        .from('call_sessions')
                        .update({ 
                            end_time: new Date().toISOString(), 
                            total_duration_seconds: totalDuration, 
                            completed_all_steps: true,
                            call_quality: quality, 
                            // quality_reason: reason // Uncomment if you added this column
                        })
                        .eq('id', currentCallSessionId);
                    if (updateError) console.error("Failed to update call session on completion:", updateError);
                    else console.log("Call session updated on FULL completion. ID:", currentCallSessionId);
                }
                
                let summary = `Scenario "${currentScenarioName}" Completed!\nTotal Duration: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s\nCall Quality: ${quality}\n\nStep Durations:\n`;
                currentSteps.forEach((stepText, index) => {
                    summary += `Step ${index + 1}: ${Math.floor((stepDurations[index] || 0) / 60)}m ${(stepDurations[index] || 0) % 60}s\n`;
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

    if (prevStepBtn) { /* ... (الكود كما هو من الرد السابق) ... */ }
    
    // --- 5. END CALL BUTTON ---
    if (endCallBtn) {
        endCallBtn.addEventListener('click', async () => { 
            stopAndRecordStepTimer(); 
            let totalDuration = stepDurations.reduce((acc, duration) => acc + (duration || 0), 0);
            console.log("End Call button clicked by user.");

            if (currentCallSessionId) {
                const isScenarioEffectivelyCompleted = 
                    (currentSteps.length > 0 && currentStepIndex >= currentSteps.length - 1) &&
                    (!nextStepBtn || nextStepBtn.style.display === 'none');
                
                const { quality, reason } = determineCallQuality(totalDuration, isScenarioEffectivelyCompleted, currentSteps.length, stepDurations);

                const { error: updateError } = await supabase
                    .from('call_sessions')
                    .update({
                        end_time: new Date().toISOString(),
                        total_duration_seconds: totalDuration,
                        completed_all_steps: isScenarioEffectivelyCompleted,
                        call_quality: quality,
                        // quality_reason: reason // Uncomment if you added this column
                    })
                    .eq('id', currentCallSessionId);
                if (updateError) console.error("Failed to update call session on end call:", updateError);
                else console.log(`Call session ${currentCallSessionId} updated on end call. Effectively Completed: ${isScenarioEffectivelyCompleted}, Quality: ${quality}`);
            }
            
            resetCallSessionState(); 
            // ... (باقي منطق إعادة الواجهة للحالة الأولية كما هو في الكود الذي أرسلته) ...
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
            if (initialViewDiv) initialViewDiv.style.display = 'block';
            // ... (إلخ)
        });
    }

    console.log("CoreFlow.js script fully loaded - Per-Step Timer & Session Logging applied to provided base.");
});
