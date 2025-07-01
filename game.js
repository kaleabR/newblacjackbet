const suits=["♠","♥","♦","♣"],ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const cardValue=r=>r==="A"?11:["K","Q","J"].includes(r)?10:parseInt(r);
let deck=[],balance=500,totalBet=0,placedChips=[];
let playerCards=[],dealerCards=[],dealerHiddenEl=null;
function buildDeck(){deck=[];for(const s of suits){for(const r of ranks){deck.push({rank:r,suit:s,value:cardValue(r)})}}shuffle(deck)}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}
function buildDealerDeck(){const d=document.getElementById('dealerDeck');d.innerHTML='';for(let i=0;i<52;i++){const c=document.createElement('div');c.className='dealer-card';c.style.zIndex=i;d.appendChild(c)}}
function placeBet(amount,cls){if(balance<amount){alert('Not enough balance!');return;}balance-=amount;totalBet+=amount;updateUI();const chip=document.createElement('div');chip.className=`placed-chip ${cls}`;chip.textContent=amount;chip.style.left=`calc(50% + ${Math.random()*100-50}px)`;chip.style.top=`${Math.random()*40-20+220}px`;document.body.appendChild(chip);placedChips.push({el:chip,amount});showBetButtons()}
function showBetButtons(){document.getElementById('clearBet').style.display='block';document.getElementById('betBtn').style.display='block'}
function hideBetButtons(){document.getElementById('clearBet').style.display='none';document.getElementById('betBtn').style.display='none'}
function showPlayButtons(){document.getElementById('hitBtn').style.display='block';document.getElementById('standBtn').style.display='block'}
function hidePlayButtons(){document.getElementById('hitBtn').style.display='none';document.getElementById('standBtn').style.display='none'}
function clearBet(){placedChips.forEach(({el,amount})=>{el.remove();balance+=amount;totalBet-=amount});placedChips=[];updateUI();hideBetButtons();clearHands();hidePlayButtons();document.getElementById('playerScore').style.display='none'}
function deal() {
  if (totalBet === 0) return alert('Place a bet first!');
  if (deck.length < 6) buildDeck();

  // Remove placed chips from UI
  placedChips.forEach(({ el }) => el.remove());
  placedChips = [];

  hideBetButtons(); // <== Hides Bet and Clear Bet buttons
  clearHands();

  playerCards = [deck.pop(), deck.pop()];
  dealerCards = [deck.pop(), deck.pop()];
  renderHands();
  updatePlayerScore();
  showPlayButtons();
}


function hit() {
  const newCard = deck.pop();
  playerCards.push(newCard);
  renderHands();
  updatePlayerScore();

  const playerTotal = handValue(playerCards);
  if (playerTotal > 21) {
    alert('Bust!');

    // Wait a moment so the player sees the bust card
    setTimeout(() => {
      moveCardsToDealerPile([...playerCards, ...dealerCards]); // move all cards to dealer side
      clearHands();
      showBetButtons();
      totalBet = 0;
      updateUI();
    }, 600);
  }
}

async function stand() {
  renderHands(true); // show all dealer cards face-up
  hidePlayButtons();
  await delay(500);

  while (handValue(dealerCards) < 17) {
    dealerCards.push(deck.pop());
    renderHands(true); // always reveal dealer's hand
    await delay(800);
  }

  const playerScore = handValue(playerCards);
  const dealerScore = handValue(dealerCards);
  let message = '';

  if (dealerScore > 21) {
    balance += totalBet * 2;
    message = 'Dealer busts! You win!';
  } else if (playerScore > dealerScore) {
    balance += totalBet * 2;
    message = 'You win!';
  } else if (playerScore < dealerScore) {
    message = 'Dealer wins!';
  } else {
    balance += totalBet;
    message = 'Push. It\'s a tie!';
  }

  alert(message);

  // ✅ Move all cards to top-right corner after result
  moveAllTableCardsToTopRight();

  totalBet = 0;
  updateUI();
  document.getElementById('playerScore').style.display = 'none';
  showBetButtons();
}



function dealerPlay(){while(handValue(dealerCards)<17){dealerCards.push(deck.pop());renderHands()} }
function handValue(cards){let val=cards.reduce((sum,c)=>sum+c.value,0);let aces=cards.filter(c=>c.rank==='A').length;while(val>21&&aces){val-=10;aces--}return val}
function renderHands(revealDealer = false) {
  const pH = document.getElementById('playerHand');
  const dH = document.getElementById('dealerHand');
  pH.innerHTML = '';
  dH.innerHTML = '';
  dealerHiddenEl = null;

  playerCards.forEach(c => pH.appendChild(createCardEl(c, false)));

  dealerCards.forEach((c, i) => {
    const faceDown = i === 1 && !revealDealer;
    dH.appendChild(createCardEl(c, faceDown));
    if (faceDown) dealerHiddenEl = dH.lastChild;
  });
}

function createCardEl(card,faceDown){const el=document.createElement('div');el.className='playing-card'+((card.suit==='♥'||card.suit==='♦')?' red':'');if(faceDown){el.classList.add('back');el.innerHTML='';}else{el.innerHTML=`<span class='corner tl'>${card.rank}${card.suit}</span><span>${card.rank}${card.suit}</span><span class='corner br'>${card.rank}${card.suit}</span>`}return el}
function revealDealerHidden(){if(dealerHiddenEl){const idx=Array.from(dealerHiddenEl.parentNode.children).indexOf(dealerHiddenEl);dealerHiddenEl.replaceWith(createCardEl(dealerCards[idx],false));dealerHiddenEl=null}}
function updatePlayerScore(){const score=handValue(playerCards);const badge=document.getElementById('playerScore');badge.textContent=`Player: ${score}`;badge.style.display='block'}
function clearHands(){playerCards=[];dealerCards=[];document.getElementById('playerHand').innerHTML='';document.getElementById('dealerHand').innerHTML=''}
function updateUI(){document.getElementById('balance').textContent=`Balance: $${balance}`;document.getElementById('totalBet').textContent="Total Bet: $"+totalBet}
buildDeck();buildDealerDeck();updateUI();

function handleBust() {
  totalBet = 0;
  updateUI();
  hidePlayButtons();
  document.getElementById('playerScore').style.display = 'none';

  // Remove previous discard piles
  document.querySelectorAll('.discard-pile').forEach(p => p.remove());

  // Create discard pile container
  const discardPile = document.createElement('div');
  discardPile.className = 'discard-pile';

  // Stack all player cards face-down
  playerCards.forEach((card, i) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'playing-card back';
    cardEl.style.zIndex = i; // subtle stacking
    discardPile.appendChild(cardEl);
  });

  document.body.appendChild(discardPile);

  clearHands();
  showBetButtons();
}
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function moveAllTableCardsToTopRight() {
  const playerHand = document.getElementById('playerHand');
  const dealerHand = document.getElementById('dealerHand');
  const cards = [...playerHand.children, ...dealerHand.children];

  cards.forEach((card, i) => {
    card.style.position = 'absolute';
    card.style.top = `${20 + i * 2}px`;
    card.style.right = `${20 + i * 2}px`;
    card.style.transform = 'rotateY(180deg)';
    card.style.zIndex = 1000 + i;
    card.style.transition = 'all 0.5s ease';
    document.body.appendChild(card);
  });

  playerCards = [];
  dealerCards = [];
}

function moveCardsToDealerPile(cards) {
  const dealerDeck = document.getElementById('dealerDeck');
  cards.forEach((card, index) => {
    const el = createCardEl(card, true); // face-down
    el.style.position = 'absolute';
    el.style.top = '20px';
    el.style.left = '20px';
    el.style.zIndex = index;
    document.body.appendChild(el);
  });
}