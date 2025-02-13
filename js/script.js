let discount = 0.01;
const discountRate = 0.2; // Increase of 0.2% per second
let gameInterval;
let gameActive = false;
let crashed = false;
let crashPoint;
let startTime;
let balance = 0; // Accumulated discount balance

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

  // Reset rocket position (start at left)
  updateRocketPosition();

  // Set a random crash point between 20% and 80% discount
  crashPoint = Math.random() * (80 - 20) + 20;
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

// Update the discount display under the ship
function updateDisplay() {
  document.getElementById("ship-discount").textContent = discount.toFixed(2) + "% Discount";
}

// Update rocket (ship) position based on discount progress (horizontal movement)
function updateRocketPosition() {
  const container = document.getElementById("rocket-container");
  const rocketWrapper = document.getElementById("rocket-wrapper");
  const containerWidth = container.offsetWidth;
  const wrapperWidth = rocketWrapper.offsetWidth;
  let newLeft = (discount / 100) * (containerWidth - wrapperWidth);
  rocketWrapper.style.left = newLeft + "px";
}

// Handle rocket crash
function crash() {
  gameActive = false;
  crashed = true;
  clearInterval(gameInterval);

  // Hide the rocket & its effects; show explosion at the same position
  const rocketWrapper = document.getElementById("rocket-wrapper");
  rocketWrapper.style.display = "none";
  const explosionElem = document.getElementById("explosion");
  // Position explosion at the same left/top as the rocket-wrapper
  explosionElem.style.left = rocketWrapper.style.left;
  explosionElem.style.top = rocketWrapper.style.top;
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

// Handle Cash Out (and update balance)
function cashOut() {
  if (!gameActive || crashed) return;

  gameActive = false;
  clearInterval(gameInterval);
  updateDisplay();
  document.getElementById("status").textContent = "Cashed out at " + discount.toFixed(2) + "% discount!";
  document.getElementById("cashout").disabled = true;
  document.getElementById("ignite").disabled = false;

  // Add the earned discount to the accumulated balance
  balance += discount;
  updateBalance();

  alert("Congratulations! You've earned a " + discount.toFixed(2) + "% discount!");
}

// Update the balance display
function updateBalance() {
  document.getElementById("balance-display").textContent = "Balance: " + balance.toFixed(2) + "%";
}

// Button event listeners
document.getElementById("ignite").addEventListener("click", startGame);
document.getElementById("cashout").addEventListener("click", cashOut);
