<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Elevo Core</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2317a2b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 12h18M3 6h12M3 18h15'/><path d='M17 9l4 3l-4 3'/></svg>">

    <link rel="stylesheet" href="style.css"> <!-- Main style.css (SHARED) -->

    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        /* dashboard.css - Specific styles INLINED - Minor adjustments possible */
        /* Most styles moved to style.css to avoid duplication and ensure consistency */
        /* Keeping only very specific overrides or layout adjustments if necessary */

        /* Placeholder styling for the table row when no data - Ensure it picks up from main CSS */
        #recentCallsTable .placeholder-row td svg {
             display: block; /* Ensure SVG is block for auto margins to work */
             margin: 0 auto 0.5rem auto; /* Center SVG above text */
        }

        /* Ensure date picker is clickable, if any specific z-index issues arise */
        .filter-grid input[type="date"] {
            position: relative; /* Keep relative positioning */
            z-index: 1; /* Added z-index just in case of stacking issues */
            /* Native date pickers are generally hard to style extensively beyond color-scheme */
        }

        /* Logout button text is handled by the span, not comments */

    </style>
</head>
<body>
    <!-- Access Denied Modal -->
    <div id="accessDeniedModal" style="display: none;"> <!-- Initially hidden via style -->
         <div class="access-denied-content">
             <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                 <circle cx="12" cy="12" r="10"></circle>
                 <line x1="12" y1="8" x2="12" y2="12"></line>
                 <line x1="12" y1="16" x2="12.01" y2="16"></line>
             </svg>
             <h3>Access Denied</h3>
             <p>You do not have permission to view this page. This section is restricted to administrators.</p>
             <button id="returnToAppBtn" class="action-button primary-button">Return to Agent App</button>
         </div>
    </div>

    <!-- Main App Container (Initially hidden) -->
    <div class="app-container" id="appContainerContent" style="display: none;">
        <header class="app-header">
            <div class="logo-container">
                <svg class="company-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 17L10 17M6 12L12 12M6 7L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M15 6L19 10L15 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" fill="transparent" opacity="0.6"/>
                </svg>
                <span class="app-title">Admin Dashboard - Elevo Core</span>
            </div>
            <div class="header-controls">
                 <a href="core-flow.html" class="nav-link">Core Flow</a>
                <div class="user-info" id="userInfo" style="display: none;">
                    <span id="userNameDisplay" class="user-name-display"></span>
                    <button id="logoutButton" class="logout-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        <span>Logout</span> <!-- Text is inside the span -->
                    </button>
                </div>
            </div>
        </header>

        <main class="app-main dashboard-main">
            <div class="dashboard-header">
                <div class="greeting-section">
                    <div id="userAvatarCharacter" class="user-avatar-char-dashboard"></div>
                    <div>
                        <h1 id="dashboardUserGreeting">Welcome, Admin!</h1>
                        <p id="dashboardUserSubtext">Overview of all agent activities.</p>
                    </div>
                </div>
            </div>

            <div id="loadingMessage" class="loading-container" style="display: flex;">
                <div class="spinner"></div>
                <p>Loading dashboard data...</p>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid" id="statsGrid" style="display: none;">
                 <div class="stat-card"><h3>Total Calls (Filtered)</h3><p id="totalCalls">0</p><span class="stat-period" id="statsPeriod">All Agents</span></div>
                 <div class="stat-card"><h3>Avg. Call Duration</h3><p id="avgCallDuration">0m 0s</p><span class="stat-period" id="statsPeriodDuration">All Agents</span></div>
                 <div class="stat-card"><h3>Completion Rate</h3><p id="completionRate">0%</p><span class="stat-period" id="statsPeriodCompletion">All Agents</span></div>
                 <div class="stat-card"><h3>Avg. Call Quality</h3><div class="quality-gauge"><div class="gauge-bar-container"><div id="gaugeGood" class="gauge-segment good"></div><div id="gaugeNormal" class="gauge-segment normal"></div><div id="gaugeBad" class="gauge-segment bad"></div></div><span id="avgQualityText">N/A</span></div></div>
            </div>

            <!-- Filter Controls -->
            <div class="filter-controls card" id="filterControlsCard" style="display: none;">
                <h3>Filter Call Sessions</h3>
                <div class="filter-grid">
                    <div><label for="userFilterDropdown">Agent:</label><select id="userFilterDropdown"><option value="">All Agents</option></select></div>
                    <div><label for="searchInput">Search (Scenario, Reason, Agent):</label><input type="text" id="searchInput" placeholder="Type and wait..."></div>
                    <div><label for="qualityFilter">Call Quality:</label><select id="qualityFilter"><option value="">All</option><option value="Good">Good</option><option value="Normal">Normal</option><option value="Bad">Bad</option><option value="N/A">N/A</option><option value="Error">Error</option></select></div>
                    <div><label for="startDateFilter">Date Range (Start Time):</label><div style="display: flex; gap: 0.5rem;"><input type="date" id="startDateFilter" title="Start date"><input type="date" id="endDateFilter" title="End date"></div></div>
                    <div class="filter-buttons-group">
                         <button id="resetFiltersBtn" class="action-button secondary-button">Reset Filters</button>
                    </div>
                </div>
            </div>

            <!-- Recent Activity Table -->
            <div class="recent-activity-section card" id="recentActivitySection" style="display: none;">
                <!-- Quality and Reason columns will now reflect data from the DB, populated by coreFlow.js's update -->
                <h2 id="recentCallsTitle">Recent Call Sessions</h2>
                <div class="table-responsive">
                    <table id="recentCallsTable">
                        <thead>
                            <tr>
                                <th>Agent Name</th><th>Agent Email</th><th>Scenario</th><th>Start Time</th><th>Duration</th><th>Completed</th><th>Quality</th><th>Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Placeholder shown via JS -->
                        </tbody>
                    </table>
                </div>
                 <button id="exportDataBtn" class="action-button secondary-button" style="margin-top: 1.5rem;">Export Filtered Data (CSV)</button>
            </div>
        </main>

        <footer class="app-footer">
            <p>© 2025 Mohamed Elmenisy - Elevo Core. All rights reserved.</p>
        </footer>
    </div>

    <script>
    // --- START OF EMBEDDED dashboard.js ---
    document.addEventListener('DOMContentLoaded', async () => {
        console.log("Admin Dashboard.js DOMContentLoaded - v2.3 (Quality Display Fix)"); // Version increment

        const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co';
        const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnY3V0bXVzcGNhcmFseWR5Y21nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0NDY3MDEsImV4cCI6MjA2MTAyMjcwMX0.3u5Y7pkH2NNnnoGLMWVfAa5b8fq88o1itRYnG1K38tE';
        let supabase;
        try {
            supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
            console.log("Supabase client initialized in admin dashboard.js v2.3");
        } catch (error) {
            console.error("Supabase client initialization failed:", error);
            alert("Error connecting to services. Please try again later.");
            return;
        }

        const appContainerContent = document.getElementById('appContainerContent');
        const loadingMessageDiv = document.getElementById('loadingMessage');
        const accessDeniedModal = document.getElementById('accessDeniedModal');
        const returnToAppBtn = document.getElementById('returnToAppBtn');

        let userNameDisplayHeader, dashboardUserGreeting, dashboardUserSubtext, userAvatarCharEl, logoutButton, userInfoDivHeader;
        let statsGridDiv, recentActivitySectionDiv, filterControlsCard;
        let totalCallsEl, avgCallDurationEl, completionRateEl;
        let gaugeGoodEl, gaugeNormalEl, gaugeBadEl, avgQualityTextEl;
        let recentCallsTableBody, exportDataBtn;
        let searchInput, qualityFilter, startDateFilter, endDateFilter, resetFiltersBtn, userFilterDropdown;
        let statsPeriodEl, statsPeriodDurationEl, statsPeriodCompletionEl, recentCallsTitleEl;

        let allUserCallSessions = [];
        let allAgentsList = [];
        let currentAuthUser = null;
        let filterTimeout = null;

        const FILTER_STORAGE_KEY = 'elevoCoreAdminFilters_v1'; // Added version to key

        function initializeDashboardDOMElements() {
            userNameDisplayHeader = document.getElementById('userNameDisplay');
            dashboardUserGreeting = document.getElementById('dashboardUserGreeting');
            dashboardUserSubtext = document.getElementById('dashboardUserSubtext');
            userAvatarCharEl = document.getElementById('userAvatarCharacter');
            logoutButton = document.getElementById('logoutButton');
            userInfoDivHeader = document.getElementById('userInfo');

            statsGridDiv = document.getElementById('statsGrid');
            recentActivitySectionDiv = document.getElementById('recentActivitySection');
            filterControlsCard = document.getElementById('filterControlsCard');

            totalCallsEl = document.getElementById('totalCalls');
            avgCallDurationEl = document.getElementById('avgCallDuration');
            completionRateEl = document.getElementById('completionRate');

            gaugeGoodEl = document.getElementById('gaugeGood');
            gaugeNormalEl = document.getElementById('gaugeNormal');
            gaugeBadEl = document.getElementById('gaugeBad');
            avgQualityTextEl = document.getElementById('avgQualityText');

            recentCallsTableBody = document.querySelector('#recentCallsTable tbody');
            exportDataBtn = document.getElementById('exportDataBtn');

            searchInput = document.getElementById('searchInput');
            qualityFilter = document.getElementById('qualityFilter');
            startDateFilter = document.getElementById('startDateFilter');
            endDateFilter = document.getElementById('endDateFilter');
            resetFiltersBtn = document.getElementById('resetFiltersBtn');
            userFilterDropdown = document.getElementById('userFilterDropdown');

            statsPeriodEl = document.getElementById('statsPeriod');
            statsPeriodDurationEl = document.getElementById('statsPeriodDuration');
            statsPeriodCompletionEl = document.getElementById('statsPeriodCompletion');
            recentCallsTitleEl = document.getElementById('recentCallsTitle');
        }

        function showAccessDenied(message = "You do not have permission to view this page. This section is restricted to administrators.") {
            if(loadingMessageDiv && loadingMessageDiv.style.display !== 'none') loadingMessageDiv.style.display = 'none';
            if(appContainerContent) appContainerContent.style.display = 'none';
            if(accessDeniedModal) {
                accessDeniedModal.querySelector('p').textContent = message;
                accessDeniedModal.style.display = 'flex';
             }
            if(returnToAppBtn) returnToAppBtn.onclick = () => {
                 window.location.href = 'core-flow.html';
            };
        }

        async function checkUserRoleAndLoadDashboard() {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                console.error("No active session or error fetching session:", sessionError);
                const currentPath = '/core-flow/dashboard.html';
                window.location.href = `../legacy/login.html?redirectTo=${encodeURIComponent(currentPath)}`;
                return;
            }
            currentAuthUser = session.user;

             try {
                 console.log("Invoking check-admin-access Edge Function...");
                 const { data: adminStatus, error: functionError } = await supabase.functions.invoke('check-admin-access');

                 if (functionError) {
                     console.error("Error calling check-admin-access function:", functionError);
                      if (functionError.context?.status === 401) {
                         showAccessDenied("Authentication failed. Please log in again.");
                      } else if (functionError.context?.status === 404) {
                          showAccessDenied("Your user profile could not be found.");
                      } else {
                          showAccessDenied(`An error occurred while verifying access: ${functionError.message || 'Unknown error'}`);
                      }
                     return;
                 }

                 if (adminStatus && adminStatus.isAdmin) {
                     console.log("User IS Admin. Loading admin dashboard.");
                     if(loadingMessageDiv) loadingMessageDiv.style.display = 'flex';
                     if(appContainerContent) appContainerContent.style.display = 'flex';
                     initializeDashboardDOMElements();
                     loadPersistedFilters();
                     await loadAdminDashboardData();
                     setupFilterEventListeners();
                 } else {
                     console.log("User is NOT Admin. Access denied.");
                     showAccessDenied();
                 }
             } catch (invokeError) {
                 console.error("Failed to invoke Edge Function:", invokeError);
                 showAccessDenied(`Could not verify your access level due to a network or server issue.`);
             }
        }

        async function fetchAllAgents() {
            const { data: agents, error } = await supabase
                .from('users')
                .select('id, email, name')
                .order('name', { ascending: true });
            if (error) {
                console.error("Error fetching agents list:", error);
                return [];
            }
            allAgentsList = agents || [];
            return allAgentsList;
        }

        function populateUserFilterDropdown() {
            if (!userFilterDropdown || !allAgentsList) return;
            const currentVal = userFilterDropdown.value;
            userFilterDropdown.innerHTML = '<option value="">All Agents</option>';
            allAgentsList.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = `${agent.name || 'N/A'} (${agent.email})`;
                 if (agent.id === currentVal) {
                     option.selected = true;
                 }
                userFilterDropdown.appendChild(option);
            });
        }

        function renderRecentCallsTable(sessionsToRender) {
            if (!recentCallsTableBody) return;
            recentCallsTableBody.innerHTML = '';

            if (!sessionsToRender || sessionsToRender.length === 0) {
                recentCallsTableBody.innerHTML = `
                    <tr class="placeholder-row">
                        <td colspan="8">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="15" x2="16" y2="15"></line><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                            No call sessions match your filters. Try adjusting the criteria.
                        </td>
                     </tr>`;
            } else {
                sessionsToRender.forEach(session => {
                     const agent = allAgentsList.find(a => a.id === session.user_id);
                     const agentName = agent?.name || 'Unknown';
                     const agentEmail = agent?.email || 'N/A';

                    const row = recentCallsTableBody.insertRow();
                    const scenarioName = session.call_scenarios?.name || 'N/A';
                    const startTime = session.start_time ? new Date(session.start_time).toLocaleString() : 'N/A';
                    const durationSec = session.total_duration_seconds ?? 0;
                    const durationFormatted = `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`;
                    const completedText = session.completed_all_steps ? 'Yes' : 'No';
                    
                    const qualityValue = session.call_quality; // Raw value
                    const reasonText = session.quality_reason || '-';

                    row.insertCell().textContent = agentName;
                    row.insertCell().textContent = agentEmail;
                    row.insertCell().textContent = scenarioName;
                    row.insertCell().textContent = startTime;
                    row.insertCell().textContent = durationFormatted;
                    row.insertCell().textContent = completedText;

                    const qualityCell = row.insertCell();
                    qualityCell.classList.add('quality-cell');

                    const iconSpan = document.createElement('span');
                    iconSpan.classList.add('quality-icon');
                    let iconSvg = '';
                    let qualityClass = 'na';
                    let displayQualityText = qualityValue || 'N/A';

                    // Check for evaluation error first
                    if ((!qualityValue || qualityValue === 'N/A') &&
                        (reasonText.toLowerCase().includes('failed') ||
                         reasonText.toLowerCase().includes('error') ||
                         reasonText.toLowerCase().includes('empty response'))) {
                        displayQualityText = 'Error';
                        qualityClass = 'bad'; // Use 'bad' styling (red color) for 'Error'
                        // Exclamation icon for Error
                        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
                    } else {
                        // Normal quality handling
                        switch (qualityValue?.toLowerCase()) {
                            case 'good':
                                 iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
                                 qualityClass = 'good';
                                 break;
                            case 'normal':
                                 iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
                                 qualityClass = 'normal';
                                 break;
                            case 'bad':
                                 iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
                                 qualityClass = 'bad';
                                 break;
                            default: // Handles 'N/A' or other null/undefined where not an error
                                 iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
                                 qualityClass = 'na';
                                 displayQualityText = 'N/A'; // Ensure it explicitly says N/A
                        }
                    }
                    iconSpan.innerHTML = iconSvg;
                    iconSpan.classList.add(qualityClass);
                    qualityCell.appendChild(iconSpan);
                    qualityCell.appendChild(document.createTextNode(` ${displayQualityText}`));

                    row.insertCell().textContent = reasonText;
                });
            }
        }

        function updateDashboardStats(sessionsForStats) {
             if (!totalCallsEl || !avgCallDurationEl || !completionRateEl || !gaugeGoodEl || !gaugeNormalEl || !gaugeBadEl || !avgQualityTextEl) return;

            const numSessions = sessionsForStats.length;
            totalCallsEl.textContent = numSessions;

            if (numSessions > 0) {
                const completedSessionsCount = sessionsForStats.filter(s => s.completed_all_steps === true).length;
                const rate = Math.round((completedSessionsCount / numSessions) * 100);
                completionRateEl.textContent = `${rate}%`;

                const totalDurationSum = sessionsForStats.reduce((sum, session) => sum + (session.total_duration_seconds || 0), 0);
                const avgDuration = numSessions > 0 ? Math.round(totalDurationSum / numSessions) : 0;
                const minutes = Math.floor(avgDuration / 60);
                const seconds = avgDuration % 60;
                avgCallDurationEl.textContent = `${minutes}m ${seconds}s`;

                let goodCalls = 0, normalCalls = 0, badCalls = 0, errorCalls = 0;
                sessionsForStats.forEach(s => {
                    const qualityLower = s.call_quality?.toLowerCase();
                    const reasonText = s.quality_reason || "";
                    if ((!s.call_quality || s.call_quality === 'N/A') && 
                        (reasonText.toLowerCase().includes('failed') || reasonText.toLowerCase().includes('error'))) {
                        errorCalls++; // Count errors separately for gauge logic
                    } else if (qualityLower === 'good') goodCalls++;
                    else if (qualityLower === 'normal') normalCalls++;
                    else if (qualityLower === 'bad') badCalls++;
                });
                // For gauge, treat 'Error' as 'Bad'
                badCalls += errorCalls;
                const totalRatedCalls = goodCalls + normalCalls + badCalls;

                if (totalRatedCalls > 0) {
                    gaugeGoodEl.style.width = `${(goodCalls / totalRatedCalls) * 100}%`;
                    gaugeNormalEl.style.width = `${(normalCalls / totalRatedCalls) * 100}%`;
                    gaugeBadEl.style.width = `${(badCalls / totalRatedCalls) * 100}%`;
                    
                    if (badCalls / totalRatedCalls > 0.3) avgQualityTextEl.textContent = "Improvement Needed";
                    else if (goodCalls / totalRatedCalls >= 0.6) avgQualityTextEl.textContent = "Mostly Good";
                     else if (goodCalls / totalRatedCalls >= 0.4) avgQualityTextEl.textContent = "Good";
                    else if (normalCalls / totalRatedCalls >= 0.5) avgQualityTextEl.textContent = "Mostly Normal";
                    else avgQualityTextEl.textContent = "Mixed Quality";
                } else {
                    gaugeGoodEl.style.width = `0%`;
                    gaugeNormalEl.style.width = `0%`;
                    gaugeBadEl.style.width = `0%`;
                    avgQualityTextEl.textContent = "No Rated Calls";
                }
            } else {
                avgCallDurationEl.textContent = '0m 0s';
                completionRateEl.textContent = '0%';
                if(gaugeGoodEl) gaugeGoodEl.style.width = `0%`;
                if(gaugeNormalEl) gaugeNormalEl.style.width = `0%`;
                if(gaugeBadEl) gaugeBadEl.style.width = `0%`;
                if(avgQualityTextEl) avgQualityTextEl.textContent = "No Calls Found";
            }
        }

        function saveFiltersToLocalStorage() {
             if (!searchInput || !qualityFilter || !startDateFilter || !endDateFilter || !userFilterDropdown) return;
             const filters = {
                 searchTerm: searchInput.value,
                 quality: qualityFilter.value,
                 startDate: startDateFilter.value,
                 endDate: endDateFilter.value,
                 agentId: userFilterDropdown.value
             };
             localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters));
         }

         function loadPersistedFilters() {
            const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
             if (savedFilters && searchInput && qualityFilter && startDateFilter && endDateFilter && userFilterDropdown) {
                 try {
                     const filters = JSON.parse(savedFilters);
                     searchInput.value = filters.searchTerm || '';
                     qualityFilter.value = filters.quality || '';
                     startDateFilter.value = filters.startDate || '';
                     endDateFilter.value = filters.endDate || '';
                     userFilterDropdown.value = filters.agentId || '';
                 } catch (e) {
                     console.error("Error parsing saved filters:", e);
                     localStorage.removeItem(FILTER_STORAGE_KEY);
                 }
             }
         }

        function applyCurrentFilters() {
             saveFiltersToLocalStorage();

             let filteredSessions = [...allUserCallSessions];
             const searchTerm = (searchInput?.value || '').toLowerCase().trim();
             const selectedQuality = qualityFilter?.value || '';
             const startDate = startDateFilter?.value || '';
             const endDate = endDateFilter?.value || '';
             const selectedAgentId = userFilterDropdown?.value || '';

            let statsLabel = "All Agents";
            let tableTitle = "All Recent Call Sessions";

            if (selectedAgentId) {
                filteredSessions = filteredSessions.filter(session => session.user_id === selectedAgentId);
                 const selectedAgent = allAgentsList.find(a => a.id === selectedAgentId);
                 if (selectedAgent) {
                     statsLabel = selectedAgent.name || selectedAgent.email;
                     tableTitle = `Call Sessions for ${statsLabel}`;
                 } else {
                     statsLabel = "Selected Agent";
                     tableTitle = `Call Sessions for Selected Agent (${selectedAgentId})`;
                 }
            }
             if(statsPeriodEl) statsPeriodEl.textContent = statsLabel;
             if(statsPeriodDurationEl) statsPeriodDurationEl.textContent = statsLabel;
             if(statsPeriodCompletionEl) statsPeriodCompletionEl.textContent = statsLabel;
             if(recentCallsTitleEl) recentCallsTitleEl.textContent = tableTitle;

            if (searchTerm) {
                filteredSessions = filteredSessions.filter(session => {
                     const scenarioName = (session.call_scenarios?.name || '').toLowerCase();
                     const reason = (session.quality_reason || '').toLowerCase();
                     const agent = allAgentsList.find(a => a.id === session.user_id);
                     const agentNameSearch = agent ? (agent.name || '').toLowerCase() : '';
                     const agentEmailSearch = agent ? (agent.email || '').toLowerCase() : '';
                     return scenarioName.includes(searchTerm) ||
                            reason.includes(searchTerm) ||
                            agentNameSearch.includes(searchTerm) ||
                            agentEmailSearch.includes(searchTerm);
                });
            }

            if (selectedQuality) {
                if (selectedQuality === "N/A") {
                    filteredSessions = filteredSessions.filter(session => 
                        (!session.call_quality || session.call_quality === 'N/A') &&
                        !(session.quality_reason && (session.quality_reason.toLowerCase().includes('failed') || session.quality_reason.toLowerCase().includes('error'))) // Exclude actual errors from "N/A" filter
                    );
                } else if (selectedQuality === "Error") {
                    filteredSessions = filteredSessions.filter(session =>
                        (!session.call_quality || session.call_quality === 'N/A') && // Errors are stored as N/A or null quality
                        (session.quality_reason && (session.quality_reason.toLowerCase().includes('failed') || session.quality_reason.toLowerCase().includes('error')))
                    );
                } else {
                    filteredSessions = filteredSessions.filter(session => session.call_quality?.toLowerCase() === selectedQuality.toLowerCase());
                }
            }

             if (startDate) {
                 try {
                    const startDateTime = new Date(startDate);
                    startDateTime.setHours(0, 0, 0, 0);
                    filteredSessions = filteredSessions.filter(session => {
                        return session.start_time && new Date(session.start_time) >= startDateTime;
                    });
                 } catch (e) { console.error("Invalid start date:", startDate, e); }
             }
             if (endDate) {
                 try {
                    const endDateTime = new Date(endDate);
                    endDateTime.setHours(23, 59, 59, 999);
                    filteredSessions = filteredSessions.filter(session => {
                        return session.start_time && new Date(session.start_time) <= endDateTime;
                    });
                 } catch (e) { console.error("Invalid end date:", endDate, e); }
             }

            renderRecentCallsTable(filteredSessions);
            updateDashboardStats(filteredSessions);
        }

        function setupFilterEventListeners() {
            const applyDebouncedFilter = () => {
                 clearTimeout(filterTimeout);
                 filterTimeout = setTimeout(applyCurrentFilters, 400);
            };

             if (searchInput) searchInput.addEventListener('input', applyDebouncedFilter);
             if (qualityFilter) qualityFilter.addEventListener('change', applyCurrentFilters);
             if (startDateFilter) startDateFilter.addEventListener('change', applyCurrentFilters);
             if (endDateFilter) endDateFilter.addEventListener('change', applyCurrentFilters);
             if (userFilterDropdown) userFilterDropdown.addEventListener('change', applyCurrentFilters);

            if (resetFiltersBtn) {
                resetFiltersBtn.addEventListener('click', () => {
                     if(searchInput) searchInput.value = '';
                     if(qualityFilter) qualityFilter.value = '';
                     if(startDateFilter) startDateFilter.value = '';
                     if(endDateFilter) endDateFilter.value = '';
                     if(userFilterDropdown) userFilterDropdown.value = '';
                     localStorage.removeItem(FILTER_STORAGE_KEY);
                     applyCurrentFilters();
                });
            }
        }

        async function loadAdminDashboardData() {
             if (!currentAuthUser) {
                 showAccessDenied("Authentication details missing.");
                 return;
             }

             if (loadingMessageDiv) loadingMessageDiv.style.display = 'flex';
             if (statsGridDiv) statsGridDiv.style.display = 'none';
             if (recentActivitySectionDiv) recentActivitySectionDiv.style.display = 'none';
             if (filterControlsCard) filterControlsCard.style.display = 'none';
             if (appContainerContent) appContainerContent.style.display = 'flex';

             await fetchAllAgents();

             const userEmailPrefix = currentAuthUser.email ? currentAuthUser.email.split('@')[0] : 'Admin';
             const capitalizedUserName = userEmailPrefix.charAt(0).toUpperCase() + userEmailPrefix.slice(1);
             const currentUserDetails = allAgentsList.find(a => a.id === currentAuthUser.id);
             const displayUserName = currentUserDetails?.name || capitalizedUserName;
             const initialLetter = displayUserName ? displayUserName.charAt(0).toUpperCase() : '?';

              if (userNameDisplayHeader) userNameDisplayHeader.textContent = displayUserName;
              if (dashboardUserGreeting) dashboardUserGreeting.textContent = `Welcome, ${displayUserName}!`;
              if (dashboardUserSubtext) dashboardUserSubtext.textContent = "Oversee all agent activities and performance.";
              if (userInfoDivHeader) userInfoDivHeader.style.display = 'flex';
              if (userAvatarCharEl) userAvatarCharEl.textContent = initialLetter;

             if(logoutButton) {
                 logoutButton.addEventListener('click', async () => {
                     const { error } = await supabase.auth.signOut();
                     if (error) console.error("Logout error:", error);
                     else window.location.href = '../legacy/login.html';
                 });
             }

             populateUserFilterDropdown();
             loadPersistedFilters(); // Ensures filter values are applied after options are loaded

             const { data: callSessions, error: sessionsError } = await supabase
                 .from('call_sessions')
                 .select(`
                     id, user_id, scenario_id, start_time, end_time,
                     total_duration_seconds, completed_all_steps, created_at,
                     call_quality, quality_reason,
                     call_scenarios ( name )
                  `)
                 .order('start_time', { ascending: false });

             if (sessionsError) {
                 console.error("Error fetching all call sessions for admin:", sessionsError);
                 if (loadingMessageDiv) loadingMessageDiv.innerHTML = `<p style="color:red;">Could not load activity data. Error: ${sessionsError.message}</p>`;
                 allUserCallSessions = [];
             } else {
                 allUserCallSessions = callSessions || [];
             }

             applyCurrentFilters();

             if (statsGridDiv) { statsGridDiv.style.display = 'grid'; statsGridDiv.classList.add('loaded-fade-in'); }
             if (recentActivitySectionDiv) { recentActivitySectionDiv.style.display = 'block'; recentActivitySectionDiv.classList.add('loaded-fade-in'); }
             if (filterControlsCard) { filterControlsCard.style.display = 'block'; filterControlsCard.classList.add('loaded-fade-in'); }
             if (loadingMessageDiv) loadingMessageDiv.style.display = 'none';
        }

         if (exportDataBtn) {
             exportDataBtn.addEventListener('click', () => {
                 console.log("Export button clicked. Attempting to generate CSV for filtered data...");
                 // Re-filter logic for export is crucial and already present
                 let sessionsToExport = [...allUserCallSessions];
                 const searchTerm = (searchInput?.value || '').toLowerCase().trim();
                 const selectedQuality = qualityFilter?.value || '';
                 const startDate = startDateFilter?.value || '';
                 const endDate = endDateFilter?.value || '';
                 const selectedAgentId = userFilterDropdown?.value || '';

                 if (selectedAgentId) sessionsToExport = sessionsToExport.filter(s => s.user_id === selectedAgentId);
                 if (searchTerm) {
                     sessionsToExport = sessionsToExport.filter(session => {
                         const sn = (session.call_scenarios?.name || '').toLowerCase();
                         const r = (session.quality_reason || '').toLowerCase();
                         const ag = allAgentsList.find(a => a.id === session.user_id);
                         const agN = ag ? (ag.name || '').toLowerCase() : '';
                         const agE = ag ? (ag.email || '').toLowerCase() : '';
                         return sn.includes(searchTerm) || r.includes(searchTerm) || agN.includes(searchTerm) || agE.includes(searchTerm);
                     });
                 }
                 
                if (selectedQuality) {
                    if (selectedQuality === "N/A") {
                        sessionsToExport = sessionsToExport.filter(s => 
                            (!s.call_quality || s.call_quality === 'N/A') &&
                            !(s.quality_reason && (s.quality_reason.toLowerCase().includes('failed') || s.quality_reason.toLowerCase().includes('error')))
                        );
                    } else if (selectedQuality === "Error") {
                         sessionsToExport = sessionsToExport.filter(s =>
                            (!s.call_quality || s.call_quality === 'N/A') &&
                            (s.quality_reason && (s.quality_reason.toLowerCase().includes('failed') || s.quality_reason.toLowerCase().includes('error')))
                        );
                    } else {
                        sessionsToExport = sessionsToExport.filter(s => s.call_quality?.toLowerCase() === selectedQuality.toLowerCase());
                    }
                }

                 if (startDate) {
                     try {
                         const startD = new Date(startDate); startD.setHours(0, 0, 0, 0);
                         sessionsToExport = sessionsToExport.filter(s => s.start_time && new Date(s.start_time) >= startD);
                     } catch (e) { console.error("Invalid start date for export:", e); }
                 }
                 if (endDate) {
                    try {
                         const endD = new Date(endDate); endD.setHours(23, 59, 59, 999);
                         sessionsToExport = sessionsToExport.filter(s => s.start_time && new Date(s.start_time) <= endD);
                    } catch (e) { console.error("Invalid end date for export:", e); }
                 }

                 if (sessionsToExport.length === 0) {
                     alert("No data matches the current filters to export.");
                     console.log("Export aborted: No data to export after filtering.");
                     return;
                 }
                 console.log(`Exporting ${sessionsToExport.length} sessions.`);

                 exportDataBtn.disabled = true;
                 exportDataBtn.textContent = "Exporting...";

                 const headers = ["Session_ID", "Agent_Name", "Agent_Email", "Scenario_Name", "Start_Time", "End_Time", "Duration_Seconds", "Completed_Steps", "Call_Quality", "Quality_Reason", "Agent_ID"];
                 const csvRows = [headers.join(',')];

                 sessionsToExport.forEach(session => {
                     const agent = allAgentsList.find(a => a.id === session.user_id);
                     const escapeCSV = (text) => {
                        if (text === null || text === undefined) return '';
                        const str = String(text);
                        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                            return `"${str.replace(/"/g, '""')}"`;
                        }
                        return str;
                     };

                     let displayQualityForExport = session.call_quality || 'N/A';
                     if ((!session.call_quality || session.call_quality === 'N/A') && 
                         (session.quality_reason && (session.quality_reason.toLowerCase().includes('failed') || session.quality_reason.toLowerCase().includes('error')))) {
                         displayQualityForExport = 'Error';
                     }

                     const values = [
                         session.id,
                         escapeCSV(agent?.name || 'Unknown'),
                         escapeCSV(agent?.email || 'N/A'),
                         escapeCSV(session.call_scenarios?.name || 'N/A'),
                         escapeCSV(session.start_time ? new Date(session.start_time).toLocaleString() : 'N/A'),
                         escapeCSV(session.end_time ? new Date(session.end_time).toLocaleString() : 'N/A'),
                         session.total_duration_seconds ?? '',
                         session.completed_all_steps ? 'Yes' : 'No',
                         escapeCSV(displayQualityForExport), // Use modified quality for export
                         escapeCSV(session.quality_reason || ''),
                         escapeCSV(session.user_id || '')
                     ];
                     csvRows.push(values.join(','));
                 });

                 const csvString = csvRows.join('\n');
                 const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
                 const link = document.createElement("a");
                 const url = URL.createObjectURL(blob);
                 const fileName = `elevo_filtered_calls_${new Date().toISOString().slice(0,10)}.csv`;

                 link.setAttribute("href", url);
                 link.setAttribute("download", fileName);
                 link.style.visibility = 'hidden';
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 URL.revokeObjectURL(url);
                 console.log("CSV download initiated successfully.");

                 exportDataBtn.disabled = false;
                 exportDataBtn.textContent = "Export Filtered Data (CSV)";
             });
         }

        checkUserRoleAndLoadDashboard();

        console.log("Admin Dashboard.js v2.3 script fully loaded.");
    });
    // --- END OF EMBEDDED dashboard.js ---
    </script>
</body>
</html>
// ✅ تم إضافة هذا الجزء لتقييم المكالمة تلقائيًا باستخدام Supabase Edge Function
async function evaluateCallSession(sessionData) {
  try {
    const supabaseUrl = 'https://lgcutmuspcaralydycmg.supabase.co';
    const { data, error } = await supabase.auth.getSession();
    const accessToken = data?.session?.access_token;

    const response = await fetch(`${supabaseUrl}/functions/v1/evaluate-call-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      throw new Error("Failed to evaluate session");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      quality: "N/A",
      reason: "Quality check failed: " + error.message,
    };
  }
}
