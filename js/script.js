let discount = 0.01;
const discountRate = 1.5; // Percentage increase per second (adjust for speed)
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;

function startGame() {
  // Reset game state
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Game in progress... Press Cash Out anytime!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("start").disabled = true;

  // Reset rocket position to the bottom
  const rocketElem = document.getElementById("rocket");
  if (rocketElem) {
    rocketElem.style.bottom = "0px";
  }

  // Set a random crash point between 20% and 80% discount
  crashPoint = Math.random() * (80 - 20) + 20;
  console.log("Crash point set at: " + crashPoint.toFixed(2) + "%");

  // Update discount and rocket position every 50ms
  gameInterval = setInterval(updateGame, 50);
}

function updateGame() {
  if (!gameActive) return;
  
  // Increase discount over time
  let elapsed = (Date.now() - startTime) / 1000; // seconds elapsed
  discount = 0.01 + elapsed * discountRate;
  if (discount > 100) discount = 100;
  
  updateDisplay();
  
  // Update rocket position based on discount progress
  const rocketElem = document.getElementById("rocket");
  if (rocketElem) {
    const containerHeight = 300; // Must match #rocket-container height in CSS
    const rocketHeight = 50;     // Must match #rocket size in CSS
    // Calculate bottom offset so that 100% discount places the rocket at the top
    let newBottom = (discount / 100) * (containerHeight - rocketHeight);
    rocketElem.style.bottom = newBottom + "px";
  }
  
  // Crash if discount reaches or exceeds the crash point
  if (discount >= crashPoint) {
    crash();
  }
}

function updateDisplay() {
  // Display discount with two decimals
  document.getElementById("discount-display").textContent = discount.toFixed(2) + "% Discount";
}

function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  document.getElementById("status").textContent = "Crashed! No discount awarded.";
  document.getElementById("cashout").disabled = true;
  document.getElementById("start").disabled = false;
}

function cashOut() {
  if (!gameActive || crashed) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("start").disabled = false;
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
}

// Button event listeners
document.getElementById("start").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
