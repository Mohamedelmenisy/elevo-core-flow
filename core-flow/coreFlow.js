document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded - Dynamic Scenarios from Supabase");

    const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3V0bXVzcGNhcmFseWR5Y21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDY3MDEsImV4cCI6MjA2MTAyMjcwMX0.3u5Y7pkH2NNnnoGLMWVfAa5b8fq88o1itRYnG1K38tE';
    
    let supabase;
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase client initialized in coreFlow.js");
    } catch (error) {
        console.error("Supabase client initialization failed in coreFlow.js:", error);
        const authLoadingDiv = document.getElementById('auth-loading');
        if (authLoadingDiv) authLoadingDiv.innerHTML = '<p style="color:red;">Error: Could not connect to services. Please try again later.</p>';
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

    // State Variables
    let currentScenarioName = null;
    let currentSteps = [];
    let currentStepIndex = 0;

    // --- 1. CHECK AUTHENTICATION & USER INFO ---
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("Error getting session:", sessionError);
            if (authLoadingDiv) authLoadingDiv.innerHTML = '<p style="color:red;">Authentication error. Please try reloading.</p>';
            return;
        }

        if (!session) {
            console.log("User not authenticated. Redirecting to login.");
            const currentPath = window.location.pathname.replace('/elevo-core-flow', '') + window.location.search + window.location.hash;
            window.location.href = `../legacy/login.html?redirectTo=${encodeURIComponent(currentPath)}`;
            return; 
        }

        console.log('User is authenticated:', session.user);
        if (session.user.email && userNameSpan && userInfoDiv) {
            const emailPrefix = session.user.email.split('@')[0];
            userNameSpan.textContent = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
            userInfoDiv.style.display = 'flex';
        }
        if(logoutButton) {
            logoutButton.addEventListener('click', async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error("Logout error:", error);
                    alert("Error logging out. Please try again.");
                } else {
                    console.log("User logged out. Redirecting to login.");
                    window.location.href = '../legacy/login.html'; 
                }
            });
        }
        if (authLoadingDiv) authLoadingDiv.style.display = 'none';
        if (initialViewDiv) initialViewDiv.style.display = 'block';

    } catch (error) {
        console.error("Error during auth check or user info display:", error);
        if (authLoadingDiv) authLoadingDiv.innerHTML = `<p style="color:red;">An unexpected error occurred: ${error.message}</p>`;
        return;
    }

    // --- 2. "RECEIVE CALL" BUTTON FUNCTIONALITY ---
    if (receiveCallBtn) {
        receiveCallBtn.addEventListener('click', async () => {
            console.log("Receive Call button clicked");
            if (initialViewDiv) initialViewDiv.style.display = 'none';
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'block';
            
            // Show loading state for steps
            if (stepsContainer) stepsContainer.innerHTML = '<p class="placeholder-text">Loading scenario...</p>';
            if (scenarioTitleElement) scenarioTitleElement.textContent = 'Loading Scenario...';
            if (nextStepBtn) nextStepBtn.style.display = 'none';
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            if (endCallBtn) endCallBtn.style.display = 'inline-flex'; // Show end call button immediately

            try {
                const { data: scenario, error } = await supabase
                    .from('call_scenarios') // Make sure this table name is correct
                    .select('name, steps')   // Select the name and steps columns
                    .eq('is_active', true) // Filter for active scenarios
                    .limit(1)              // Get only one active scenario (you might want more sophisticated logic later)
                    .single();             // Expect a single row or null

                if (error) {
                    if (error.code === 'PGRST116') { // PGRST116: 'Not a single row was found'
                         console.warn("No active scenario found in Supabase.");
                         if (stepsContainer) stepsContainer.innerHTML = '<p style="color:orange;">No active call scenario available at the moment.</p>';
                         if (scenarioTitleElement) scenarioTitleElement.textContent = 'No Scenario';
                    } else {
                        throw error; // Re-throw other errors
                    }
                    // Hide next/prev if no scenario
                    if (nextStepBtn) nextStepBtn.style.display = 'none';
                    if (prevStepBtn) prevStepBtn.style.display = 'none';
                    return;
                }

                if (!scenario || !scenario.steps || scenario.steps.length === 0) {
                    console.error("Fetched scenario is invalid or has no steps:", scenario);
                    if (stepsContainer) stepsContainer.innerHTML = '<p style="color:red;">Loaded scenario is empty or invalid.</p>';
                    if (scenarioTitleElement) scenarioTitleElement.textContent = 'Invalid Scenario';
                    if (nextStepBtn) nextStepBtn.style.display = 'none';
                    if (prevStepBtn) prevStepBtn.style.display = 'none';
                    return;
                }

                currentScenarioName = scenario.name;
                currentSteps = scenario.steps; // Assuming 'steps' is an array of strings
                currentStepIndex = 0;
                
                if (scenarioTitleElement) scenarioTitleElement.textContent = currentScenarioName;
                renderStep(); // Render the first step

            } catch (err) {
                console.error("Failed to fetch or process scenario from Supabase:", err);
                if (stepsContainer) stepsContainer.innerHTML = `<p style="color:red;">Error loading scenario: ${err.message}. Please check console.</p>`;
                if (scenarioTitleElement) scenarioTitleElement.textContent = 'Error';
                if (nextStepBtn) nextStepBtn.style.display = 'none';
                if (prevStepBtn) prevStepBtn.style.display = 'none';
            }
        });
    } else {
        console.error("Receive Call Button not found!");
    }


    // --- 3. RENDER STEP FUNCTION ---
    function renderStep() {
        if (!stepsContainer) return;

        if (currentSteps.length === 0) {
            stepsContainer.innerHTML = '<p class="placeholder-text">No steps available for this scenario.</p>';
            if (nextStepBtn) nextStepBtn.style.display = 'none';
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            return;
        }

        if (currentStepIndex >= 0 && currentStepIndex < currentSteps.length) {
            const stepContent = currentSteps[currentStepIndex];
            // Using the class 'step-box' as in your example for styling individual steps
            stepsContainer.innerHTML = `<p>${stepContent}</p>`; // Assuming your CSS for p inside steps-area is sufficient
        } else {
            // This case should ideally be handled by button logic (Next button becoming "Finish")
            stepsContainer.innerHTML = `<p><strong>End of scenario: ${currentScenarioName}</strong></p>`;
        }

        // Manage buttons visibility and text
        if (prevStepBtn) {
            prevStepBtn.style.display = currentStepIndex > 0 ? 'inline-flex' : 'none';
        }
        if (nextStepBtn) {
            if (currentStepIndex < currentSteps.length - 1) {
                nextStepBtn.innerHTML = `<span>Next Step</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                nextStepBtn.style.display = 'inline-flex';
            } else if (currentStepIndex === currentSteps.length - 1) { // Last step
                nextStepBtn.innerHTML = `<span>Finish Scenario</span>`; 
                nextStepBtn.style.display = 'inline-flex';
            } else { // Beyond last step (scenario finished)
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
                // "Finish Scenario" was clicked
                console.log(`Scenario ${currentScenarioName} finished by user.`);
                // You might want to do something here, like log completion,
                // then call endCallBtn's logic or similar.
                // For now, let's simulate ending the call flow view.
                if (stepsContainer) stepsContainer.innerHTML = `<p><strong>Scenario ${currentScenarioName} Completed!</strong></p>`;
                if (nextStepBtn) nextStepBtn.style.display = 'none';
                if (prevStepBtn) prevStepBtn.style.display = (currentSteps.length > 0) ? 'inline-flex' : 'none'; // Allow going back to last step
                // Do not automatically go to initialViewDiv, let user click End Call
            }
        });
    }

    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => { 
            if (currentStepIndex > 0) {
                currentStepIndex--;
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
            
            // Reset button states that might have been changed
            if (nextStepBtn) {
                 nextStepBtn.innerHTML = `<span>Next Step</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
                 // Next button will be hidden by default when callFlowView is hidden.
                 // It will be shown again by receiveCallBtn if a new scenario is loaded.
            }
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            if (endCallBtn) endCallBtn.style.display = 'none'; // Hide itself
            
            if (scenarioTitleElement) scenarioTitleElement.textContent = "Call Scenario"; // Reset title
            if (stepsContainer) stepsContainer.innerHTML = '<p class="placeholder-text">Ready for a new call.</p>'; // Reset steps area
        });
    }

    console.log("CoreFlow.js script fully loaded and event listeners attached - Dynamic Scenarios.");
});
