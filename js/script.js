// The dynamic discount value now starts at 0.01%
let discount = 0.01;
// Use a slower rate: 0.2% per second so the early range lasts much longer
const discountRate = 0.2;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Accumulated (locked-in) discount from cash outs (which resets on crash)
let accumulatedDiscount = 0;

/**
 * Mapping function (piecewise linear) to "stretch" the 0.01%-2.00% range.
 * For discount <= 2.00: normalized = ((d - 0.01) / (2.00 - 0.01)) * 0.3.
 * For discount > 2.00: normalized = 0.3 + ((d - 2.00) / (100.00 - 2.00)) * 0.7.
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
 * The tick marks for fixed tick values (0.01, 0.1, 0.5, 1, 2, 3, 5, 10, 20, 50, 100)
 * are drawn using the same mapping function so that their positions align with the rocket.
 * The label closest to the current discount is highlighted.
 */
function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = ""; // Clear existing tick marks.
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  
  const tickValues = [0.01, 0.1, 0.5, 1, 2, 3, 5, 10, 20, 50, 100];
  const currentNorm = mapDiscountToNormalized(discount);
  
  tickValues.forEach(value => {
    const tickNorm = mapDiscountToNormalized(value);
    const leftPos = tickNorm * containerWidth;
    
    // Create tick mark
    const tick = document.createElement("div");
    tick.className = "tick";
    tick.style.left = leftPos + "px";
    bottomScale.appendChild(tick);
    
    // Create tick label
    const label = document.createElement("div");
    label.className = "tick-label";
    label.textContent = value.toFixed(2) + "%";
    label.style.left = (leftPos - 10) + "px";
    if (Math.abs(tickNorm - currentNorm) < 0.03) { // highlight if close to current discount
      label.classList.add("highlight");
    }
    bottomScale.appendChild(label);
  });
}

/**
 * Start (Ignite) the game.
 * – Resets discount to 0.01%
 * – Disables ignite button during a run
 * – Updates display and rocket position
 * – Determines a crash point using weighted probabilities:
 *    • 10% chance: crash point in [0.01, 0.05]
 *    • 80% chance: crash point in [1.00, 3.00]
 *    • 10% chance: crash point in [3.00, 100.00]
 * – Runs the game continuously.
 */
function startGame() {
  if (gameActive) return; // prevent igniting if already running
  
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Game in progress... Press Cash Out anytime!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("ignite").disabled = true;
  
  // Show rocket and hide explosion
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  
  // Reset rocket position and update tick bar
  updateRocketPosition();
  updateBottomScale();
  
  // Determine crash point with weighted probability:
  let r = Math.random();
  if (r < 0.1) {
    // 10% chance: crash between 0.01% and 0.05%
    crashPoint = Math.random() * (0.05 - 0.01) + 0.01;
  } else if (r < 0.9) {
    // 80% chance: crash between 1.00% and 3.00%
    crashPoint = Math.random() * (3.00 - 1.00) + 1.00;
  } else {
    // 10% chance: crash between 3.00% and 100.00%
    crashPoint = Math.random() * (100.00 - 3.00) + 3.00;
  }
  console.log("Crash point set at: " + crashPoint.toFixed(2) + "%");
  
  gameInterval = setInterval(updateGame, 50);
}

/**
 * Update game state on each interval tick.
 */
function updateGame() {
  if (!gameActive) return;
  
  let elapsed = (Date.now() - startTime) / 1000; // seconds elapsed
  discount = 0.01 + elapsed * discountRate;
  if (discount > 100) discount = 100;
  
  updateDisplay();
  updateRocketPosition();
  updateBottomScale();
  
  // Crash if discount reaches/exceeds the crash point
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
 * Update the rocket's position based on the custom mapping.
 * We now center the rocket wrapper so that its center aligns with the mapped value.
 */
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerHeight = container.offsetHeight;
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  const wrapperHeight = rocketWrapper.offsetHeight;
  
  // Get normalized value from our mapping function
  let normalized = mapDiscountToNormalized(discount);
  if (normalized < 0) normalized = 0;
  if (normalized > 1) normalized = 1;
  
  // Center the rocket's wrapper:
  let newLeft = normalized * containerWidth - wrapperWidth / 2;
  let newBottom = normalized * containerHeight - wrapperHeight / 2;
  
  // Clamp positions so that the rocket stays within the container:
  if (newLeft < 0) newLeft = 0;
  if (newLeft > containerWidth - wrapperWidth) newLeft = containerWidth - wrapperWidth;
  if (newBottom < 0) newBottom = 0;
  if (newBottom > containerHeight - wrapperHeight) newBottom = containerHeight - wrapperHeight;
  
  rocketWrapper.style.left = newLeft + "px";
  rocketWrapper.style.bottom = newBottom + "px";
}

/**
 * Handle rocket crash.
 * – Stops the game.
 * – Resets the accumulated discount to 0 (loss).
 * – Shows the explosion graphic.
 * – Automatically starts a new run after 2 seconds.
 */
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  
  // Lose total accumulated discount
  accumulatedDiscount = 0;
  updateAccumulatedDiscount();
  
  // Hide rocket and show explosion at same position
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
  
  // After 2 seconds, auto-start a new run
  setTimeout(startGame, 2000);
}

/**
 * Handle Cash Out.
 * – Locks in the current discount (adds it to accumulatedDiscount).
 * – Continues the game continuously.
 */
function cashOut() {
  if (!gameActive || crashed) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  // Add the current discount to the accumulated discount
  accumulatedDiscount += discount;
  updateAccumulatedDiscount();
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
  
  // Automatically start a new run after 2 seconds
  setTimeout(startGame, 2000);
}

/**
 * Update the accumulated discount display.
 */
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

// Ensure the bottom scale updates on window resize.
window.addEventListener("resize", updateBottomScale);
// Initialize bottom scale on page load.
window.addEventListener("load", updateBottomScale);

// Button event listeners
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
