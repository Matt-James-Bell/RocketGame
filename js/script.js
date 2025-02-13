// The dynamic discount starts at 0.01%
let discount = 0.01;
// Use a slower rate: 0.2% per second so the early range lasts much longer
const discountRate = 0.2;
let gameInterval;
let gameActive = true;  // Game runs continuously on page load.
let crashed = false;
let crashPoint;
let startTime;
// Accumulated discount (winnings from cashed-out runs)
let accumulatedDiscount = 0;

/**
 * Global mapping function (piecewise linear) to "stretch" the early range.
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
 * Update the bottom tick scale (horizontal).
 * The scale shows tick marks for the current dynamic window:
 * - If discount < 2: window = [0.01, 2.00].
 * - If discount >= 2: window = [discount*0.8, discount*1.2] (clamped to [2.00, 100.00]).
 * The red marker remains at the rocket's center.
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
 * Uses the same dynamic window as the bottom scale.
 * Draws tick marks and labels along the container height,
 * and positions a red marker at the rocket's center Y.
 */
function updateVerticalTicker() {
  const verticalTicker = document.getElementById("vertical-ticker");
  verticalTicker.innerHTML = "";
  const containerHeight = document.getElementById("rocket-container").offsetHeight;
  
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
  
  // Place the red marker at the rocket's center Y.
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const container = document.getElementById("rocket-container");
  const rocketRect = rocketWrapper.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const rocketCenterY = rocketRect.top - containerRect.top + rocketRect.height / 2;
  
  const marker = document.createElement("div");
  marker.className = "v-tick-marker";
  marker.style.top = rocketCenterY + "px";
  verticalTicker.appendChild(marker);
}

/**
 * Update the rocket's position.
 * - Before discount reaches 1%, the rocket moves using dynamic window mapping.
 * - Once discount ≥ 1%, the rocket remains fixed at the center.
 */
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  
  if (discount < 1.0) {
    // Dynamic movement before 1%
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
    // Vertical position using global mapping.
    let normalizedVert = mapDiscountToNormalized(discount);
    let newBottom = normalizedVert * (containerHeight - wrapperHeight);
    // Horizontal position using dynamic window mapping.
    let normalizedHoriz = (discount - windowMin) / (windowMax - windowMin);
    let markerPos = normalizedHoriz * containerWidth;
    let newLeft = markerPos - wrapperWidth / 2;
    newLeft = Math.max(0, Math.min(newLeft, containerWidth - wrapperWidth));
    rocketWrapper.style.left = newLeft + "px";
    rocketWrapper.style.bottom = newBottom + "px";
  } else {
    // Once discount >= 1%, fix the rocket at the center.
    let centerX = (containerWidth - wrapperWidth) / 2;
    let centerY = (containerHeight - wrapperHeight) / 2;
    rocketWrapper.style.left = centerX + "px";
    rocketWrapper.style.bottom = centerY + "px";
  }
}

/**
 * Update the real-time discount display (above the rocket).
 * Also update the "Current Run" box on the top right.
 */
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
  document.getElementById("current-run").textContent = "Current Run: " + discount.toFixed(2) + "%";
}

/**
 * Start (or restart) the game.
 * The game now runs continuously (auto-start on page load and after each run).
 * The player can click "Cash Out" to lock in the run's discount.
 */
function startGame() {
  // Continuous run: always start a new run.
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  
  // Enable cash out button.
  document.getElementById("cashout").disabled = false;
  
  // Show rocket and hide explosion.
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  
  updateRocketPosition();
  updateBottomScale();
  updateVerticalTicker();
  
  // Determine crash point with weighted probability.
  let r = Math.random();
  if (r < 0.1) {
    crashPoint = Math.random() * (0.05 - 0.01) + 0.01;   // 10%: [0.01, 0.05]
  } else if (r < 0.9) {
    crashPoint = Math.random() * (3.00 - 1.00) + 1.00;    // 80%: [1.00, 3.00]
  } else {
    crashPoint = Math.random() * (100.00 - 3.00) + 3.00;   // 10%: [3.00, 100.00]
  }
  console.log("Crash point set at: " + crashPoint.toFixed(2) + "%");
  
  gameInterval = setInterval(updateGame, 50);
}

/**
 * Update game state on each tick.
 * The discount increases continuously.
 * Once the discount reaches 1%, the rocket remains fixed at the center.
 * Tick bars update dynamically.
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
 * - Stops the run.
 * - Resets accumulated discount to 0.
 * - Displays an explosion.
 * - The run ends; a new run auto-starts after 2 seconds.
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
  
  setTimeout(startGame, 2000);
}

/**
 * Handle Cash Out.
 * - Locks in the current discount (adds it to accumulatedDiscount).
 * - Displays the final discount above the rocket in green.
 * - The run ends; a new run auto-starts after 2 seconds.
 */
function cashOut() {
  if (!gameActive || crashed) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  
  accumulatedDiscount += discount;
  updateAccumulatedDiscount();
  
  // Display cash-out result in green above the rocket.
  document.getElementById("ship-discount").style.color = "green";
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
  
  setTimeout(startGame, 2000);
}

/**
 * Update the accumulated discount display.
 */
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Total Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

// Ensure tick scales update on window resize.
window.addEventListener("resize", () => {
  updateBottomScale();
  updateVerticalTicker();
});
window.addEventListener("load", () => {
  // Auto-start the game on page load.
  startGame();
});

// Button event listener for Cash Out.
document.getElementById("cashout").addEventListener("click", cashOut);
