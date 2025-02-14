// The dynamic discount starts at 0.01%
let discount = 0.01;
// Linear growth rate: 0.2% per second for the early range
const discountRate = 0.2;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Total accumulated discount from cashed-out runs
let accumulatedDiscount = 0;
// Flag indicating if the player joined the current run
let playerJoined = false;
// Countdown interval variable
let countdownInterval;
let countdownTime = 5; // 5-second countdown

/**
 * Global mapping function for vertical positioning.
 * For discount <= 2: returns a value from 0 to 0.3.
 * For discount > 2: returns a value from 0.3 to 1.
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
  
  // Place red marker at rocket's center X.
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
 * Tick marks and labels are drawn along the container height.
 * The red marker is positioned using rocket-wrapper.offsetTop (its position relative to the container).
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
  
  // Use rocket-wrapper.offsetTop to set the red marker exactly at its center Y.
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const rocketCenterY = rocketWrapper.offsetTop + rocketWrapper.offsetHeight / 2;
  
  const marker = document.createElement("div");
  marker.className = "v-tick-marker";
  marker.style.top = rocketCenterY + "px";
  verticalTicker.appendChild(marker);
}

/**
 * Update the rocket's position.
 * Smoothly interpolate from the starting position to the center as discount goes from 0.01 to 1.
 * Once discount >= 1, the rocket stays fixed at the center.
 */
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  
  // Define the center position.
  let centerX = (containerWidth - wrapperWidth) / 2;
  let centerY = (containerHeight - wrapperHeight) / 2;
  
  if (discount < 1.0) {
    // Linear interpolation: t = 0 at discount 0.01, t = 1 at discount 1.
    let t = (discount - 0.01) / (1 - 0.01);
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
 * Update the real-time discount display and the current run discount display.
 */
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
  document.getElementById("current-discount").textContent = "Current: " + discount.toFixed(2) + "%";
}

/**
 * Start a new run. Called when the player clicks Ignite.
 * Uses the current value of a new run's variables.
 */
function startGame() {
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Run in progress... Hit Cash Out to lock in your discount!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("ignite").disabled = true;
  
  // Ensure the rocket and explosion elements are appropriately shown/hidden.
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
 * If the player had joined the run (by clicking Ignite), their total discount is reset.
 * Otherwise, if they did not join, their total discount remains unchanged.
 */
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  
  // Only reset total discount if the player had joined the run.
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
  
  // After 2 seconds, start a 5-second countdown for the next run.
  setTimeout(startCountdown, 2000);
}

/**
 * Handle Cash Out.
 * Only allowed if the player has joined the run.
 */
function cashOut() {
  if (!gameActive || crashed || !playerJoined) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  accumulatedDiscount += discount;
  updateAccumulatedDiscount();
  
  // Change the discount display above the rocket to green.
  document.getElementById("ship-discount").style.color = "green";
  
  // Instead of showing an alert, we simply update the status.
  document.getElementById("status").textContent += " Congratulations!";
  
  // After 2 seconds, start a new 5-second countdown.
  setTimeout(startCountdown, 2000);
}

/**
 * Update the Total Discount display.
 */
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Total Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

/**
 * Start a 5-second countdown. During this time, the player can click Ignite to join the run.
 * If they click Ignite, we set playerJoined to true and start the run immediately.
 * If the countdown expires without joining, the run auto-starts with playerJoined false.
 */
function startCountdown() {
  // Reset the playerJoined flag for the new run.
  playerJoined = false;
  
  const countdownDiv = document.getElementById("countdown");
  countdownDiv.style.display = "block";
  let count = 5;
  countdownDiv.textContent = count;
  
  // Enable the Ignite button during the countdown.
  document.getElementById("ignite").disabled = false;
  
  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownDiv.textContent = count;
    } else {
      clearInterval(countdownInterval);
      countdownDiv.style.display = "none";
      // Auto-start the run if the player hasn't joined.
      startRun();
    }
  }, 1000);
}

/**
 * Start the run. Called when the player clicks Ignite or the countdown expires.
 */
function startRun() {
  // If the player clicks Ignite, set playerJoined to true.
  // Otherwise, it remains false (i.e. the player sat out).
  // Then start the run.
  // Disable Ignite button.
  document.getElementById("ignite").disabled = true;
  startGame();
}

// On page load, start the countdown.
window.addEventListener("load", startCountdown);

// Button event listeners.
document.getElementById("ignite").addEventListener("click", () => {
  // Player chooses to join the run.
  playerJoined = true;
  clearInterval(countdownInterval);
  document.getElementById("countdown").style.display = "none";
  startRun();
});
document.getElementById("cashout").addEventListener("click", cashOut);
