// 🎨 EASY TO EDIT: Color array - try changing these hex values!
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292'];

// 🔢 EASY TO EDIT: Counter increment value - try changing this number!
const INCREMENT_VALUE = 1;

// 💬 EASY TO EDIT: Messages array - add, remove, or change these messages!
const messages = [
    "Hello from the JavaScript console! 👋",
    "You're doing great with DevTools! 🚀",
    "JavaScript editing is fun! 🎉",
    "Keep experimenting! 💡",
    "The console is your friend! 🤝"
];

// 🚀 EASY TO EDIT: Greeting prefix - change this text!
const GREETING_PREFIX = "Hello there, ";

// ⏰ EASY TO EDIT: Clock update interval in milliseconds (1000 = 1 second)
const CLOCK_UPDATE_INTERVAL = 1000;

// Global counter variable
let counter = 0;

// Function to create color boxes
function createColorBoxes() {
    const container = document.getElementById('colorBoxes');
    container.innerHTML = '';
    colors.forEach(color => {
        const box = document.createElement('div');
        box.className = 'color-box';
        box.style.backgroundColor = color;
        container.appendChild(box);
    });
}

// Function to change colors (demonstrates immediate visual feedback)
function changeColors() {
    const boxes = document.querySelectorAll('.color-box');
    boxes.forEach((box, index) => {
        // This will show immediate changes when colors array is modified
        box.style.backgroundColor = colors[index % colors.length];
        // Add a little animation
        box.style.transform = 'scale(1.1)';
        setTimeout(() => {
            box.style.transform = 'scale(1)';
        }, 200);
    });
}

// Counter functions
function incrementCounter() {
    counter += INCREMENT_VALUE; // Easy to modify this value!
    document.getElementById('counter').textContent = counter;
}

function resetCounter() {
    counter = 0;
    document.getElementById('counter').textContent = counter;
}

// Random message function
function showRandomMessage() {
    const randomIndex = Math.floor(Math.random() * messages.length);
    const message = messages[randomIndex]; // Will reflect array changes immediately!
    document.getElementById('output').innerHTML = `<strong>${message}</strong>`;
}

// Greeting function
function greetUser() {
    const name = document.getElementById('nameInput').value;
    const greetingText = name ? 
        `${GREETING_PREFIX}${name}! 🎊` : 
        "Please enter your name first! 😊";
    document.getElementById('greeting').innerHTML = `<h2>${greetingText}</h2>`;
}

// Clock function
function updateClock() {
    const now = new Date();
    // EASY TO EDIT: Change this format string!
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('clock').textContent = timeString;
}

// Initialize everything when page loads
window.onload = function() {
    createColorBoxes();
    updateClock();
    
    // Start the clock - easy to modify the interval!
    setInterval(updateClock, CLOCK_UPDATE_INTERVAL);
    
    // Add some console messages for workshop participants
    console.log("🎉 Welcome to the JS Editing Workshop!");
    console.log("💡 Try editing the variables at the top of this script:");
    console.log("   - colors array");
    console.log("   - INCREMENT_VALUE");
    console.log("   - messages array");
    console.log("   - GREETING_PREFIX");
    console.log("   - CLOCK_UPDATE_INTERVAL");
    console.log("🔧 Then save (Ctrl+S) and watch the changes happen!");
};

// Bonus: Add keyboard shortcuts for workshop demo
document.addEventListener('keydown', function(event) {
    if (event.key === 'c' && event.altKey) {
        changeColors();
    }
    if (event.key === 'r' && event.altKey) {
        showRandomMessage();
    }
});