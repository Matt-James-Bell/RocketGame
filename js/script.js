// The dynamic discount value now starts at 0.01%
let discount = 0.01;
// Use a slower rate so that the early range lasts longer: 0.5% per second
const discountRate = 0.5;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Accumulated (locked-in) discount from cash outs
let accumulatedDiscount = 0;

/**
 * Mapping function that uses a piecewise linear transform to "stretch" the 0.01%-2.00% range.
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
 * Dynamic Bottom Scale:
 * Always shows tick marks for the full range [0.01, 100].
 * The tick labels are highlighted (enlarged) if they are closest to the current discount.
 */
function updateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = ""; // Clear existing tick marks.
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  
  // Define a set of tick values for the full range
  const tickValues = [0.01, 0.1, 0.5, 1, 2, 3, 5, 10, 20, 50, 100];
  
  // Compute current normalized discount using our mapping function
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
    // Highlight the label if it's within 0.05 of the current normalized discount
    if (Math.abs(tickNorm - currentNorm) < 0.05) {
      label.classList.add("highlight");
    }
    bottomScale.appendChild(label);
  });
}

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
  updateBottomScale();

  // Determine crash point using weighted probability:
  // 80% chance: uniformly between 1.00% and 3.00%
  // 20% chance: uniformly between 3.00% and 100.00%
  let r = Math.random();
  if (r < 0.8) {
    crashPoint = Math.random() * (3.00 - 1.00) + 1.00;
  } else {
    crashPoint = Math.random() * (100.00 - 3.00) + 3.00;
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
  updateBottomScale();
  
  // Crash if discount reaches or exceeds crash point
  if (discount >= crashPoint) {
    crash();
  }
}

// Update the real-time discount display (above the rocket)
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
  
  // Use our custom mapping function to get a normalized value [0,1]
  let normalized = mapDiscountToNormalized(discount);
  if (normalized < 0) normalized = 0;
  if (normalized > 1) normalized = 1;
  
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

// Handle Cash Out (and update accumulated discount)
function cashOut() {
  if (!gameActive || crashed) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;
  
  // Add the earned discount to the accumulated discount
  accumulatedDiscount += discount;
  updateAccumulatedDiscount();
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
}

// Update the accumulated discount display (renamed from "Balance")
function updateAccumulatedDiscount() {
  document.getElementById("discount-display").textContent = "Discount: " + accumulatedDiscount.toFixed(2) + "%";
}

// Regenerate bottom scale on window resize (using current discount)
window.addEventListener("resize", updateBottomScale);

// Initialize bottom scale on page load
window.addEventListener("load", updateBottomScale);

// Button event listeners
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
