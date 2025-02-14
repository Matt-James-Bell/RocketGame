// The dynamic discount starts at 0.01%
let discount = 0.01;
// Use a linear growth rate: 0.2% per second for the early range
const discountRate = 0.2;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Accumulated discount (winnings from previous runs)
let accumulatedDiscount = 0;

/**
 * Global mapping function (piecewise linear) to "stretch" the early range.
 * For d <= 2.00: normalized = ((d - 0.01) / (2.00 - 0.01)) * 0.3.
 * For d > 2.00: normalized = 0.3 + ((d - 2.00) / (100.00 - 2.00)) * 0.7.
 * This is used for vertical positioning.
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
 * It displays tick marks for the current dynamic window:
 * - If discount < 2: window = [0.01, 2.00].
 * - If discount >= 2: window = [discount * 0.8, discount * 1.2] (clamped to [2.00, 100.00]).
 * Tick labels move dynamically; the red marker is positioned at the rocket's center.
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
 * It uses the same dynamic window as the bottom tick bar.
 * Tick marks and labels are drawn along the container height.
 * The red marker is positioned based on the rocket's position relative to the container.
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
  
  // Calculate the rocket's top position based on the container's coordinate.
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const wrapperHeight = rocketWrapper.offsetHeight;
  const containerHeightValue = container.offsetHeight;
  // Since rocket-wrapper is positioned using the 'bottom' style,
  // its top coordinate = containerHeight - (parseFloat(bottom) + wrapperHeight)
  let bottomVal = parseFloat(rocketWrapper.style.bottom) || 0;
  let rocketTop = containerHeightValue - bottomVal - wrapperHeight;
  let rocketCenterY = rocketTop + (wrapperHeight / 2);
  
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
    let centerX = (containerWidth - wrapperWidth) / 2;
    let centerY = (containerHeight - wrapperHeight) / 2;
    rocketWrapper.style.left = centerX + "px";
    rocketWrapper.style.bottom = centerY + "px";
  }
}

/**
 * Update the real-time discount display (above the rocket)
 * and the current run discount display (bottom right).
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
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Run in progress... Hit Cash Out to lock in your discount!";
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
  
  // Change discount display above the rocket to green.
  document.getElementById("ship-discount").style.color = "green";
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
  
  setTimeout(startGame, 2000);
}

/**
 * Update the Total Discount display.
 */
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Total Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

// Button event listeners.
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
