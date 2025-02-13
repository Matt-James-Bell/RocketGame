// The dynamic discount value now starts at 0.01%
let discount = 0.01;
// We'll use a slower rate so that the early range lasts longer (1% per second)
const discountRate = 1.0;
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
// Accumulated (locked-in) discount from cash outs
let accumulatedDiscount = 0;

/**
 * Mapping function: maps a discount value (0.01% to 100%) to a normalized value [0,1]
 * using a piecewise linear function that stretches out the 0.01%-2.00% range.
 * For discount <= 2.00, normalized = (discount - 0.01) / (2 - 0.01) * 0.3.
 * For discount > 2.00, normalized = 0.3 + (discount - 2) / (100 - 2) * 0.7.
 */
function mapDiscountToNormalized(disc) {
  if (disc <= 2.00) {
    return ((disc - 0.01) / (2.00 - 0.01)) * 0.3;
  } else {
    return 0.3 + ((disc - 2.00) / (100.00 - 2.00)) * 0.7;
  }
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
  
  // Get normalized value using our custom mapping function
  let normalized = mapDiscountToNormalized(discount);
  
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

// Generate horizontal tick marks for the bottom scale using our custom mapping
// We'll use a custom set of tick values to "zoom" the lower range:
function generateBottomScale() {
  const bottomScale = document.getElementById("bottom-scale");
  bottomScale.innerHTML = ""; // Clear any existing marks
  const containerWidth = document.getElementById("rocket-container").offsetWidth;
  
  // Define tick values (in percent) to show a zoomed view of the lower range
  const tickValues = [0.01, 0.5, 1.0, 1.5, 2.0, 5.0, 10.0, 20.0, 50.0, 100.00];
  
  tickValues.forEach(value => {
    let normalizedTick = mapDiscountToNormalized(value);
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
  });
}

// Regenerate bottom scale on window resize
window.addEventListener("resize", generateBottomScale);

// Initialize bottom scale on page load
window.addEventListener("load", generateBottomScale);

// Button event listeners
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
