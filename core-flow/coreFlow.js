document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded");

    const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3V0bXVzcGNhcmFseWR5Y21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDY3MDEsImV4cCI6MjA2MTAyMjcwMX0.3u5Y7pkH2NNnnoGLMWVfAa5b8fq88o1itRYnG1K38tE';
    
    let supabase;
    try {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log("Supabase client initialized in coreFlow.js");
    } catch (error) {
        console.error("Supabase client initialization failed in coreFlow.js:", error);
        document.getElementById('auth-loading').innerHTML = '<p style="color:red;">Error: Could not connect to services. Please try again later.</p>';
        return;
    }

    const authLoadingDiv = document.getElementById('auth-loading');
    const initialViewDiv = document.getElementById('initial-view');
    const callFlowViewDiv = document.getElementById('call-flow-view');
    const receiveCallBtn = document.getElementById('receive-call-btn');
    const stepsContainer = document.getElementById('steps-container');
    const nextStepBtn = document.getElementById('next-step-btn');
    const prevStepBtn = document.getElementById('prev-step-btn'); // Added
    const endCallBtn = document.getElementById('end-call-btn'); // Added
    const scenarioTitleElement = document.getElementById('scenario-title'); // Added

    const userInfoDiv = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const logoutButton = document.getElementById('logoutButton');

    let currentScenarioName = null;
    let currentSteps = [];
    let currentStepIndex = 0;

    // --- 1. CHECK AUTHENTICATION & USER INFO ---
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error("Error getting session:", sessionError);
            authLoadingDiv.innerHTML = '<p style="color:red;">Authentication error. Please try reloading.</p>';
            return;
        }

        if (!session) {
            console.log("User not authenticated. Redirecting to login.");
            const currentPath = window.location.pathname.replace('/elevo-core-flow', '') + window.location.search + window.location.hash;
            window.location.href = `../legacy/login.html?redirectTo=${encodeURIComponent(currentPath)}`;
            return; 
        }

        console.log('User is authenticated:', session.user);
        // Display user info (example)
        if (session.user.email) {
            userNameSpan.textContent = session.user.email.split('@')[0]; // Display part of email as name
            userInfoDiv.style.display = 'flex';
        }
        logoutButton.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Logout error:", error);
                alert("Error logging out. Please try again.");
            } else {
                console.log("User logged out. Redirecting to login.");
                window.location.href = '../legacy/login.html'; // Or a specific logout page
            }
        });

        authLoadingDiv.style.display = 'none';
        initialViewDiv.style.display = 'block'; // Show the "Receive Call" button view

    } catch (error) {
        console.error("Error during auth check or user info display:", error);
        authLoadingDiv.innerHTML = `<p style="color:red;">An unexpected error occurred: ${error.message}</p>`;
        return;
    }

    // --- 2. "RECEIVE CALL" BUTTON FUNCTIONALITY ---
    receiveCallBtn.addEventListener('click', () => {
        console.log("Receive Call button clicked");
        initialViewDiv.style.display = 'none';
        callFlowViewDiv.style.display = 'block';
        endCallBtn.style.display = 'block'; // Show end call button
        // Load a default scenario or a randomly selected one, or based on some logic
        loadScenarioAndDisplay('order_delay'); // Example: loading 'order_delay'
    });

    // --- 3. SCENARIO HANDLING FUNCTIONS ---
    async function loadScenarioAndDisplay(scenarioName) {
        currentScenarioName = scenarioName; // Store the current scenario name
        if(scenarioTitleElement) scenarioTitleElement.textContent = `Scenario: ${scenarioName.replace('_', ' ').toUpperCase()}`;
        
        stepsContainer.innerHTML = '<p class="placeholder-text">Loading call steps...</p>'; // Show loading message
        try {
            // Adjust the path if your kb.json is elsewhere relative to core-flow.html
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
                updateNavigationButtons(); // Update nav buttons state
            } else {
                console.error('Scenario not found, has no steps, or steps array is empty:', scenarioName);
                stepsContainer.innerHTML = `<p style="color:red;">Error: Scenario '${scenarioName}' not found or is empty.</p>`;
                nextStepBtn.style.display = 'none';
                prevStepBtn.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to load or parse kb.json:', error);
            stepsContainer.innerHTML = `<p style="color:red;">Error loading scenario: ${error.message}. Please check console.</p>`;
            nextStepBtn.style.display = 'none';
            prevStepBtn.style.display = 'none';
        }
    }

    function displayStep(index) {
        if (index >= 0 && index < currentSteps.length) {
            stepsContainer.innerHTML = `<p>${currentSteps[index]}</p>`;
        } else if (index >= currentSteps.length && currentSteps.length > 0) {
            stepsContainer.innerHTML = `<p><strong>End of scenario: ${currentScenarioName.replace('_', ' ').toUpperCase()}</strong></p><p>You have completed all steps.</p>`;
        }
        updateNavigationButtons();
    }
    
    function updateNavigationButtons() {
        if (currentSteps.length === 0) {
            prevStepBtn.style.display = 'none';
            nextStepBtn.style.display = 'none';
            return;
        }

        // Previous button visibility
        if (currentStepIndex > 0) {
            prevStepBtn.style.display = 'inline-block';
        } else {
            prevStepBtn.style.display = 'none';
        }

        // Next button text/visibility
        if (currentStepIndex < currentSteps.length - 1) {
            nextStepBtn.textContent = 'Next Step';
            nextStepBtn.style.display = 'inline-block';
        } else if (currentStepIndex === currentSteps.length - 1) {
            nextStepBtn.textContent = 'Finish Scenario'; // Or "Complete Call"
            nextStepBtn.style.display = 'inline-block';
        } else { // Beyond the last step (scenario ended)
            nextStepBtn.style.display = 'none';
            prevStepBtn.style.display = (currentSteps.length > 0) ? 'inline-block' : 'none'; // Allow going back if steps exist
        }
    }

    nextStepBtn.addEventListener('click', () => {
        if (currentStepIndex < currentSteps.length -1) {
            currentStepIndex++;
            displayStep(currentStepIndex);
        } else if (currentStepIndex === currentSteps.length -1) {
            // This was the last step, now "Finish Scenario" was clicked
            currentStepIndex++; // Move past the last step
            displayStep(currentStepIndex); // Display end of scenario message
            console.log(`Scenario ${currentScenarioName} finished.`);
            // Here you might trigger evaluation, save session, etc.
            // For now, just shows end message and hides next button
        }
    });

    prevStepBtn.addEventListener('click', () => { // Added Previous button functionality
        if (currentStepIndex > 0) {
            currentStepIndex--;
            displayStep(currentStepIndex);
        }
    });
    
    endCallBtn.addEventListener('click', () => {
        console.log("End Call button clicked.");
        // Reset to initial state
        callFlowViewDiv.style.display = 'none';
        initialViewDiv.style.display = 'block';
        endCallBtn.style.display = 'none';
        prevStepBtn.style.display = 'none';
        nextStepBtn.style.display = 'inline-block'; // Reset next button
        nextStepBtn.textContent = 'Next Step';
        stepsContainer.innerHTML = '<p class="placeholder-text">Loading call steps...</p>';
        currentSteps = [];
        currentStepIndex = 0;
        currentScenarioName = null;
        if(scenarioTitleElement) scenarioTitleElement.textContent = "Call Scenario";
         // Potentially log call end time, result etc. with Supabase here
    });

    console.log("CoreFlow.js script fully loaded and event listeners attached.");
});
