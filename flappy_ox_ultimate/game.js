// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const startMessage = document.getElementById('startMessage');
const difficultySelect = document.getElementById('difficultySelect');
const gameOverScreen = document.getElementById('gameOver');
const finalScoreElement = document.getElementById('finalScore');
const highScoreElement = document.getElementById('highScore');
const restartButton = document.getElementById('restartButton');
const backgroundMusic = document.getElementById('backgroundMusic');
const coinSound = document.getElementById('coinSound');
const muteButton = document.getElementById('muteButton');
const muteIcon = document.getElementById('muteIcon');
let isMuted = localStorage.getItem('isMuted') === 'false';

function initAudio() {
    backgroundMusic.volume = 0.5;
    coinSound.volume = 0.6;
    
    updateMuteState();
    
    muteButton.addEventListener('click', handleMute);
    muteButton.addEventListener('touchstart', handleMute, { passive: false });
}


function handleMute(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteState();
}

function updateMuteState() {
    muteIcon.src = isMuted ? 'assets/mute.png' : 'assets/unmute.png';
    backgroundMusic.muted = isMuted;
    coinSound.muted = isMuted;
}

// Set initial difficulty
difficultySelect.value = 'easy';

// Game Constants
const DIFFICULTY_SETTINGS = {
    easy: {
        portrait: { gravity: 0.4, jumpForce: -8, pipeSpeed: 3, pipeSpacing: 280 },
        landscape: { gravity: 0.5, jumpForce: -7, pipeSpeed: 3, pipeSpacing: 550 }
    },
    medium: {
        portrait: { gravity: 0.45, jumpForce: -8.5, pipeSpeed: 3.5, pipeSpacing: 260 },
        landscape: { gravity: 0.6, jumpForce: -7.5, pipeSpeed: 3.5, pipeSpacing: 520 }
    },
    hard: {
        portrait: { gravity: 0.5, jumpForce: -9, pipeSpeed: 4.5, pipeSpacing: 240 },
        landscape: { gravity: 0.7, jumpForce: -8, pipeSpeed: 4.5, pipeSpacing: 500 }
    },
    extreme: {
        portrait: { gravity: 0.6, jumpForce: -9.5, pipeSpeed: 5.5, pipeSpacing: 220 },
        landscape: { gravity: 0.85, jumpForce: -8.5, pipeSpeed: 5.5, pipeSpacing: 480 }
    }
};

const LEVEL_THRESHOLDS = [0, 7, 16, 28, 45, 65, 90];
const PIPE_GAP_DECREASE = 3;
const BACKGROUND_SCROLL_SPEED = 1;
const COIN_POINTS = 5;

// Game state variables
let gameStarted = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let currentLevel = 1;
let difficulty = DIFFICULTY_SETTINGS[difficultySelect.value];
let baseGap = 200;
let backgroundX = 0;
let lastTime = 0;
let deltaTime = 0;
let coins = [];
let floatingTexts = [];


// Bird object
let bird = {
    x: 0,
    y: 0,
    velocity: 0,
    size: 60
};

// Game arrays
let pipes = [];

// Colors
const colors = {
    background: '#2D1B4E',
    bird: '#8B5CF6',
    pipe: '#6D28D9',
    highlight: '#A78BFA'
};

// Load images
const backgroundImg = new Image();
backgroundImg.src = 'assets/background.png';

const oxMascot = new Image();
oxMascot.src = 'assets/ox-mascot.png';

const coinImg = new Image();
coinImg.src = 'assets/coin.png';

// Canvas sizing
function resizeCanvas() {
    const container = document.getElementById('gameContainer');
    const containerRect = container.getBoundingClientRect();
    
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;
    
    if (bird) {
        bird.size = Math.min(canvas.width, canvas.height) * 0.1;
        if (!gameStarted) {
            bird.x = canvas.width * 0.25;
            bird.y = canvas.height / 2;
        }
    }
    
    const isLandscape = window.innerWidth > window.innerHeight;
    baseGap = isLandscape ? 
        Math.min(canvas.height * 0.4, 320) :
        Math.min(canvas.height * 0.32, 280);
}

// Game objects creation
function createPipe() {
    const currentGap = baseGap - (currentLevel - 1) * PIPE_GAP_DECREASE;
    const minHeight = canvas.height * 0.15;
    const maxHeight = canvas.height - currentGap - minHeight;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    const pipeWidth = canvas.width * 0.08;
    
    const hasCoin = Math.random() < 0.7;
    if (hasCoin) {
        coins.push({
            x: canvas.width + pipeWidth/2,
            y: height + currentGap/2,
            size: Math.min(canvas.width, canvas.height) * 0.09,
            collected: false
        });
    }
    
    pipes.push({
        x: canvas.width,
        height: height,
        scored: false
    });
}

function createFloatingText(x, y, text) {
    const textObj = {
        x,
        y,
        text,
        opacity: 1,
        life: 0
    };
    floatingTexts.push(textObj);
}

// Drawing functions
function drawBackground() {
    if (backgroundImg.complete && backgroundImg.naturalWidth > 0) {
        const scale = canvas.height / backgroundImg.naturalHeight;
        const scaledWidth = backgroundImg.naturalWidth * scale;
        
        let currentX = backgroundX;
        while (currentX < canvas.width) {
            ctx.drawImage(backgroundImg, currentX, 0, scaledWidth, canvas.height);
            currentX += scaledWidth;
        }
        ctx.drawImage(backgroundImg, backgroundX - scaledWidth, 0, scaledWidth, canvas.height);
        
        if (gameStarted) {
            backgroundX -= BACKGROUND_SCROLL_SPEED * (deltaTime / 16);
            if (backgroundX <= -scaledWidth) {
                backgroundX = 0;
            }
        }
    } else {
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawBird() {
    if (oxMascot.complete && oxMascot.naturalWidth > 0) {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(bird.velocity * 0.02);
        ctx.drawImage(oxMascot, -bird.size/2, -bird.size/2, bird.size, bird.size);
        ctx.restore();
    } else {
        ctx.fillStyle = colors.bird;
        ctx.beginPath();
        ctx.arc(bird.x, bird.y, bird.size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPipes() {
    const pipeWidth = canvas.width * 0.08;
    pipes.forEach(pipe => {
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.height);

        ctx.fillStyle = colors.highlight;
        ctx.fillRect(pipe.x - pipeWidth*0.06, pipe.height - pipeWidth*0.375, 
                    pipeWidth*1.125, pipeWidth*0.375);

        const currentGap = baseGap - (currentLevel - 1) * PIPE_GAP_DECREASE;
        
        ctx.fillStyle = colors.pipe;
        ctx.fillRect(pipe.x, pipe.height + currentGap, pipeWidth, 
                    canvas.height - pipe.height - currentGap);

        ctx.fillStyle = colors.highlight;
        ctx.fillRect(pipe.x - pipeWidth*0.06, pipe.height + currentGap, 
                    pipeWidth*1.125, pipeWidth*0.375);
    });
}

function drawCoins() {
    coins.forEach(coin => {
        if (!coin.collected && coinImg.complete) {
            ctx.drawImage(coinImg, coin.x - coin.size/2, coin.y - coin.size/2, 
                         coin.size, coin.size);
        }
    });
}

function drawFloatingTexts() {
    floatingTexts = floatingTexts.filter(text => {
        ctx.save();
        ctx.globalAlpha = text.opacity;
        ctx.fillStyle = 'white';
        ctx.font = `bold ${canvas.height * 0.03}px Arial`;
        ctx.fillText(text.text, text.x, text.y);
        ctx.restore();
        
        text.y -= 1;
        text.opacity -= 0.02;
        text.life += 1;
        
        return text.life < 50;
    });
}

let collectedCoins = 0;

// Update functions
function updateCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            coin.x -= (difficulty.pipeSpeed * canvas.width / 800) * (deltaTime / 16);
            
            const distance = Math.hypot(bird.x - coin.x, bird.y - coin.y);
            if (distance < (bird.size + coin.size) / 2) {
                coin.collected = true;
                collectedCoins++;
                score += COIN_POINTS;
                scoreElement.textContent = score;
                createFloatingText(coin.x, coin.y - coin.size, "fixed!");
                
                // Play coin sound
                if (!isMuted) {
                    coinSound.currentTime = 0;
                    coinSound.play().catch(console.error);
                }
            }
        }
    });
    
    coins = coins.filter(coin => coin.x + coin.size > 0);
}

function update(currentTime) {
    deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    if (!gameStarted) return;

    bird.velocity += difficulty.gravity * (deltaTime / 16);
    bird.y += bird.velocity * (deltaTime / 16);

    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - difficulty.pipeSpacing) {
        createPipe();
    }

    const pipeWidth = canvas.width * 0.08;
    pipes.forEach(pipe => {
        pipe.x -= (difficulty.pipeSpeed * canvas.width / 800) * (deltaTime / 16);

        if (!pipe.scored && pipe.x + pipeWidth < bird.x) {
            pipe.scored = true;
            score++;
            scoreElement.textContent = score;

            let newLevel = 1;
            for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
                if (score >= LEVEL_THRESHOLDS[i]) {
                    newLevel = i + 1;
                }
            }
            
            if (newLevel !== currentLevel) {
                currentLevel = newLevel;
                levelElement.textContent = `Level ${currentLevel}`;
                difficulty.pipeSpeed += 0.25;
            }
        }
    });

    updateCoins();
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    if (checkCollisions()) {
        gameOver();
    }
}

function checkCollisions() {
    if (bird.y + bird.size / 2 > canvas.height || bird.y - bird.size / 2 < 0) {
        return true;
    }

    const pipeWidth = canvas.width * 0.08;
    return pipes.some(pipe => {
        const hitBox = bird.size / 2.5;
        const currentGap = baseGap - (currentLevel - 1) * PIPE_GAP_DECREASE;
        return (
            bird.x + hitBox > pipe.x &&
            bird.x - hitBox < pipe.x + pipeWidth &&
            (bird.y - hitBox < pipe.height ||
             bird.y + hitBox > pipe.height + currentGap)
        );
    });
}

// Game state functions
function gameOver() {
    gameStarted = false;
    finalScoreElement.textContent = score;
    
    const vulnerabilityMessage = document.getElementById('vulnerabilityMessage');
    if (collectedCoins === 0) {
        vulnerabilityMessage.textContent = "OH NO! YOU DIDN'T FIX ANY VULNERABILITY!";
    } else {
        vulnerabilityMessage.innerHTML = `AWESOME! YOU'VE FIXED <span id="vulnerabilityCount" class="pink-text">${collectedCoins}</span> VULNERABILITIES!`;
    }
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    highScoreElement.textContent = highScore;
    
    gameOverScreen.style.display = 'block';
    initializeShareButtons();
}

function initializeShareButtons() {
    const shareText = `I fixed ${collectedCoins} vulnerabilities and scored ${score} points in Flappy OX! Can you beat my score?`;
    const shareUrl = encodeURIComponent(window.location.href);
    
    // Handle all interactive buttons (share buttons and Join OX button)
    const buttons = document.querySelectorAll('.share-icon, .visit-link');
    buttons.forEach(button => {
        ['click', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                if (button.classList.contains('visit-link')) {
                    window.open('https://ox.security', '_blank');
                } else {
                    const platform = button.classList.contains('linkedin') ? 'linkedin' : 'twitter';
                    const url = platform === 'linkedin' 
                        ? `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&summary=${encodeURIComponent(shareText)}`
                        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`;
                    window.open(url, '_blank');
                }
            }, { passive: false });
        });
    });
}

function restartGame() {
    gameOverScreen.style.display = 'none';
    pipes = [];
    coins = [];
    floatingTexts = [];
    score = 0;
    collectedCoins = 0;
    currentLevel = 1;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    scoreElement.textContent = '0';
    levelElement.textContent = 'Level 1';
    
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    difficulty = DIFFICULTY_SETTINGS[difficultySelect.value][orientation];
    
    gameStarted = true;
    startMessage.style.display = 'none';
    lastTime = performance.now();
}

function handlePointerEvent(e) {
    e.preventDefault();
    const element = e.target;
    
    if (element.id === 'restartButton' || element.closest('#restartButton')) {
        element.style.opacity = "0.7";
        setTimeout(() => element.style.opacity = "1", 150);
        restartGame();
    }
}

function draw() {
    drawBackground();
    drawPipes();
    drawCoins();
    drawBird();
    drawFloatingTexts();
}

function gameLoop(currentTime) {
    update(currentTime);
    draw();
    requestAnimationFrame(gameLoop);
}

function init() {
    resizeCanvas();
    initAudio();
    bird.x = canvas.width * 0.25;
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.size = Math.min(canvas.width, canvas.height) * 0.1;
    pipes = [];
    coins = [];
    floatingTexts = [];
    score = 0;
    currentLevel = 1;
    scoreElement.textContent = score;
    levelElement.textContent = `Level ${currentLevel}`;
    gameStarted = false;
    startMessage.style.display = 'block';
    gameOverScreen.style.display = 'none';
    
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    difficulty = DIFFICULTY_SETTINGS[difficultySelect.value][orientation];
    
    baseGap = Math.min(canvas.height * (orientation === 'landscape' ? 0.4 : 0.32), 
                      orientation === 'landscape' ? 320 : 280);
    lastTime = performance.now();
    highScoreElement.textContent = highScore;
}

function jump(e) {
    if (e) {
        e.preventDefault();
    }
    
    if (gameOverScreen.style.display === 'block') {
        return;
    }
    
    if (!gameStarted && difficultySelect.value) {
        gameStarted = true;
        startMessage.style.display = 'none';
        backgroundMusic.play().catch(() => console.log('Autoplay prevented'));
    }

    if (gameStarted) {
        bird.velocity = difficulty.jumpForce;
    }
}

// Event Listeners
document.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

canvas.addEventListener('touchstart', jump, { passive: false });
canvas.addEventListener('click', jump);

restartButton.addEventListener('touchstart', handlePointerEvent, { passive: false });
restartButton.addEventListener('click', handlePointerEvent);

difficultySelect.addEventListener('touchstart', (e) => {
    e.stopPropagation();
}, { passive: false });

difficultySelect.addEventListener('change', (e) => {
    e.stopPropagation();
    init();
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

// Handle difficulty orientation changes
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
});

window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        difficulty = DIFFICULTY_SETTINGS[difficultySelect.value][orientation];
    }, 200);
});

// Initialize game
init();
requestAnimationFrame(gameLoop);
