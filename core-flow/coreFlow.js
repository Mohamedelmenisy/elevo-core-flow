const steps = [
  "🔹 Ask the customer for their name.",
  "🔹 Ask the customer to describe the issue.",
  "🔹 Select the appropriate issue type from the options.",
  "🔹 Provide a solution or escalate if needed.",
  "✅ End the call and rate the outcome."
];

let currentStep = 0;

document.getElementById("receiveCallBtn").addEventListener("click", () => {
  document.getElementById("stepContainer").style.display = "block";
  document.getElementById("receiveCallBtn").style.display = "none";
  document.getElementById("stepText").textContent = steps[currentStep];
});

document.getElementById("nextStepBtn").addEventListener("click", () => {
  currentStep++;
  if (currentStep < steps.length) {
    document.getElementById("stepText").textContent = steps[currentStep];
  } else {
    document.getElementById("stepText").textContent = "📋 Call complete!";
    document.getElementById("nextStepBtn").style.display = "none";
  }
});
