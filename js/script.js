// The dynamic discount starts at 0.01%
let discount = 0.01;
// Slow rate: 0.2% per second so the early range lasts much longer
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
 * Update the bottom tick scale (horizontal).
 * The scale is dynamic—it shows only the tick marks for the current window:
 * - For discount < 2: window = [0.01, 2.00].
 * - For discount >= 2: window = [discount*0.8, discount*1.2] (clamped to [2.00, 100.00]).
 * A red marker is placed at the current discount.
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
    if (Math.abs(value - discount) < (windowMax - windowMin) / (2 * tickCount)) {
      label.classList.add("highlight");
    }
    bottomScale.appendChild(label);
  }
  
  let markerPos = ((discount - windowMin) / (windowMax - windowMin)) * containerWidth;
  const marker = document.createElement("div");
  marker.className = "tick-marker";
  marker.style.left = markerPos + "px";
  bottomScale.appendChild(marker);
}

/**
 * Update the vertical ticker on the right side.
 * It uses the same dynamic window as the bottom scale, but maps the window linearly to the vertical height
 * (with windowMin at the bottom and windowMax at the top).
 * A horizontal red marker indicates the current discount.
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
    // For vertical ticker, 0 corresponds to bottom, 1 to top.
    let topPos = (1 - normalizedTick) * containerHeight;
    
    const tick = document.createElement("div");
    tick.className = "v-tick";
    tick.style.top = topPos + "px";
    verticalTicker.appendChild(tick);
    
    const label = document.createElement("div");
    label.className = "v-tick-label";
    label.textContent = value.toFixed(2) + "%";
    label.style.top = (topPos - 5) + "px";
    // Highlight label if it's near the current discount.
    if (Math.abs(value - discount) < (windowMax - windowMin) / (2 * tickCount)) {
      label.classList.add("highlight");
    }
    verticalTicker.appendChild(label);
  }
  
  let markerPos = (1 - ((discount - windowMin) / (windowMax - windowMin))) * containerHeight;
  const marker = document.createElement("div");
  marker.className = "v-tick-marker";
  marker.style.top = markerPos + "px";
  verticalTicker.appendChild(marker);
}

/**
 * Update the rocket's position.
 * The vertical position uses the global mapping.
 * The horizontal position uses the dynamic window mapping (so that the rocket's center aligns with the tick marker)
 * until it reaches the center of the container, at which point it remains fixed at the center.
 */
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  
  // Global mapping for vertical (y-axis).
  let normalizedVert = mapDiscountToNormalized(discount);
  let newBottom = normalizedVert * (containerHeight - wrapperHeight);
  
  // Dynamic mapping for horizontal (x-axis) based on current window.
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
  
  // If the computed horizontal position is at or beyond center, fix rocket at center.
  let centerX = (containerWidth - wrapperWidth) / 2;
  if (markerPos >= containerWidth / 2) {
    rocketWrapper.style.left = centerX + "px";
  } else {
    let newLeft = markerPos - wrapperWidth / 2;
    newLeft = Math.max(0, Math.min(newLeft, containerWidth - wrapperWidth));
    rocketWrapper.style.left = newLeft + "px";
  }
  
  // Vertical: if the global mapping exceeds 0.5 (center), fix rocket at center.
  if (normalizedVert >= 0.5) {
    let centerY = (containerHeight - wrapperHeight) / 2;
    rocketWrapper.style.bottom = centerY + "px";
  } else {
    rocketWrapper.style.bottom = newBottom + "px";
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
 * - Runs continuously (a new run starts automatically after 2 seconds).
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
