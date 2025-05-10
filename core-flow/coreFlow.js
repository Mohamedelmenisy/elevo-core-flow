document.addEventListener('DOMContentLoaded', async () => {
    console.log("CoreFlow.js DOMContentLoaded");

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
    function updateSystemStatus(statusText, statusClass = 'status-waiting') { /* ... (كما هو) ... */ }
    function startCallTimer() {
        if (callTimerDiv) {
            callTimerDiv.style.display = 'block'; 
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
    function stopCallTimer() { /* ... (كما هو) ... */ }
    function renderProgressTracker() { /* ... (كما هو) ... */ }
    function typeWriterEffect(element, message, speed = 30, callback) { /* ... (كما هو) ... */ }
    function showAssistantMessage(message, showImmediately = false, duration = 5000, onHideCallback) { /* ... (كما هو) ... */ }

    // --- 2. "RECEIVE CALL" BUTTON FUNCTIONALITY ---
    if (receiveCallBtn) {
        receiveCallBtn.addEventListener('click', async () => {
            console.log("Receive Call button clicked");
            // ... (باقي الكود كما هو، مع التأكد أن استدعاء startCallTimer() موجود في المكان الصحيح) ...
            if (initialViewDiv) initialViewDiv.style.display = 'none';
            if (callFlowViewDiv) callFlowViewDiv.style.display = 'block';
            if (endCallBtn) endCallBtn.style.display = 'inline-flex';
            updateSystemStatus("🟡 Loading Scenario...", "status-waiting");

            try {
                const { data: scenario, error } = await supabase.from('call_scenarios').select('name, steps').eq('is_active', true).limit(1).single();
                if (error || !scenario || !scenario.steps || scenario.steps.length === 0) {
                    // ... (معالجة الخطأ كما في الرد السابق، مع إخفاء المؤقت إذا لزم الأمر) ...
                    if (callTimerDiv) callTimerDiv.style.display = 'none';
                    if (error && error.code === 'PGRST116') showAssistantMessage("⚠️ No active scenario.", true, 7000); else showAssistantMessage("❗ Scenario error.", true, 7000);
                    return;
                }
                currentScenarioName = scenario.name;
                currentSteps = scenario.steps; 
                currentStepIndex = 0;
                if (scenarioTitleElement) scenarioTitleElement.textContent = currentScenarioName;
                updateSystemStatus("🟢 In Call", "status-in-call");
                startCallTimer(); // <<--- ENSURE THIS IS CALLED
                renderProgressTracker();
                renderStep(); 
                showAssistantMessage(`🚀 Scenario "${currentScenarioName}" started!`, true, 0);
            } catch (err) {
                console.error("Failed to process scenario:", err);
                if (callTimerDiv) callTimerDiv.style.display = 'none';
                updateSystemStatus("🔴 Error", "status-waiting");
                showAssistantMessage(`❗ Error: ${err.message}`, true, 7000);
            }
        });
    }

    // --- 3. RENDER STEP FUNCTION ---
    function renderStep() { /* ... (كما هو من الرد السابق) ... */ }

    // --- 4. NAVIGATION BUTTONS ---
    if (nextStepBtn) { /* ... (كما هو) ... */ }
    if (prevStepBtn) { /* ... (كما هو) ... */ }
    
    // --- 5. END CALL BUTTON ---
    if (endCallBtn) { /* ... (كما هو، مع التأكد من إخفاء المؤقت) ... */ }

    console.log("CoreFlow.js script fully loaded.");
});
