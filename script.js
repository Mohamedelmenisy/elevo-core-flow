// script.js

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", function(event) {
  event.preventDefault();  // Prevent page reload
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  // Here, you would add logic to check login credentials (e.g., Firebase, API)
  alert(`Logged in with email: ${email}`);
});

// Function for logging out
function logout() {
  alert("Logged out successfully");
}
