document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded - Clean Version for Final Review");

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
    let callTimerInterval = null;
    let callStartTime = 0;
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
    
    function startCallTimer() {
        if (callTimerDiv) {
            callTimerDiv.style.display = 'block'; // Ensure timer is visible
            callTimerDiv.textContent = '00:00'; 
        }
        callStartTime = Date.now();
        if (callTimerInterval) clearInterval(callTimerInterval);
        callTimerInterval = setInterval(() => {
            const elapsedTime = Math.floor((Date.now() - callStartTime) / 1000);
            const minutes = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
            const seconds = String(elapsedTime % 60).padStart(2, '0');
            if (callTimerDiv) callTimerDiv.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    function stopCallTimer() {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
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
            if (index < currentStepIndex) {
                stepLi.classList.add('completed');
            } else if (index === currentStepIndex) {
                stepLi.classList.add('active');
            }
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
            if (i < message.length) {
                element.textContent += message.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
                typingInterval = null;
                if (callback) callback(); 
            }
        }, speed);
    }

    function showAssistantMessage(message, showImmediately = false, duration = 5000, onHideCallback) {
        if (assistantMessageElement && assistantBox) {
            clearTimeout(assistantTimeout);
            if (typingInterval) clearInterval(typingInterval); 

            const showBox = () => {
                assistantBox.style.display = 'flex'; 
                requestAnimationFrame(() => { 
                    assistantBox.classList.add('show');
                });
                typeWriterEffect(assistantMessageElement, message, 30, () => { 
                    if (duration && duration > 0) {
                        assistantTimeout = setTimeout(() => {
                            assistantBox.classList.remove('show');
                            if (onHideCallback) onHideCallback();
                        }, duration);
                    }
                });
            };
            
            if (showImmediately || !assistantBox.classList.contains('show')) {
                showBox();
            } else if (assistantBox.classList.contains('show')) { 
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
                const { data: scenario, error } = await supabase
                    .from('call_scenarios') 
                    .select('name, steps')   
                    .eq('is_active', true) 
                    .limit(1)              
                    .single();             

                if (error || !scenario || !scenario.steps || scenario.steps.length === 0) {
                    if (callTimerDiv) callTimerDiv.style.display = 'none';
                    let userMessage = "⚠️ An error occurred loading the scenario.";
                    if (error && error.code === 'PGRST116') {
                        userMessage = "⚠️ No active scenario found. Please contact admin.";
                        if (scenarioTitleElement) scenarioTitleElement.textContent = 'No Scenario';
                        updateSystemStatus("🔴 No Scenario", "status-waiting");
                    } else if (error) {
                        userMessage = `⚠️ Error: ${error.message}`;
                    } else {
                        userMessage = "⚠️ Loaded scenario is empty or invalid.";
                    }
                    showAssistantMessage(userMessage, true, 7000);
                    if (stepsContainer) stepsContainer.innerHTML = `<p style="color:orange;">${userMessage.substring(3)}</p>`;
                    return;
                }

                currentScenarioName = scenario.name;
                currentSteps = scenario.steps; 
                currentStepIndex = 0;
                
                if (scenarioTitleElement) scenarioTitleElement.textContent = currentScenarioName;
                updateSystemStatus("🟢 In Call", "status-in-call");
                startCallTimer(); 
                renderProgressTracker();
                renderStep(); 
                showAssistantMessage(`🚀 Scenario "${currentScenarioName}" started!`, true, 0);

            } catch (err) {
                console.error("Failed to process scenario:", err);
                if (callTimerDiv) callTimerDiv.style.display = 'none';
                if (stepsContainer) stepsContainer.innerHTML = `<p style="color:red;">Error loading scenario: ${err.message}.</p>`;
                if (scenarioTitleElement) scenarioTitleElement.textContent = 'Error Loading Scenario';
                updateSystemStatus("🔴 Error", "status-waiting");
                showAssistantMessage(`❗ Error: ${err.message}`, true, 7000);
            }
        });
    }

    // --- 3. RENDER STEP FUNCTION ---
    function renderStep() {
        if (!stepsContainer) return;
        if (currentSteps.length === 0) { 
            stepsContainer.innerHTML = '<p class="placeholder-text">No steps available.</p>';
            if (nextStepBtn) nextStepBtn.style.display = 'none';
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            return;
        }
        if (currentStepIndex >= 0 && currentStepIndex < currentSteps.length) {
            const stepContent = currentSteps[currentStepIndex];
            stepsContainer.innerHTML = `<p>${stepContent}</p>`;
            showAssistantMessage(`📌 ${stepContent.length > 45 ? stepContent.substring(0, 42) + "..." : stepContent}`, true, 0); 
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
        nextStepBtn.addEventListener('click', () => {
            if (currentStepIndex < currentSteps.length - 1) {
                currentStepIndex++;
                renderStep();
            } else if (currentStepIndex === currentSteps.length - 1) {
                console.log(`Scenario ${currentScenarioName} finished by user.`);
                if (stepsContainer) stepsContainer.innerHTML = `<p><strong>Scenario ${currentScenarioName} Completed!</strong></p>`;
                if (nextStepBtn) nextStepBtn.style.display = 'none';
                if (prevStepBtn) prevStepBtn.style.display = (currentSteps.length > 0) ? 'inline-flex' : 'none';
                updateSystemStatus("✅ Call Completed", "status-completed");
                stopCallTimer(); 
                showAssistantMessage("🎉 Scenario Complete! Well done.", true, 7000);
                currentStepIndex++; 
                renderProgressTracker(); 
            }
        });
    }
    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => { 
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
        endCallBtn.addEventListener('click', () => {
            console.log("End Call button clicked by user.");
            currentScenarioName = null;
            currentSteps = [];
            currentStepIndex = 0;

            if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
            if (initialViewDiv) initialViewDiv.style.display = 'block';
            if (progressTrackerContainer) progressTrackerContainer.style.display = 'none';
            
            stopCallTimer(); 
            if (callTimerDiv) {
                callTimerDiv.textContent = '00:00'; 
                callTimerDiv.style.display = 'none'; 
            }
            
            updateSystemStatus("🔴 Waiting for Call");
            if (nextStepBtn) {
                nextStepBtn.innerHTML = `<span>Next Step</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                nextStepBtn.style.display = 'none'; 
            }
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

    console.log("CoreFlow.js script fully loaded.");
});
