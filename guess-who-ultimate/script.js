// Game state
let currentPhase = 'list-selection';
let selectedList = null;
let selectedCharacter = null;
let grayedOutCharacters = new Set();

// DOM Elements
const phases = {
  listSelection: document.getElementById('list-selection'),
  characterSelection: document.getElementById('character-selection'),
  gamePhase: document.getElementById('game-phase')
};

// Initialize game
function initGame() {
  renderListSelection();
  setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('back-to-lists').addEventListener('click', backToLists);
  document.getElementById('reset-grayed').addEventListener('click', resetGrayedOut);
  document.getElementById('reset-game').addEventListener('click', resetGame);
}

// Phase Management
function showPhase(phaseName) {
  Object.values(phases).forEach(phase => phase.style.display = 'none');
  phases[phaseName].style.display = 'block';
  currentPhase = phaseName;
}

// List Selection Phase
function renderListSelection() {
  const listGrid = document.getElementById('list-grid');
  listGrid.innerHTML = '';
  
  Object.entries(characterLists).forEach(([key, list]) => {
    const listBox = document.createElement('div');
    listBox.className = 'list-box';
    listBox.innerHTML = `<h3>${list.name}</h3>
                        <p>${list.characters.length} characters</p>`;
    listBox.addEventListener('click', () => selectList(key));
    listGrid.appendChild(listBox);
  });
  
  showPhase('listSelection');
}

function selectList(listKey) {
  selectedList = listKey;
  renderCharacterSelection();
  showPhase('characterSelection');
}

// Character Selection Phase
function renderCharacterSelection() {
  const selectionGrid = document.getElementById('selection-grid');
  selectionGrid.innerHTML = '';
  
  characterLists[selectedList].characters.forEach(character => {
    const charBox = createCharacterBox(character);
    charBox.addEventListener('click', () => selectCharacter(character));
    selectionGrid.appendChild(charBox);
  });
}

function selectCharacter(character) {
  selectedCharacter = character;
  renderGamePhase();
  showPhase('gamePhase');
}

// Game Phase
function renderGamePhase() {
  renderSelectedCharacter();
  renderCharacterGrid();
}

function renderSelectedCharacter() {
  const yourCharacter = document.getElementById('your-character');
  yourCharacter.innerHTML = '';
  const charBox = createCharacterBox(selectedCharacter);
  charBox.classList.add('selected');
  yourCharacter.appendChild(charBox);
}

function renderCharacterGrid() {
  const characterGrid = document.getElementById('character-grid');
  characterGrid.innerHTML = '';
  
  characterLists[selectedList].characters.forEach(character => {
    const charBox = createCharacterBox(character);
    if (grayedOutCharacters.has(character.id)) {
      charBox.classList.add('grayed-out');
    }
    charBox.addEventListener('click', () => toggleCharacter(character.id, charBox));
    characterGrid.appendChild(charBox);
  });
}

// Helper Functions
function createCharacterBox(character) {
  const charBox = document.createElement('div');
  charBox.className = 'character-box';
  charBox.innerHTML = `
    <img src="${character.image}" alt="${character.name}">
    <div class="character-name">${character.name}</div>
  `;
  return charBox;
}

function toggleCharacter(characterId, element) {
  if (grayedOutCharacters.has(characterId)) {
    grayedOutCharacters.delete(characterId);
    element.classList.remove('grayed-out');
  } else {
    grayedOutCharacters.add(characterId);
    element.classList.add('grayed-out');
  }
}

// Reset Functions
function resetGrayedOut() {
  grayedOutCharacters.clear();
  renderCharacterGrid();
}

function resetGame() {
  selectedList = null;
  selectedCharacter = null;
  grayedOutCharacters.clear();
  renderListSelection();
}

function backToLists() {
  resetGame();
}

// Start the game
document.addEventListener('DOMContentLoaded', initGame);