// The dynamic discount starts at 0.01%
let discount = 0.01;
// Linear growth rate: 0.2% per second for the early range
const discountRate = 0.2;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Total accumulated discount (winnings from cashed-out runs)
let accumulatedDiscount = 0;
// Flag indicating if the player joined the current run (clicked Ignite)
let playerJoined = false;
// Countdown variables
let countdownInterval;
let firstRun = true; // First run: 10 seconds countdown; subsequent: 5 seconds

/**
 * Global mapping function for vertical positioning.
 * For discount <= 2.00: returns a value from 0 to 0.3;
 * for discount > 2.00: returns a value from 0.3 to 1.
 */
function mapDiscountToNormalized(d) {
  if (d <= 2.00) {
    return ((d - 0.01) / (2.00 - 0.01)) * 0.3;
  } else {
    return 0.3 + ((d - 2.00) / (100.00 - 2.00)) * 0.7;
  }
}

/**
 * Update the bottom tick scale (horizontal).
 */
function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = "";
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  
  let windowMin, windowMax;
  if (discount < 2.00) {
    windowMin = 0.01;
    windowMax = 2.00;
  } else {
    windowMin = discount * 0.8;
    windowMax = discount * 1.2;
    if (windowMin < 2.00) windowMin = 2.00;
    if (windowMax > 100.00) windowMax = 100.00;
  }
  
  const tickCount = 6;
  for (let i = 0; i <= tickCount; i++) {
    let value = windowMin + ((windowMax - windowMin) / tickCount) * i;
    let normalizedTick = (value - windowMin) / (windowMax - windowMin);
    let leftPos = normalizedTick * containerWidth;
    
    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = leftPos + "px";
    bottomScale.appendChild(tick);
    
    const label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = value.toFixed(2) + "%";
    label.style.left = (leftPos - 10) + "px";
    bottomScale.appendChild(label);
  }
  
  // Place the red marker at the rocket's center X.
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const container = document.getElementById("rocket-container");
  const rocketRect = rocketWrapper.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const rocketCenterX = rocketRect.left - containerRect.left + rocketRect.width / 2;
  
  const marker = document.createElement("div");
  marker.className = "tick-marker";
  marker.style.left = rocketCenterX + "px";
  bottomScale.appendChild(marker);
}

/**
 * Update the vertical ticker (right side).
 */
function updateVerticalTicker() {
  const verticalTicker = document.getElementById("vertical-ticker");
  verticalTicker.innerHTML = "";
  const container = document.getElementById("rocket-container");
  const containerHeight = container.offsetHeight;
  
  let windowMin, windowMax;
  if (discount < 2.00) {
    windowMin = 0.01;
    windowMax = 2.00;
  } else {
    windowMin = discount * 0.8;
    windowMax = discount * 1.2;
    if (windowMin < 2.00) windowMin = 2.00;
    if (windowMax > 100.00) windowMax = 100.00;
  }
  
  const tickCount = 6;
  for (let i = 0; i <= tickCount; i++) {
    let value = windowMin + ((windowMax - windowMin) / tickCount) * i;
    let normalizedTick = (value - windowMin) / (windowMax - windowMin);
    let topPos = (1 - normalizedTick) * containerHeight;
    
    const tick = document.createElement("div");
    tick.className = "v-tick";
    tick.style.top = topPos + "px";
    verticalTicker.appendChild(tick);
    
    const label = document.createElement("div");
    label.className = "v-tick-label";
    label.textContent = value.toFixed(2) + "%";
    label.style.top = (topPos - 5) + "px";
    verticalTicker.appendChild(label);
  }
  
  // Use rocket-wrapper.offsetTop to position the red marker at its center Y.
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const rocketCenterY = rocketWrapper.offsetTop + rocketWrapper.offsetHeight / 2;
  
  const marker = document.createElement("div");
  marker.className = "v-tick-marker";
  marker.style.top = rocketCenterY + "px";
  verticalTicker.appendChild(marker);
}

/**
 * Update the rocket's position.
 * Smoothly interpolate from starting position (assumed bottom-left) to the center as discount goes from 0.01 to 1.
 * Once discount >= 1, the rocket remains fixed at the center.
 */
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  
  // Define center coordinates.
  let centerX = (containerWidth - wrapperWidth) / 2;
  let centerY = (containerHeight - wrapperHeight) / 2;
  
  if (discount < 1.0) {
    let t = (discount - 0.01) / (1 - 0.01); // t from 0 to 1
    let newLeft = (1 - t) * 0 + t * centerX;
    let newBottom = (1 - t) * 0 + t * centerY;
    rocketWrapper.style.left = newLeft + "px";
    rocketWrapper.style.bottom = newBottom + "px";
  } else {
    rocketWrapper.style.left = centerX + "px";
    rocketWrapper.style.bottom = centerY + "px";
  }
}

/**
 * Update the real-time discount display (above the rocket) and the current run discount display.
 */
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
  document.getElementById("current-discount").textContent = "Current: " + discount.toFixed(2) + "%";
}

/**
 * Start a new run when the player clicks Ignite.
 */
function startGame() {
  discount = 0.01;
  crashed = false;
  gameActive = true;
  playerJoined = true; // Player clicked Ignite
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Run in progress... Hit Cash Out to lock in your discount!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("ignite").disabled = true;
  
  // Show rocket, hide explosion.
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  
  updateRocketPosition();
  updateBottomScale();
  updateVerticalTicker();
  
  let r = Math.random();
  if (r < 0.1) {
    crashPoint = Math.random() * (0.05 - 0.01) + 0.01;
  } else if (r < 0.9) {
    crashPoint = Math.random() * (3.00 - 1.00) + 1.00;
  } else {
    crashPoint = Math.random() * (100.00 - 3.00) + 3.00;
  }
  console.log("Crash point set at: " + crashPoint.toFixed(2) + "%");
  
  gameInterval = setInterval(updateGame, 50);
}

/**
 * Update game state on each tick.
 */
function updateGame() {
  if (!gameActive) return;
  
  let elapsed = (Date.now() - startTime) / 1000;
  discount = 0.01 + elapsed * discountRate;
  if (discount > 100) discount = 100;
  
  updateDisplay();
  updateRocketPosition();
  updateBottomScale();
  updateVerticalTicker();
  
  if (discount >= crashPoint) {
    crash();
  }
}

/**
 * Handle rocket crash.
 * If the player joined the run, reset total discount; if not, preserve total.
 */
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  
  // Reset total discount only if the player joined this run.
  if (playerJoined) {
    accumulatedDiscount = 0;
    updateAccumulatedDiscount();
  }
  
  const rocketWrapper = document.getElementById("rocket-wrapper");
  rocketWrapper.style.display = "none";
  
  const explosionElem = document.getElementById("explosion");
  explosionElem.style.left = rocketWrapper.style.left;
  explosionElem.style.bottom = rocketWrapper.style.bottom;
  explosionElem.style.display = "block";
  explosionElem.classList.add("explode");
  
  document.getElementById("status").textContent = "Run crashed!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  // After 2 seconds, start a new countdown.
  setTimeout(startCountdown, 2000);
}

/**
 * Handle Cash Out.
 */
function cashOut() {
  if (!gameActive || crashed || !playerJoined) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = true;
  
  accumulatedDiscount += discount;
  updateAccumulatedDiscount();
  
  // Change discount display above the rocket to green.
  document.getElementById("ship-discount").style.color = "green";
  
  // Update status message (no popup).
  document.getElementById("status").textContent += " Congratulations!";
  
  setTimeout(startCountdown, 2000);
}

/**
 * Update the Total Discount display.
 */
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Total Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

/**
 * Start a countdown for the next run.
 * For the first run, count from 10 seconds; thereafter, from 5 seconds.
 * During the countdown, the player may click Ignite to join.
 */
function startCountdown() {
  // Reset playerJoined flag.
  playerJoined = false;
  
  const countdownDiv = document.getElementById("countdown");
  let duration = firstRun ? 10 : 5;
  countdownDiv.style.display = "block";
  countdownDiv.textContent = duration;
  
  // Enable Ignite button during countdown.
  document.getElementById("ignite").disabled = false;
  
  countdownInterval = setInterval(() => {
    duration--;
    if (duration > 0) {
      countdownDiv.textContent = duration;
    } else {
      clearInterval(countdownInterval);
      countdownDiv.style.display = "none";
      // Auto-start the run if the player hasn't clicked Ignite.
      if (!gameActive) {
        // If player didn't join, playerJoined remains false.
        startRun();
      }
    }
  }, 1000);
  
  firstRun = false;
}

/**
 * Start the run (called when Ignite is clicked or countdown expires).
 */
function startRun() {
  document.getElementById("ignite").disabled = true;
  startGame();
}

// On page load, start the countdown.
window.addEventListener("load", startCountdown);

// Button event listeners.
document.getElementById("ignite").addEventListener("click", () => {
  clearInterval(countdownInterval);
  document.getElementById("countdown").style.display = "none";
  playerJoined = true;
  startRun();
});
document.getElementById("cashout").addEventListener("click", cashOut);
