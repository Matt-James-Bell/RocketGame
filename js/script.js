let multiplier = 1.00;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;

function startGame() {
  // Reset game state
  multiplier = 1.00;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  document.getElementById("multiplier").textContent = multiplier.toFixed(2) + "x";
  document.getElementById("status").textContent = "Game in progress... Press Cash Out anytime!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("start").disabled = true;

  // Reset rocket position
  const rocketElem = document.getElementById("rocket");
  if (rocketElem) {
    rocketElem.style.bottom = "0px";
  }

  // Set a random crash point between 3.0x and 10.0x
  crashPoint = Math.random() * (10 - 3) + 3;
  console.log("Crash point set at: " + crashPoint.toFixed(2) + "x");

  // Update the multiplier (and rocket position) every 50ms
  gameInterval = setInterval(updateGame, 50);
}

function updateGame() {
  if (!gameActive) return;
  
  // Increase multiplier: 0.5x per second increase
  let elapsed = (Date.now() - startTime) / 1000;
  multiplier = 1 + elapsed * 0.5;
  document.getElementById("multiplier").textContent = multiplier.toFixed(2) + "x";
  
  // Update rocket position: move upward as multiplier increases
  const rocketElem = document.getElementById("rocket");
  if (rocketElem) {
    // For every 1x increase (above 1), move rocket up by 50px.
    let newBottom = (multiplier - 1) * 50;
    
    // Clamp the rocket's position within the rocket container height.
    const containerHeight = 300; // Must match #rocket-container height in CSS
    const rocketHeight = 50;     // Must match #rocket width/height in CSS
    if(newBottom > containerHeight - rocketHeight) {
      newBottom = containerHeight - rocketHeight;
    }
    rocketElem.style.bottom = newBottom + "px";
  }
  
  // Crash if multiplier meets or exceeds the crash point
  if (multiplier >= crashPoint) {
    crash();
  }
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
  document.getElementById("status").textContent = "Cashed out at " + multiplier.toFixed(2) + "x!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("start").disabled = false;
  
  // Calculate discount percentage based on multiplier
  // For example: (multiplier - 1) * 10, capped at 100%
  let discount = (multiplier - 1) * 10;
  if (discount > 100) discount = 100;
  
  alert("Congratulations! You've earned a " + discount.toFixed(0) + "% discount!");
}

// Button event listeners
document.getElementById("start").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
