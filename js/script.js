// The dynamic discount starts at 0.01%
let discount = 0.01;
// Use a slower rate: 0.2% per second so the early range lasts much longer
const discountRate = 0.2;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Accumulated discount resets to 0 on crash
let accumulatedDiscount = 0;

/**
 * Global mapping function (piecewise linear) to "stretch" the early range:
 * For d <= 2.00: normalized = ((d - 0.01) / (2.00 - 0.01)) * 0.3.
 * For d > 2.00: normalized = 0.3 + ((d - 2.00) / (100.00 - 2.00)) * 0.7.
 * (Used for vertical positioning.)
 */
function mapDiscountToNormalized(d) {
  if (d <= 2.00) {
    return ((d - 0.01) / (2.00 - 0.01)) * 0.3;
  } else {
    return 0.3 + ((d - 2.00) / (100.00 - 2.00)) * 0.7;
  }
}

/**
 * Update the dynamic bottom tick scale.
 * This version displays only the tick marks for the current dynamic window:
 * - If discount < 2, the window is fixed at [0.01, 2.00].
 * - If discount >= 2, the window is set to [discount*0.8, discount*1.2], clamped to [2.00, 100.00].
 * Tick marks and labels are drawn linearly across the container width, and a red marker is placed at the current discount.
 */
function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = ""; // Clear existing content.
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
  
  // Draw tick marks for the current window.
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
    // Highlight the tick label closest to the current discount.
    if (Math.abs(value - discount) < (windowMax - windowMin) / (2 * tickCount)) {
      label.classList.add("highlight");
    }
    bottomScale.appendChild(label);
  }
  
  // Add a red marker for the current discount.
  let markerPos = ((discount - windowMin) / (windowMax - windowMin)) * containerWidth;
  const marker = document.createElement("div");
  marker.className = "tick-marker";
  marker.style.left = markerPos + "px";
  bottomScale.appendChild(marker);
}

/**
 * Start (Ignite) the game.
 * - Resets discount to 0.01%.
 * - Disables the ignite button during a run.
 * - Determines a crash point with weighted probabilities:
 *    • 10% chance: crash between 0.01% and 0.05%.
 *    • 80% chance: crash between 1.00% and 3.00%.
 *    • 10% chance: crash between 3.00% and 100.00%.
 * - Runs continuously (a new run starts automatically after 2 seconds).
 */
function startGame() {
  if (gameActive) return; // Prevent starting if a run is active.
  
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Game in progress... Press Cash Out anytime!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("ignite").disabled = true;
  
  // Show the rocket and hide explosion.
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  
  updateRocketPosition();
  updateBottomScale();
  
  // Determine crash point with weighted probability.
  let r = Math.random();
  if (r < 0.1) {
    crashPoint = Math.random() * (0.05 - 0.01) + 0.01; // 10%: [0.01, 0.05]
  } else if (r < 0.9) {
    crashPoint = Math.random() * (3.00 - 1.00) + 1.00;  // 80%: [1.00, 3.00]
  } else {
    crashPoint = Math.random() * (100.00 - 3.00) + 3.00;  // 10%: [3.00, 100.00]
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
  
  if (discount >= crashPoint) {
    crash();
  }
}

/**
 * Update the real-time discount display (above the rocket).
 */
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
}

/**
 * Update the rocket's position.
 * The rocket's vertical position uses the global mapping,
 * while its horizontal position is determined by the dynamic window (same as the tick bar).
 * This makes the rocket's center align perfectly with the tick marker.
 */
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  
  // Vertical (y-axis) using global mapping.
  let normalizedVert = mapDiscountToNormalized(discount);
  let newBottom = normalizedVert * (containerHeight - wrapperHeight);
  
  // Horizontal (x-axis) using dynamic window mapping:
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
  let normalizedHoriz = (discount - windowMin) / (windowMax - windowMin);
  let markerPos = normalizedHoriz * containerWidth;
  // Center the rocket so its center aligns with the marker.
  let newLeft = markerPos - wrapperWidth / 2;
  
  // Clamp horizontal position.
  newLeft = Math.max(0, Math.min(newLeft, containerWidth - wrapperWidth));
  
  rocketWrapper.style.left = newLeft + "px";
  rocketWrapper.style.bottom = newBottom + "px";
}

/**
 * Handle rocket crash.
 * - Stops the run and resets accumulated discount to 0.
 * - Displays an explosion.
 * - Automatically starts a new run after 2 seconds.
 */
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  
  accumulatedDiscount = 0;
  updateAccumulatedDiscount();
  
  const rocketWrapper = document.getElementById("rocket-wrapper");
  rocketWrapper.style.display = "none";
  const explosionElem = document.getElementById("explosion");
  explosionElem.style.left = rocketWrapper.style.left;
  explosionElem.style.bottom = rocketWrapper.style.bottom;
  explosionElem.style.display = "block";
  explosionElem.classList.add("explode");
  
  document.getElementById("status").textContent = "Crashed! You lost your total discount.";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  setTimeout(startGame, 2000);
}

/**
 * Handle Cash Out.
 * - Locks in the current discount (adds it to accumulatedDiscount).
 * - Continues the game automatically after 2 seconds.
 */
function cashOut() {
  if (!gameActive || crashed) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  accumulatedDiscount += discount;
  updateAccumulatedDiscount();
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
  
  setTimeout(startGame, 2000);
}

/**
 * Update the accumulated discount display.
 */
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

// Update bottom scale on window resize.
window.addEventListener("resize", updateBottomScale);
// Initialize bottom scale on page load.
window.addEventListener("load", updateBottomScale);

// Button event listeners.
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
