document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded - V2");

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
            // Ensure the path is correct when deployed on GitHub Pages (if repo name is part of path)
            // Example: if deployed at mohamedelmenisy.github.io/elevo-core-flow/
            // login.html would be at mohamedelmenisy.github.io/elevo-core-flow/legacy/login.html
            // So from core-flow/core-flow.html, path to legacy/login.html is `../legacy/login.html`
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
        receiveCallBtn.addEventListener('click', () => {
            console.log("Receive Call button clicked");
            if (initialViewDiv) initialViewDiv.style.display = 'none';
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'block';
            if (endCallBtn) endCallBtn.style.display = 'block';
            loadScenarioAndDisplay('order_delay'); 
        });
    } else {
        console.error("Receive Call Button not found!");
    }


    // --- 3. SCENARIO HANDLING FUNCTIONS ---
    async function loadScenarioAndDisplay(scenarioName) {
        currentScenarioName = scenarioName; 
        if(scenarioTitleElement) scenarioTitleElement.textContent = `Scenario: ${scenarioName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
        
        if (stepsContainer) stepsContainer.innerHTML = '<p class="placeholder-text">Loading call steps...</p>';
        try {
            const response = await fetch('../knowledge-base/kb.json'); 
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const kb = await response.json();
            const scenario = kb[scenarioName];

            if (scenario && scenario.steps && scenario.steps.length > 0) {
                currentSteps = scenario.steps;
                currentStepIndex = 0;
                displayStep(currentStepIndex);
            } else {
                console.error('Scenario not found, has no steps, or steps array is empty:', scenarioName);
                if (stepsContainer) stepsContainer.innerHTML = `<p style="color:red;">Error: Scenario '${scenarioName}' not found or is empty.</p>`;
                if (nextStepBtn) nextStepBtn.style.display = 'none';
                if (prevStepBtn) prevStepBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to load or parse kb.json:', error);
            if (stepsContainer) stepsContainer.innerHTML = `<p style="color:red;">Error loading scenario: ${error.message}. Please check console.</p>`;
            if (nextStepBtn) nextStepBtn.style.display = 'none';
            if (prevStepBtn) prevStepBtn.style.display = 'none';
        }
    }

    function displayStep(index) {
        if (!stepsContainer) return;
        if (index >= 0 && index < currentSteps.length) {
            stepsContainer.innerHTML = `<p>${currentSteps[index]}</p>`;
        } else if (index >= currentSteps.length && currentSteps.length > 0) {
            stepsContainer.innerHTML = `<p><strong>End of scenario: ${currentScenarioName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></p><p>You have completed all steps.</p>`;
        }
        updateNavigationButtons();
    }
    
    function updateNavigationButtons() {
        if (!prevStepBtn || !nextStepBtn || currentSteps.length === 0) {
            if(prevStepBtn) prevStepBtn.style.display = 'none';
            if(nextStepBtn) nextStepBtn.style.display = 'none';
            return;
        }

        prevStepBtn.style.display = (currentStepIndex > 0) ? 'inline-flex' : 'none';

        if (currentStepIndex < currentSteps.length - 1) {
            nextStepBtn.innerHTML = `<span>Next Step</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
            nextStepBtn.style.display = 'inline-flex';
        } else if (currentStepIndex === currentSteps.length - 1) {
            nextStepBtn.innerHTML = `<span>Finish Scenario</span>`; // Icon removed for finish
            nextStepBtn.style.display = 'inline-flex';
        } else { 
            nextStepBtn.style.display = 'none';
            prevStepBtn.style.display = (currentSteps.length > 0) ? 'inline-flex' : 'none';
        }
    }

    if (nextStepBtn) {
        nextStepBtn.addEventListener('click', () => {
            if (currentStepIndex < currentSteps.length -1) {
                currentStepIndex++;
                displayStep(currentStepIndex);
            } else if (currentStepIndex === currentSteps.length -1) {
                currentStepIndex++; 
                displayStep(currentStepIndex); 
                console.log(`Scenario ${currentScenarioName} finished.`);
            }
        });
    }

    if (prevStepBtn) {
        prevStepBtn.addEventListener('click', () => { 
            if (currentStepIndex > 0) {
                currentStepIndex--;
                displayStep(currentStepIndex);
            }
        });
    }
    
    if (endCallBtn) {
        endCallBtn.addEventListener('click', () => {
            console.log("End Call button clicked.");
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'none';
            if (initialViewDiv) initialViewDiv.style.display = 'block';
            if (endCallBtn) endCallBtn.style.display = 'none';
            if (prevStepBtn) prevStepBtn.style.display = 'none';
            if (nextStepBtn) {
                nextStepBtn.style.display = 'inline-flex'; 
                nextStepBtn.innerHTML = `<span>Next Step</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
            }
            if (stepsContainer) stepsContainer.innerHTML = '<p class="placeholder-text">Loading call steps...</p>';
            currentSteps = [];
            currentStepIndex = 0;
            currentScenarioName = null;
            if(scenarioTitleElement) scenarioTitleElement.textContent = "Call Scenario";
        });
    }
    console.log("CoreFlow.js script fully loaded and event listeners attached. - V2");
});
