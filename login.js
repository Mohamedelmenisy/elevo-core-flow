// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent page reload
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if the credentials are correct
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        alert(`Logged in successfully with email: ${email}`);
        sessionStorage.setItem("currentUser", JSON.stringify(user)); // Store user in sessionStorage
        window.location.href = "index.html";  // Redirect to homepage or dashboard
    } else {
        alert("Invalid email or password");
    }
});

// Function for logging out
function logout() {
    alert("Logged out successfully");
    sessionStorage.removeItem("currentUser");  // Clear session storage
    window.location.href = "login.html";  // Redirect to login page
}
