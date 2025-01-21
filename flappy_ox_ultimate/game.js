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
let isMuted = localStorage.getItem('isMuted') === 'true';
let assetsLoaded = false;
let loadedAssets = 0;
const totalAssets = 5; // backgroundImg, oxMascot, coinImg, backgroundMusic, coinSound
let originalDifficulty = null;



document.addEventListener('visibilitychange', () => {
    if (document.hidden) { 
        if (backgroundMusic) {
            backgroundMusic.pause();
        }
    } else {
        if (backgroundMusic && gameStarted && !isMuted) {
            backgroundMusic.play().catch(console.error);
        }
    }
});

function loadAssets() {
    const assets = [
        { element: backgroundImg, src: 'assets/background.png' },
        { element: oxMascot, src: 'assets/ox-mascot.png' },
        { element: coinImg, src: 'assets/coin.png' },
        { element: backgroundMusic, src: 'assets/flappy_music.mp3' },
        { element: coinSound, src: 'assets/flappy_coin.mp3' }
    ];

    assets.forEach(asset => {
        const isAudio = asset.element instanceof HTMLAudioElement;
        
        // Handle already loaded assets
        if (!isAudio && asset.element.complete && asset.element.naturalWidth !== 0) {
            loadedAssets++;
            updateLoadingStatus();
            return;
        }
        
        if (isAudio) {
            // For audio elements
            const handleAudioLoad = () => {
                loadedAssets++;
                updateLoadingStatus();
                asset.element.removeEventListener('canplaythrough', handleAudioLoad);
            };
            
            asset.element.addEventListener('canplaythrough', handleAudioLoad);
            
            // Fallback for cached audio
            if (asset.element.readyState >= 4) {
                handleAudioLoad();
            }
        } else {
            // For image elements
            const handleImageLoad = () => {
                loadedAssets++;
                updateLoadingStatus();
                asset.element.removeEventListener('load', handleImageLoad);
            };
            
            asset.element.addEventListener('load', handleImageLoad);
            asset.element.src = asset.src;
        }
    });
    
    // Fallback in case assets are cached
    setTimeout(() => {
        if (loadedAssets < totalAssets) {
            console.log('Some assets might be cached, forcing load completion');
            loadedAssets = totalAssets;
            updateLoadingStatus();
        }
    }, 3000);
}

function updateLoadingStatus() {
    if (loadedAssets === totalAssets) {
        assetsLoaded = true;
        startMessage.style.display = 'block';
        document.getElementById('loadingMessage').style.display = 'none';
    }
}

function updateLoadingStatus() {
    const progress = (loadedAssets / totalAssets) * 100;
    const progressBar = document.querySelector('.loading-bar-fill');
    const progressText = document.querySelector('.loading-progress');
    
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(progress)}%`;
    }

    if (loadedAssets === totalAssets) {
        assetsLoaded = true;
        setTimeout(() => {
            startMessage.style.display = 'block';
            document.getElementById('loadingMessage').style.display = 'none';
        }, 500); // Small delay to show completed loading bar
    }
}

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
        portrait: { gravity: 0.4, jumpForce: -8, pipeSpeed: 3, pipeSpacing: 275 },
        landscape: { gravity: 0.4, jumpForce: -8, pipeSpeed: 2.5, pipeSpacing: 770 }
    },
    medium: {
        portrait: { gravity: 0.45, jumpForce: -8.5, pipeSpeed: 3.5, pipeSpacing: 260 },
        landscape: { gravity: 0.6, jumpForce: -7.5, pipeSpeed: 3.5, pipeSpacing: 720 }
    },
    hard: {
        portrait: { gravity: 0.5, jumpForce: -9, pipeSpeed: 4.5, pipeSpacing: 240 },
        landscape: { gravity: 0.7, jumpForce: -8, pipeSpeed: 4.5, pipeSpacing: 700 }
    },
    extreme: {
        portrait: { gravity: 0.6, jumpForce: -9.5, pipeSpeed: 5.5, pipeSpacing: 220 },
        landscape: { gravity: 0.75, jumpForce: -7.5, pipeSpeed: 5.5, pipeSpacing: 700 }
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
    console.log(baseGap)
}

// Game objects creation
function createPipe() {
    const currentGap = baseGap - (currentLevel - 1) * PIPE_GAP_DECREASE;
    const minHeight = canvas.height * 0.55;
    const maxHeight = canvas.height - currentGap - minHeight;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    console.log(height)
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
            // Enable image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(coinImg, 
                coin.x - coin.size/2, 
                coin.y - coin.size/2, 
                coin.size, 
                coin.size);
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
        vulnerabilityMessage.textContent = "OH NO! YOU DIDN'T FIX ANY VULNERABILITIES!";
    } else if (collectedCoins === 1) {
        vulnerabilityMessage.innerHTML = `AWESOME! YOU'VE FIXED <span id="vulnerabilityCount" class="pink-text">1</span> VULNERABILITY!`;
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
    const shareUrl = encodeURIComponent(window.location.href);
    const buttons = document.querySelectorAll('.share-icon, .visit-link');
    buttons.forEach(button => {
        // Replace existing event listeners
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Detect if device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    document.querySelectorAll('.share-icon, .visit-link').forEach(button => {
        ['click', 'touchstart'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                if (button.classList.contains('visit-link')) {
                    // Ensure the link opens in a new tab
                    window.open('https://ox.security', '_blank', 'noopener,noreferrer');
                } else {
                    // Generate dynamic share text
                    const vulnText = collectedCoins === 1 ? "vulnerability" : "vulnerabilities";
                    const pointText = score === 1 ? "point" : "points";
                    const shareText = `I fixed ${collectedCoins} ${vulnText} and scored ${score} ${pointText} in Flappy OX! Can you beat my score?`;
                    
                    if (button.classList.contains('linkedin')) {
                        let linkedinShareUrl;
                        if (isMobile) {
                            // Use original mobile URL format
                            linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareText+" ")}${shareUrl}&openExternalBrowser=1`;
                        } else {
                            // Use new desktop URL format
                            linkedinShareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(shareText + " " + window.location.href)}`;
                        }
                        window.open(linkedinShareUrl, '_blank', 'noopener,noreferrer');
                    } else {
                        // Share for Twitter
                        const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${shareUrl}`;
                        window.open(twitterShareUrl, '_blank', 'noopener,noreferrer');
                    }
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
    difficulty = { ...DIFFICULTY_SETTINGS[difficultySelect.value][orientation] }; // Reset to initial difficulty
    
    gameStarted = true;
    startMessage.style.display = 'none';
    lastTime = performance.now();
    
    // Play background music on restart
    playBackgroundMusic();
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
    loadAssets();
    
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
    
    startMessage.style.display = 'none'; // Hide start message until assets are loaded
    gameOverScreen.style.display = 'none';
    
    const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    difficulty = DIFFICULTY_SETTINGS[difficultySelect.value][orientation];
    originalDifficulty = { ...difficulty }; // Store original difficulty settings
    
    baseGap = Math.min(canvas.height * (orientation === 'landscape' ? 0.4 : 0.32), 
                      orientation === 'landscape' ? 320 : 280);
    lastTime = performance.now();
    highScoreElement.textContent = highScore;
}

// Add at the top with other game state variables
let isFirstTimePlayingGame = true;
let firstTouchOccurred = false;
let secondTouchOccurred = false;

function jump(e) {
    if (e) {
        e.preventDefault();
    }
    
    if (!assetsLoaded || gameOverScreen.style.display === 'block') {
        return;
    }
    if (firstTouchOccurred && !secondTouchOccurred) {
        playBackgroundMusic();
        secondTouchOccurred = true;
    } 

    if (!gameStarted && difficultySelect.value) {
        if (isFirstTimePlayingGame) {
            if (!firstTouchOccurred) {
                console.log("first touch")
                firstTouchOccurred = true;
                gameStarted = true;
                startMessage.style.display = 'none';
                playBackgroundMusic();
            } else {
                console.log("2nd touch touch")
                
                // Second touch - start the music and mark first game as played
                isFirstTimePlayingGame = false;
                playBackgroundMusic();
            }
        } else {
            console.log("other touch")
            // Not first time playing - start game and music immediately
            gameStarted = true;
            startMessage.style.display = 'none';
            playBackgroundMusic();
        }
    }

    

    if (gameStarted) {
        bird.velocity = difficulty.jumpForce;
    }
}

function playBackgroundMusic() {
    console.log("trying to play background music")
    if (!isMuted && backgroundMusic) {
        // Only start music if it's not already playing
        if (backgroundMusic.paused) {
            const playPromise = backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    if (error.name === "NotAllowedError") {
                        // If autoplay was prevented, add a one-time touch listener
                        const startAudio = () => {
                            backgroundMusic.play().catch(console.error);
                            document.removeEventListener('touchstart', startAudio);
                            document.removeEventListener('click', startAudio);
                        };
                        document.addEventListener('touchstart', startAudio);
                        document.addEventListener('click', startAudio);
                    } else {
                        console.log('Error playing background music:', error);
                    }
                });
            }
        }
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
