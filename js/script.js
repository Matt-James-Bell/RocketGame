let discount = 0.01;
const discountRate = 0.2; // Slower increase (0.2% per second)
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;

const rocketContainerHeight = 500; // Should match CSS #rocket-container height

// Start the game and reset state
function startGame() {
  discount = 0.01;
  crashed = false;
  gameActive = true;
  startTime = Date.now();
  updateDisplay();
  document.getElementById("status").textContent = "Game in progress... Press Cash Out anytime!";
  document.getElementById("cashout").disabled = false;
  document.getElementById("start").disabled = true;

  // Reset displays: show rocket wrapper and hide explosion
  document.getElementById("rocket-wrapper").style.display = "block";
  document.getElementById("explosion").style.display = "none";
  
  // Reset rocket position
  updateRocketPosition();

  // Set a random crash point between 20% and 80% discount
  crashPoint = Math.random() * (80 - 20) + 20;
  console.log("Crash point set at: " + crashPoint.toFixed(2) + "%");

  gameInterval = setInterval(updateGame, 50);
}

// Update game state
function updateGame() {
  if (!gameActive) return;
  
  let elapsed = (Date.now() - startTime) / 1000; // seconds elapsed
  discount = 0.01 + elapsed * discountRate;
  if (discount > 100) discount = 100;
  
  updateDisplay();
  updateRocketPosition();
  
  // Crash if discount reaches/exceeds crash point
  if (discount >= crashPoint) {
    crash();
  }
}

// Update the discount display
function updateDisplay() {
  document.getElementById("discount-display").textContent = discount.toFixed(2) + "% Discount";
}

// Update rocket position based on discount progress
function updateRocketPosition() {
  const rocketWrapper = document.getElementById("rocket-wrapper");
  if (rocketWrapper) {
    const containerHeight = rocketContainerHeight; // 500px
    const rocketHeight = 120; // Approximate height of the rocket-wrapper
    let newBottom = (discount / 100) * (containerHeight - rocketHeight);
    rocketWrapper.style.bottom = newBottom + "px";
  }
}

// Handle rocket crash
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);
  
  // Hide the rocket & its effects, show explosion animation
  document.getElementById("rocket-wrapper").style.display = "none";
  const explosionElem = document.getElementById("explosion");
  explosionElem.style.display = "block";
  explosionElem.classList.add("explode");
  
  document.getElementById("status").textContent = "Crashed! No discount awarded.";
  document.getElementById("cashout").disabled = true;
  document.getElementById("start").disabled = false;
  
  // Remove explosion effect after 2 seconds
  setTimeout(() => {
    explosionElem.style.display = "none";
    explosionElem.classList.remove("explode");
  }, 2000);
}

// Handle cashing out
function cashOut() {
  if (!gameActive || crashed) return;
  
  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("start").disabled = false;
  
  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
}

// Generate vertical ruler tick marks for left and right sides
function generateRulerTicks() {
  const leftRuler = document.getElementById("left-ruler");
  const rightRuler = document.getElementById("right-ruler");
  const containerHeight = rocketContainerHeight; // 500px
  
  // Clear any existing ticks
  leftRuler.innerHTML = "";
  rightRuler.innerHTML = "";
  
  // Create ticks at every 10%
  for (let perc = 0; perc <= 100; perc += 10) {
    const tickLeft = document.createElement("div");
    tickLeft.className = "ruler-tick";
    tickLeft.textContent = perc + "%";
    let pos = (perc / 100) * containerHeight;
    tickLeft.style.bottom = pos + "px";
    leftRuler.appendChild(tickLeft);
    
    const tickRight = document.createElement("div");
    tickRight.className = "ruler-tick";
    tickRight.textContent = perc + "%";
    tickRight.style.bottom = pos + "px";
    rightRuler.appendChild(tickRight);
  }
}

// Initialize rulers on page load
window.addEventListener("load", generateRulerTicks);

// Button event listeners
document.getElementById("start").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
