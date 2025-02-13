let discount = 0.01;
const discountRate = 0.2; // Increase of 0.2% per second
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
let balance = 0; // Accumulated discount balance

// Start (Ignite) the game and reset state
function startGame() {
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Game in progress... Press Cash Out anytime!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("ignite").disabled = true;

  // Reset displays: show rocket-wrapper and hide explosion
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";

  // Reset rocket position (start at bottom center)
  updateRocketPosition();

  // Set a random crash point between 20% and 80%
  crashPoint = Math.random() * (80 - 20) + 20;
  console.log("Crash point set at: " + crashPoint.toFixed(2) + "%");

  gameInterval = setInterval(updateGame, 50);
}

// Update game state on interval
function updateGame() {
  if (!gameActive) return;
  
  let elapsed = (Date.now() - startTime) / 1000; // seconds elapsed
  discount = 0.01 + elapsed * discountRate;
  if (discount > 100) discount = 100;
  
  updateDisplay();
  updateRocketPosition();
  
  // Crash if discount reaches/exceeds crash point
  if (discount >= crashPoint) {
    crash();
  }
}

// Update the real-time discount display (under the rocket)
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
}

// Update rocket (ship) vertical position based on discount progress
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const wrapperHeight = rocketWrapper.offsetHeight;
  // The rocket moves upward: when discount is 0, bottom = 0; when discount is 100, bottom = containerHeight - wrapperHeight
  let newBottom = (discount / 100) * (containerHeight - wrapperHeight);
  rocketWrapper.style.bottom = newBottom + "px";
}

// Handle rocket crash
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  
  // Hide the rocket & its effects; show explosion at the same position
  const rocketWrapper = document.getElementById("rocket-wrapper");
  rocketWrapper.style.display = "none";
  const explosionElem = document.getElementById("explosion");
  // Position explosion at the same horizontal center and bottom position as the rocket-wrapper
  explosionElem.style.left = rocketWrapper.style.left;
  explosionElem.style.bottom = rocketWrapper.style.bottom;
  explosionElem.style.display = "block";
  explosionElem.classList.add("explode");
  
  document.getElementById("status").textContent = "Crashed! No discount awarded.";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  // Remove explosion effect after 2 seconds
  setTimeout(() => {
    explosionElem.style.display = "none";
    explosionElem.classList.remove("explode");
  }, 2000);
}

// Handle Cash Out (and update balance)
function cashOut() {
  if (!gameActive || crashed) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  // Add the earned discount to the accumulated balance
  balance += discount;
  updateBalance();
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
}

// Update the balance display
function updateBalance() {
  document.getElementById("balance-display").textContent = "Balance: " + balance.toFixed(2) + "%";
}

// Generate horizontal tick marks for the bottom scale (0% to 100%)
function generateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = ""; // clear any existing marks
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  
  // Create ticks at every 10%
  for (let perc = 0; perc <= 100; perc += 10) {
    let tick = document.createElement("div");
    tick.className = "tick";
    // Calculate left position: (perc/100) * containerWidth
    let leftPos = (perc / 100) * containerWidth;
    tick.style.left = leftPos + "px";
    bottomScale.appendChild(tick);
    
    // Create a label for the tick
    let label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = perc + "%";
    label.style.left = (leftPos - 10) + "px";
    bottomScale.appendChild(label);
  }
}

// Re-generate bottom scale when the window is resized
window.addEventListener("resize", generateBottomScale);

// Initialize bottom scale on page load
window.addEventListener("load", generateBottomScale);

// Button event listeners
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
