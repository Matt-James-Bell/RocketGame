let discount = 0.01;
const discountRate = 5.0; // 5% per second for visible movement
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

  // Reset rocket position (starts at bottom left)
  updateRocketPosition();

  // Determine crash point using weighted probability:
  // 5/6 chance: uniformly between 0.01% and 2.00%
  // 1/6 chance: uniformly between 2.00% and 100.00%
  let r = Math.random();
  if (r < 5/6) {
    crashPoint = Math.random() * (2.00 - 0.01) + 0.01;
  } else {
    crashPoint = Math.random() * (100.00 - 2.00) + 2.00;
  }
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
  
  // Crash if discount reaches or exceeds crash point
  if (discount >= crashPoint) {
    crash();
  }
}

// Update the real-time discount display above the rocket
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
}

// Update rocket position both vertically and horizontally based on discount progress
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const wrapperHeight = rocketWrapper.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  
  // Normalize discount so that 0.01% corresponds to 0 and 100% corresponds to 1
  let normalized = (discount - 0.01) / (100 - 0.01);
  if(normalized < 0) normalized = 0;
  if(normalized > 1) normalized = 1;
  
  // Vertical position: when normalized=0, bottom = 0; when normalized=1, bottom = containerHeight - wrapperHeight
  let newBottom = normalized * (containerHeight - wrapperHeight);
  rocketWrapper.style.bottom = newBottom + "px";
  
  // Horizontal position: when normalized=0, left = 0; when normalized=1, left = containerWidth - wrapperWidth
  let newLeft = normalized * (containerWidth - wrapperWidth);
  rocketWrapper.style.left = newLeft + "px";
}

// Handle rocket crash
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  
  // Hide the rocket and show explosion at the same position
  const rocketWrapper = document.getElementById("rocket-wrapper");
  rocketWrapper.style.display = "none";
  const explosionElem = document.getElementById("explosion");
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

// Generate horizontal tick marks for the bottom scale from 0.01% to 100.00%
function generateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = ""; // Clear any existing marks
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  
  const startValue = 0.01;
  const endValue = 100.00;
  const tickCount = 10; // We'll create 11 tick marks
  
  for (let i = 0; i <= tickCount; i++) {
    let value = startValue + ((endValue - startValue) / tickCount) * i;
    let normalizedTick = i / tickCount; // Goes from 0 to 1
    let leftPos = normalizedTick * containerWidth;
    
    let tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = leftPos + "px";
    bottomScale.appendChild(tick);
    
    let label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = value.toFixed(2) + "%";
    label.style.left = (leftPos - 10) + "px";
    bottomScale.appendChild(label);
  }
}

// Regenerate bottom scale on window resize
window.addEventListener("resize", generateBottomScale);

// Initialize bottom scale on page load
window.addEventListener("load", generateBottomScale);

// Button event listeners
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
