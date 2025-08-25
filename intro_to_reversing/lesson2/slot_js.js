const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '🎲', '🎯'];
const payouts = {
    '🍒🍒🍒': 50,
    '🍋🍋🍋': 30,
    '🍊🍊🍊': 20,
    '🍇🍇🍇': 15,
    '⭐⭐⭐': 100,
    '💎💎💎': 500
};

// Base64 encoded flag
const encodedFlag = "ZmxhZ3tpX2JlYXRfdGhlX2Nhc2lub30=";

let credits = 100;
let currentBet = 5;
let isSpinning = false;
let reelResults = ['', '', ''];

const creditsElement = document.getElementById('credits');
const currentBetElement = document.getElementById('currentBet');
const resultDisplay = document.getElementById('resultDisplay');
const spinButton = document.getElementById('spinButton');

function initializeReels() {
    for (let i = 1; i <= 3; i++) {
        const strip = document.getElementById(`strip${i}`);
        strip.innerHTML = '';
        for (let j = 0; j < 20; j++) {
            const symbol = document.createElement('div');
            symbol.className = 'symbol';
            symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            strip.appendChild(symbol);
        }
    }
}

function changeBet(direction) {
    if (isSpinning) return;
    
    let newBet;
    if (direction === 1) {
        newBet = currentBet + 5;
        if (newBet <= Math.min(credits, 50)) {
            currentBet = newBet;
        }
    } else {
        newBet = currentBet - 5;
        if (newBet >= 5) {
            currentBet = newBet;
        } else if (currentBet > credits && credits >= 5) {
            currentBet = Math.floor(credits / 5) * 5;
        }
    }
    
    if (currentBet > credits) {
        currentBet = Math.floor(credits / 5) * 5;
        if (currentBet < 5) currentBet = 5;
    }
    
    currentBetElement.textContent = currentBet;
}

function resetGame() {
    if (isSpinning) return;
    
    credits = 100;
    currentBet = 5;
    creditsElement.textContent = credits;
    currentBetElement.textContent = currentBet;
    resultDisplay.textContent = 'Game reset! Place your bet and spin to win!';
    resultDisplay.className = '';
    
    initializeReels();
}

function spin() {
    if (isSpinning || credits < currentBet) {
        if (credits < currentBet) {
            resultDisplay.textContent = 'Not enough credits! Reduce your bet or reset game.';
            resultDisplay.className = 'lose';
        }
        return;
    }
    
    isSpinning = true;
    credits -= currentBet;
    creditsElement.textContent = credits;
    spinButton.disabled = true;
    resultDisplay.textContent = 'Spinning...';
    resultDisplay.className = '';
    
    for (let i = 1; i <= 3; i++) {
        const reel = document.getElementById(`reel${i}`);
        reel.classList.add('spinning');
    }
    
    setTimeout(() => stopReel(1), 1000 + Math.random() * 500);
    setTimeout(() => stopReel(2), 1500 + Math.random() * 500);
    setTimeout(() => stopReel(3), 2000 + Math.random() * 500);
}

function stopReel(reelNumber) {
    const reel = document.getElementById(`reel${reelNumber}`);
    const strip = document.getElementById(`strip${reelNumber}`);
    
    reel.classList.remove('spinning');
    
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    reelResults[reelNumber - 1] = randomSymbol;
    
    strip.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        symbol.textContent = i === 1 ? randomSymbol : symbols[Math.floor(Math.random() * symbols.length)];
        strip.appendChild(symbol);
    }
    
    strip.style.transform = 'translateY(-120px)';
    
    if (reelNumber === 3) {
        setTimeout(checkWin, 500);
    }
}

function checkWin() {
    const result = reelResults.join('');
    let winAmount = 0;
    let winMessage = '';
    
    if (payouts[result]) {
        winAmount = currentBet * payouts[result];
        winMessage = `JACKPOT! ${result} - Won $${winAmount}!`;
        resultDisplay.className = 'win';
    } else {
        const uniqueSymbols = [...new Set(reelResults)];
        if (uniqueSymbols.length === 2) {
            winAmount = currentBet * 2;
            winMessage = `Two of a kind! Won $${winAmount}!`;
            resultDisplay.className = 'win';
        } else {
            winMessage = 'Better luck next time!';
            resultDisplay.className = 'lose';
        }
    }
    
    credits += winAmount;
    creditsElement.textContent = credits;
    resultDisplay.textContent = winMessage;
    
    // Check if player has beaten the casino (more than 50,000 credits)
    if (credits > 50000) {
        const flag = atob(encodedFlag);
        alert(`🎉 CONGRATULATIONS! You've beaten the casino! 🎉\n\n${flag}`);
    }
    
    if (currentBet > credits && credits > 0) {
        currentBet = Math.floor(credits / 5) * 5;
        if (currentBet < 5 && credits >= 5) currentBet = 5;
        currentBetElement.textContent = currentBet;
    }
    
    if (credits < 5) {
        setTimeout(() => {
            alert('Game Over! You ran out of credits. Starting fresh with $100.');
            resetGame();
        }, 2000);
    }
    
    isSpinning = false;
    spinButton.disabled = false;
}

initializeReels();