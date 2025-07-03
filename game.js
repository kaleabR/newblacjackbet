
const suits=["♠","♥","♦","♣"],ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const cardValue=r=>r==="A"?11:["K","Q","J"].includes(r)?10:parseInt(r);
let deck=[],balance=500,totalBet=0,placedChips=[];
let playerCards=[],dealerCards=[],dealerHiddenEl=null;
const sound = new Audio('sound.mp3');
function soundLoss() {
  sound.play();
}


function buildDeck() {
    // Create an empty deck array
    deck = [];
    // Loop through each suit (e.g., Hearts, Diamonds, Clubs, Spades)
    for (const s of suits) {
        // Loop through each rank (e.g., A, 2, 3, ..., J, Q, K)
        for (const r of ranks) {
            // Push a card object into the deck with rank, suit, and value
            deck.push({
                rank: r,
                suit: s,
                value: cardValue(r) // Use the cardValue function to get the numerical value
            });
        }
    }
    // Shuffle the completed deck
    shuffle(deck);
}


function shuffle(a) {
    // Loop from the end of the array to the beginning
    for (let i = a.length - 1; i > 0; i--) {
        // Pick a random index from 0 to i
        const j = Math.floor(Math.random() * (i + 1));

        // Swap elements at positions i and j
        [a[i], a[j]] = [a[j], a[i]];
    }
}

function buildDealerDeck() {
    // Get the dealer deck container from the DOM
    const d = document.getElementById('dealerDeck');

    // Clear any existing content
    d.innerHTML = '';

    // Create 52 card placeholders (for visual effect)
    for (let i = 0; i < 52; i++) {
        const c = document.createElement('div'); // Create card element
        c.className = 'dealer-card';             // Apply styling class
        c.style.zIndex = i;                      // Set stacking order
        d.appendChild(c);                        // Add to dealer deck container
    }
}

function placeBet(amount, cls) {
    // Check if the player has enough balance
    if (balance < amount) {
        alert('Not enough balance!');
        return;
    }

    // Deduct the bet from balance and add to total bet
    balance -= amount;
    totalBet += amount;
    updateUI(); // Refresh balance and bet display

    // Create the chip element for visual feedback
    const chip = document.createElement('div');
    chip.className = `placed-chip ${cls}`;
    chip.textContent = amount;

    // Position the chip randomly around the center
    chip.style.left = `calc(50% + ${Math.random() * 100 - 50}px)`;
    chip.style.top = `${Math.random() * 40 - 20 + 220}px`;

    // Add chip to document and track it
    document.body.appendChild(chip);
    placedChips.push({ el: chip, amount });

    // Show bet control buttons again
    showBetButtons();
    showChips();
}

function showBetButtons() {
    // Show the "Clear Bet" button
    document.getElementById('clearBet').style.display = 'block';

    // Show the "Bet" button
    document.getElementById('betBtn').style.display = 'block';
}

function hideBetButtons() {
    // Hide the "Clear Bet" button
    document.getElementById('clearBet').style.display = 'none';

    // Hide the "Bet" button
    document.getElementById('betBtn').style.display = 'none';
}

function showPlayButtons() {
    // Show the "Hit" button
    document.getElementById('hitBtn').style.display = 'block';

    // Show the "Stand" button
    document.getElementById('standBtn').style.display = 'block';
}

function hidePlayButtons() {
    // Hide the "Hit" button
    document.getElementById('hitBtn').style.display = 'none';

    // Hide the "Stand" button
    document.getElementById('standBtn').style.display = 'none';
}
function hideCips(){
  document.querySelectorAll('.chip').forEach(chip => {
  chip.style.pointerEvents = 'none';
  chip.style.opacity = '0.5';
});
}
function showChips(){
  document.querySelectorAll('.chip').forEach(chip => {
  chip.style.pointerEvents = 'auto'; 
  chip.style.opacity = '1';
});
}


function clearBet() {
    // Refund all placed bets and remove chip elements
    placedChips.forEach(({ el, amount }) => {
        el.remove();          // Remove chip from the screen
        balance += amount;    // Refund amount back to balance
        totalBet -= amount;   // Deduct from total bet
    });

    // Reset the placed chips array
    placedChips = [];

    // Update UI to reflect new balance and bet
    updateUI();

    // Hide bet and play buttons
    hideBetButtons();
    hidePlayButtons();

    // Clear any cards on the table
    clearHands();

    // Hide the player's score display
    document.getElementById('playerScore').style.display = 'none';
}

function deal() {
    // Prevent dealing if no bet was placed
    if (totalBet === 0) {
        return alert('Place a bet first!');
    }

    // If the deck has fewer than 6 cards left, rebuild it
    if (deck.length < 6) {
        buildDeck();
    }

    // Remove placed chips from the screen
    placedChips.forEach(({ el }) => el.remove());
    placedChips = [];

    // Hide betting buttons and clear the table
    hideBetButtons();
    clearHands();
    hideCips()

    // Deal two cards to the player and two to the dealer
    playerCards = [deck.pop(), deck.pop()];
    dealerCards = [deck.pop(), deck.pop()];

    // Show the cards on the table
    renderHands();

    // Update and display the player's score
    updatePlayerScore();

    // Show "Hit" and "Stand" buttons
    showPlayButtons();
}


async function hit() {
    // Deal one card to the player
    const newCard = deck.pop();
    playerCards.push(newCard);

    // Render the new card and update score
    renderHands();
    updatePlayerScore();

    const playerTotal = handValue(playerCards);

if (playerTotal > 21) {
  await delay(500); // Let the player see the card first
  alert('Bust!');   // 👈 Show alert first
  soundLoss()

  // Now move cards and reset the state
  moveAllTableCardsToTopRight();
  clearHands();
  showBetButtons();
  showChips();

  totalBet = 0;
  document.getElementById('playerScore').style.display = 'none';
  hidePlayButtons()
  updateUI();
}

}

async function stand() {
    // Reveal all dealer cards
    renderHands(true);
    hidePlayButtons();
    await delay(500);

    // Dealer keeps drawing until reaching at least 17
    while (handValue(dealerCards) < 17) {
        dealerCards.push(deck.pop());
        renderHands(true); // Always show dealer's hand face-up
        await delay(800);
    }

    const playerScore = handValue(playerCards);
    const dealerScore = handValue(dealerCards);
    let message = '';

    // Decide game result
    if (dealerScore > 21) {
        balance += totalBet * 2;
        message = 'Dealer busts! You win!';
    } else if (playerScore > dealerScore) {
        balance += totalBet * 2;
        message = 'You win!';
    } else if (playerScore < dealerScore) {
        message = 'Dealer wins!';
        soundLoss()
    } else {
        balance += totalBet; // Return the bet on tie
        message = 'Push. It\'s a tie!';
    }

    // Show result to the player
    alert(message);

    // Move cards to corner visually
    moveAllTableCardsToTopRight();

    // Reset state
    totalBet = 0;
    updateUI();
    document.getElementById('playerScore').style.display = 'none';
    showBetButtons();
    showChips();
}

function dealerPlay() {
    while (handValue(dealerCards) < 17) {
        dealerCards.push(deck.pop());
        renderHands(); // Update the visual state after each card
    }
}

function handValue(cards) {
    // Sum all card values (Aces are initially 11)
    let val = cards.reduce((sum, c) => sum + c.value, 0);

    // Count the number of Aces in the hand
    let aces = cards.filter(c => c.rank === 'A').length;

    // While total value is over 21 and there's an Ace counted as 11, reduce it to 1
    while (val > 21 && aces) {
        val -= 10;  // Convert one Ace from 11 to 1
        aces--;
    }

    return val;
}

function renderHands(revealDealer = false) {
  const pH = document.getElementById('playerHand'); // Player's card container
  const dH = document.getElementById('dealerHand'); // Dealer's card container

  // Clear current cards from both hands
  pH.innerHTML = '';
  dH.innerHTML = '';
  dealerHiddenEl = null; // Reset hidden card reference

  // Render player's cards face-up
  playerCards.forEach(c => {
    pH.appendChild(createCardEl(c, false));
  });

  // Render dealer's cards
  dealerCards.forEach((c, i) => {
    const faceDown = (i === 1 && !revealDealer); // Hide 2nd dealer card if not revealing
    dH.appendChild(createCardEl(c, faceDown));

    // Keep reference to the hidden dealer card
    if (faceDown) dealerHiddenEl = dH.lastChild;
  });
}

function createCardEl(card, faceDown) {
  const el = document.createElement('div');

  // Assign class for red suits
  el.className = 'playing-card' + ((card.suit === '♥' || card.suit === '♦') ? ' red' : '');

  if (faceDown) {
    // Card is face-down
    el.classList.add('back');
    el.innerHTML = ''; // No content shown
  } else {
    // Card is face-up: add rank and suit in stylized HTML
    el.innerHTML = `
      <span class='corner tl'>${card.rank}${card.suit}</span>
      <span>${card.rank}${card.suit}</span>
      <span class='corner br'>${card.rank}${card.suit}</span>
    `;
  }

  return el;
}

function revealDealerHidden() {
  if (dealerHiddenEl) {
    const idx = Array.from(dealerHiddenEl.parentNode.children).indexOf(dealerHiddenEl);

    // Replace the face-down card with its actual face-up version
    dealerHiddenEl.replaceWith(createCardEl(dealerCards[idx], false));

    // Clear the reference
    dealerHiddenEl = null;
  }
}

function updatePlayerScore() {
  const score = handValue(playerCards); // Calculate player's current hand value
  const badge = document.getElementById('playerScore'); // Find the score display element

  badge.textContent = `Player: ${score}`; // Update text
  badge.style.display = 'block';          // Make sure it’s visible
}

function clearHands() {
  // Clear the card arrays (logic memory)
  playerCards = [];
  dealerCards = [];

  // Clear the displayed cards from the HTML
  document.getElementById('playerHand').innerHTML = '';
  document.getElementById('dealerHand').innerHTML = '';
}

function updateUI() {
  document.getElementById('balance').textContent = `Balance: $${balance}`;
  document.getElementById('totalBet').textContent = `Total Bet: $${totalBet}`;
}

// Initialize game state
buildDeck();         // Build and shuffle the 52-card deck
buildDealerDeck();   // Create placeholder cards for the dealer’s deck (UI only)
updateUI();          // Show starting balance and bet values

function handleBust() {
  // Reset the bet and update balance
  totalBet = 0;
  updateUI();

  // Hide game buttons and score
  hidePlayButtons();
  document.getElementById('playerScore').style.display = 'none';

  // Remove any existing discard piles
  document.querySelectorAll('.discard-pile').forEach(p => p.remove());

  // Create a new discard pile container
  const discardPile = document.createElement('div');
  discardPile.className = 'discard-pile';

  // Add all player cards face-down into the discard pile
  playerCards.forEach((card, i) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'playing-card back';
    cardEl.style.zIndex = i;
    discardPile.appendChild(cardEl);
  });

  // Add discard pile to the page
  document.body.appendChild(discardPile);

  // Clear table and allow betting again
  clearHands();
  showBetButtons();
  showChips();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function moveAllTableCardsToTopRight() {
  const playerHand = document.getElementById('playerHand');
  const dealerHand = document.getElementById('dealerHand');

  // Get all cards from both hands
  const cards = [...playerHand.children, ...dealerHand.children];

  cards.forEach((card, i) => {
    // Apply styling for movement and stacking
    card.style.position = 'absolute';
    card.style.top = `${20 + i * 2}px`;
    card.style.right = `${20 + i * 2}px`;
    card.style.transform = 'rotateY(180deg)';
    card.style.zIndex = 1000 + i;
    card.style.transition = 'all 0.5s ease';

    // Move the card from the hand area to the main document
    document.body.appendChild(card);
  });

  // Clear card arrays (logical game state)
  playerCards = [];
  dealerCards = [];
}

function moveCardsToDealerPile(cards) {
  const dealerDeck = document.getElementById('dealerDeck');

  cards.forEach((card, index) => {
    const el = createCardEl(card, true); // face-down card element
    el.style.position = 'absolute';
    el.style.top = '20px';
    el.style.left = '20px';
    el.style.zIndex = index;
    document.body.appendChild(el);
  });
}

