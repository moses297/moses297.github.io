// HTML Elements
const phase1 = document.getElementById("phase-1");
const phase2 = document.getElementById("phase-2");
const yourCharacter = document.getElementById("your-character");
const selectionGrid = document.getElementById("selection-grid");
const characterGrid = document.getElementById("character-grid");
const resetButton = document.getElementById("reset-button");

let selectedCharacter = null; // To track the "own" character

// Populate Selection Grid (Phase 1)
function populateSelectionGrid() {
  selectionGrid.innerHTML = ""; // Clear existing content to avoid duplication
  characterData.politicians.characters.forEach((character) => {
    const charBox = document.createElement("div");
    charBox.classList.add("character-box");
    charBox.innerHTML = `
      <img src="${character.image}" alt="${character.name}">
      <p>${character.name}</p>
    `;
    charBox.addEventListener("click", () => {
      selectedCharacter = character;
      yourCharacter.innerHTML = `
        <div class="character-box">
          <img src="${character.image}" alt="${character.name}">
          <p>${character.name}</p>
        </div>
      `;
      phase1.style.display = "none";
      phase2.style.display = "block";
      populateCharacterGrid(); // Move to Phase 2
    });
    selectionGrid.appendChild(charBox);
  });
}

// Populate Character Grid (Phase 2)
function populateCharacterGrid() {
  characterGrid.innerHTML = ""; // Clear existing content to avoid duplication
  characterData.politicians.characters.forEach((character) => {
    const charBox = document.createElement("div");
    charBox.classList.add("character-box");
    charBox.innerHTML = `
      <img src="${character.image}" alt="${character.name}">
      <p>${character.name}</p>
    `;

    // Add click-to-gray-out functionality
    charBox.addEventListener("click", () => {
      charBox.classList.toggle("grayed-out");
    });

    characterGrid.appendChild(charBox);
  });
}


function displayCharacters() {
  const characterGrid = document.getElementById('character-grid');
  characterGrid.innerHTML = ''; // Clear the grid before re-rendering

  // Assuming `characters` is the data of all characters
  characters.forEach(character => {
    const characterBox = document.createElement('div');
    characterBox.classList.add('character-box');
    
    const img = document.createElement('img');
    img.src = character.image;
    img.alt = character.name;

    const name = document.createElement('p');
    name.textContent = character.name;
    name.classList.add('character-name');

    // Append image and name to the character box
    characterBox.appendChild(img);
    characterBox.appendChild(name);
    
    // Add the character box to the grid
    characterGrid.appendChild(characterBox);
  });
}


// Reset Functionality
resetButton.addEventListener("click", () => {
  // Clear 'grayed-out' class from all character boxes
  document.querySelectorAll(".character-box").forEach((box) => {
    box.classList.remove("grayed-out");
  });
});
// Initialize
populateSelectionGrid();
