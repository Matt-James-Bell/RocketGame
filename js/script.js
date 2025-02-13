// The dynamic discount starts at 0.01%
let discount = 0.01;
// Use a slower rate: 0.2% per second so the early range lasts much longer
const discountRate = 0.2;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Accumulated discount (resets to 0 on crash)
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
 * Update the bottom tick scale.
 * The scale is dynamic—it shows only the tick marks for the current window:
 * - If discount < 2: window = [0.01, 2.00].
 * - If discount >= 2: window = [discount*0.8, discount*1.2] (clamped to [2.00, 100.00]).
 * Tick marks are drawn linearly across the container width.
 * The red marker is positioned at the rocket's center (it stays with the rocket).
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
 * Update the vertical ticker on the right side.
 * It uses the same dynamic window as the bottom scale.
 * Tick marks and labels are drawn linearly across the container height,
 * and the red marker is positioned at the rocket's center Y.
 * The vertical tick marks are made smaller.
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
 * - Until discount reaches 1%, the rocket moves normally (using dynamic window mapping).
 * - Once discount ≥ 1%, the rocket stops moving and remains fixed at the center.
 */
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  
  if (discount < 1.0) {
    // Before 1%, use dynamic mapping.
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
    let normalizedVert = mapDiscountToNormalized(discount);
    let newBottom = normalizedVert * (containerHeight - wrapperHeight);
    let normalizedHoriz = (discount - windowMin) / (windowMax - windowMin);
    let markerPos = normalizedHoriz * containerWidth;
    let newLeft = markerPos - wrapperWidth / 2;
    newLeft = Math.max(0, Math.min(newLeft, containerWidth - wrapperWidth));
    rocketWrapper.style.left = newLeft + "px";
    rocketWrapper.style.bottom = newBottom + "px";
  } else {
    // Once discount ≥ 1%, fix the rocket at the center.
    let centerX = (containerWidth - wrapperWidth) / 2;
    let centerY = (containerHeight - wrapperHeight) / 2;
    rocketWrapper.style.left = centerX + "px";
    rocketWrapper.style.bottom = centerY + "px";
  }
}

/**
 * Update the real-time discount display (above the rocket).
 */
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
}

/**
 * Start (Ignite) the game.
 * - Resets discount to 0.01%.
 * - Disables the ignite button during a run.
 * - Determines a crash point with weighted probabilities:
 *    • 10% chance: crash between 0.01% and 0.05%.
 *    • 80% chance: crash between 1.00% and 3.00%.
 *    • 10% chance: crash between 3.00% and 100.00%.
 * - Runs only when the player clicks Ignite.
 */
function startGame() {
  if (gameActive) return;
  
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Game in progress... Press Cash Out anytime!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("ignite").disabled = true;
  
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
 * Now, once the discount reaches 1%, the rocket stops moving (stays centered)
 * while the discount value continues to increase (and tick bars update).
 * Additionally, once Cash Out is hit, the final discount is displayed in green above the rocket.
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
 * - The run ends; the player must click Ignite for a new run.
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
}

/**
 * Handle Cash Out.
 * - Locks in the current discount (adds it to accumulatedDiscount).
 * - Displays the final discount above the rocket in green.
 * - The run ends; the player must click Ignite for a new run.
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
  
  // Change discount display color to green for cash out.
  document.getElementById("ship-discount").style.color = "green";
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
}

/**
 * Update the accumulated discount display.
 */
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

// Update tick scales on window resize.
window.addEventListener("resize", () => {
  updateBottomScale();
  updateVerticalTicker();
});
window.addEventListener("load", () => {
  updateBottomScale();
  updateVerticalTicker();
});

// Button event listeners.
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
