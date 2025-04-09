// Handle sign up form submission
document.getElementById("signupForm").addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent page reload
    
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    // Get users from localStorage or initialize empty array
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if email already exists
    const emailExists = users.some(u => u.email === email);
    
    if (emailExists) {
        // Show error message and confirm delete
        document.getElementById("signupError").style.display = "block";
        document.getElementById("confirmDelete").style.display = "block";
        
        // Handle confirmation for deleting the previous account
        document.getElementById("confirmDelete").addEventListener("click", function() {
            // Remove the old user with the same email
            const newUsers = users.filter(u => u.email !== email);
            localStorage.setItem("users", JSON.stringify(newUsers));
            
            // Proceed with registration of the new user
            const newUser = {
                name,
                email,
                password,
                createdAt: new Date().toISOString()
            };
            
            // Add new user to the array
            newUsers.push(newUser);
            localStorage.setItem("users", JSON.stringify(newUsers));
            
            // Store the new user session
            sessionStorage.setItem("currentUser", JSON.stringify(newUser));
            
            // Redirect to login page
            window.location.href = "login.html";
        });
        return;
    }
    
    // Create new user
    const newUser = {
        name,
        email,
        password,
        createdAt: new Date().toISOString()
    };
    
    // Add to users array
    users.push(newUser);
    
    // Save to localStorage
    localStorage.setItem("users", JSON.stringify(users));
    
    // Store current user session
    sessionStorage.setItem("currentUser", JSON.stringify(newUser));
    
    // Redirect to login page
    window.location.href = "login.html";
});
