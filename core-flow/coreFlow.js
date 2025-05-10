let steps = [];
let currentStep = 0;

async function loadScenario() {
  try {
    const response = await fetch('../knowledge-base/kb.json');
    const data = await response.json();

    // You can switch the scenario key here
    steps = data["order_delay"].steps;
  } catch (error) {
    console.error("Error loading scenario:", error);
    steps = ["❌ Failed to load Knowledge Base."];
  }
}

document.getElementById("receiveCallBtn").addEventListener("click", async () => {
  await loadScenario();
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
