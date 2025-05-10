/* CSS Variables for Theming */
:root {
    --primary-color: #007bff; /* Professional Blue */
    --primary-hover-color: #0056b3;
    --secondary-color: #6c757d; /* Muted Grey for secondary actions */
    --secondary-hover-color: #545b62;
    --accent-color: #17a2b8; /* Informational Cyan/Teal */
    --success-color: #28a745;
    --danger-color: #dc3545;
    --danger-hover-color: #c82333;
    --warning-color: #ffc107;
    
    --header-bg: #ffffff;
    --header-text-color: #343a40;
    --header-border-color: #e9ecef;
    
    --body-bg-color: #f8f9fa; /* Very light grey */
    --card-bg-color: #ffffff;
    --text-color-dark: #212529;
    --text-color-medium: #495057;
    --text-color-light: #6c757d;
    --text-color-subtle: #adb5bd;
    --border-color: #dee2e6;

    --font-family-main: 'Poppins', 'Roboto', 'Segoe UI', sans-serif;
    --border-radius-sm: 0.2rem;
    --border-radius-md: 0.375rem;
    --border-radius-lg: 0.5rem;

    --shadow-sm: 0 .125rem .25rem rgba(0,0,0,.075);
    --shadow-md: 0 .5rem 1rem rgba(0,0,0,.1);
    --shadow-lg: 0 1rem 3rem rgba(0,0,0,.12);

    --transition-speed: 0.2s;
}

/* Global Resets and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: var(--font-family-main);
    background-color: var(--body-bg-color);
    color: var(--text-color-dark);
    line-height: 1.6;
    display: flex;
    justify-content: center;
    align-items: flex-start; /* Align app container to top */
    min-height: 100vh;
    font-size: 16px;
    padding-top: 20px; /* Add some space at the top */
    padding-bottom: 20px;
}

.app-container {
    width: 100%;
    max-width: 900px; /* Slightly narrower for focus */
    display: flex;
    flex-direction: column;
    background-color: var(--card-bg-color);
    box-shadow: var(--shadow-lg);
    border-radius: var(--border-radius-lg);
    overflow: hidden; /* To contain border-radius of children */
}

/* Header Styles */
.app-header {
    background: var(--header-bg);
    color: var(--header-text-color);
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--header-border-color);
}

.logo-container {
    display: flex;
    align-items: center;
}

.company-logo {
    height: 32px; 
    width: 32px;
    margin-right: 0.75rem;
    color: var(--primary-color); /* Logo uses primary color */
}
.app-title {
    font-size: 1.5em;
    font-weight: 600;
    color: var(--text-color-dark);
}

.user-info {
    display: flex;
    align-items: center;
}

.user-name-display {
    margin-right: 1rem;
    font-weight: 500;
    color: var(--text-color-medium);
}

.logout-btn {
    background-color: transparent;
    color: var(--secondary-color);
    border: 1px solid var(--border-color);
    padding: 0.5rem 0.8rem;
    border-radius: var(--border-radius-md);
    cursor: pointer;
    font-size: 0.9em;
    font-weight: 500;
    transition: all var(--transition-speed) ease;
    display: inline-flex;
    align-items: center;
}
.logout-btn svg {
    margin-right: 0.3rem;
}
.logout-btn:hover {
    background-color: var(--danger-color);
    color: white;
    border-color: var(--danger-color);
}

/* Main Content Area */
.app-main {
    flex-grow: 1;
    padding: 2rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: center; 
    align-items: center; 
}

/* Card Styles */
.card {
    background-color: var(--card-bg-color);
    padding: 2rem;
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    text-align: center;
    width: 100%;
    max-width: 550px;
    transition: opacity 0.3s ease, transform 0.3s ease;
    margin-top: 1rem; /* Space if multiple cards were stacked */
}
.initial-card .card-icon {
    color: var(--primary-color);
    margin-bottom: 1rem;
}
.initial-card .card-icon svg {
    width: 56px;
    height: 56px;
}

.card-title {
    color: var(--text-color-dark);
    margin-bottom: 0.5rem;
    font-size: 1.75em;
    font-weight: 600;
}
.scenario-title-dynamic {
    font-size: 1.5em;
    margin-bottom: 1.25rem;
}
.card-subtitle {
    color: var(--text-color-light);
    margin-bottom: 1.75rem;
    font-size: 1.05em;
}

/* Button Styles */
.action-button, .nav-button {
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius-md);
    font-size: 1em;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-speed) ease;
    display: inline-flex; 
    align-items: center;
    justify-content: center;
    text-decoration: none;
    gap: 0.5rem; /* Space between icon and text */
}
.action-button:hover, .nav-button:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-sm);
}

.primary-button {
    background-color: var(--primary-color);
    color: white;
}
.primary-button:hover {
    background-color: var(--primary-hover-color);
}

.secondary-button {
    background-color: var(--secondary-color);
    color: white;
}
.secondary-button:hover {
    background-color: var(--secondary-hover-color);
}

.danger-button {
    background-color: var(--danger-color);
    color: white;
}
.danger-button:hover {
    background-color: var(--danger-hover-color);
}

/* Call Flow Specific Styles */
.steps-area {
    background-color: var(--body-bg-color); 
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-md);
    padding: 1.25rem;
    margin-top: 1.25rem;
    margin-bottom: 1.5rem;
    min-height: 120px; 
    text-align: left; 
}
.steps-area p {
    font-size: 1.05em;
    color: var(--text-color-medium);
    margin-bottom: 0.75rem;
    padding: 0.75rem;
    border-radius: var(--border-radius-sm);
    background-color: #e9ecef; /* Light background for individual steps */
    border-left: 4px solid var(--accent-color); /* Accent border for steps */
}
.steps-area p:last-child {
    margin-bottom: 0;
}
.steps-area .placeholder-text {
    color: var(--text-color-subtle);
    font-style: italic;
    background-color: transparent;
    border-left: none;
}

.navigation-buttons {
    display: flex;
    justify-content: space-between; 
    align-items: center;
    width: 100%;
    margin-bottom: 1rem;
}
#end-call-btn {
    width: 100%; /* Make end call button full width */
}


/* Footer Styles */
.app-footer {
    background-color: #343a40; 
    color: #adb5bd; 
    text-align: center;
    padding: 1rem;
    font-size: 0.875em;
}

/* Loading Container and Spinner */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: var(--text-color-light);
}
.spinner {
    border: 5px solid rgba(0, 0, 0, 0.1);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border-left-color: var(--primary-color);
    margin-bottom: 1rem;
    animation: spin 0.8s linear infinite;
}
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
