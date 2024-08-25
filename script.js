// Define the chord progression
const chords = [
    ["Cm7", ["C", "Eb", "G", "Bb"]],
    ["Cm7", ["C", "Eb", "G", "Bb"]],
    ["Fm6", ["F", "Ab", "C", "Eb"]],
    ["Fm6", ["F", "Ab", "C", "Eb"]],
    ["Dm7b5", ["D", "F", "Ab", "C"]],
    ["G7", ["G", "B", "D", "F"]],
    ["Cm6", ["C", "Eb", "G", "Bb"]],
    ["Cm6", ["C", "Eb", "G", "Bb"]],
    ["Ebm7", ["Eb", "Gb", "Bb", "Db"]],
    ["Ab7", ["Ab", "C", "Eb", "Gb"]],
    ["Db", ["Db", "F", "Ab", "C"]],
    ["Db", ["Db", "F", "Ab", "C"]],
    ["Dm7b5", ["D", "F", "Ab", "C"]],
    ["G7", ["G", "B", "D", "F"]],
    ["Cm6", ["C", "Eb", "G", "Bb"]],
    ["G7", ["G", "B", "D", "F"]]
];

// Function to get note name from frequency
function getNoteName(freq) {
	//console.log(freq)
    const A4 = 440.0;
    const C0 = A4 * Math.pow(2, -4.75);
    const name = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const h = Math.round(12 * Math.log2(freq / C0));
    const n = h % 12;
    return name[n] + Math.floor(h / 12); // Return note with octave (e.g., "C4")
}

// Function to standardize note name
function standardizeNoteName(note) {
    const enharmonicMap = {
        "C#": "Db", "Db": "C#",
        "D#": "Eb", "Eb": "D#",
        "F#": "Gb", "Gb": "F#",
        "G#": "Ab", "Ab": "G#",
        "A#": "Bb", "Bb": "A#"
    };
    return enharmonicMap[note] || note;
}

// Initialize AudioContext globally
let audioContext = null;
let analyser = null;
let microphone = null;
let bufferLength;
let dataArray;

// Function to initialize audio processing
function initializeAudio() {
    return new Promise((resolve, reject) => {
        if (audioContext) {
            resolve();
            return;
        }

        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;  // Higher fftSize for better frequency resolution
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Float32Array(bufferLength);

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                resolve();
            })
            .catch((err) => {
                console.error("Error accessing microphone:", err);
                reject(err);
            });
    });
}

// Function to detect pitch from audio data
function detectPitchFromDataArray(dataArray, sampleRate) {
    let nyquist = sampleRate / 2;
    let maxMagnitude = -Infinity;
    let maxIndex = -1;

    // Find peak in frequency domain
    for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > maxMagnitude) {
            maxMagnitude = dataArray[i];
            maxIndex = i;
        }
    }

    if (maxIndex === -1) {
        return null; // No peak found
    }

    let fundamentalFreq = (maxIndex * nyquist) / (bufferLength / 2);

    // Adjust the frequency range if necessary
    if (fundamentalFreq < 20 || fundamentalFreq > 2000) {
        return null;
    }

    return getNoteName(fundamentalFreq);
}



// Function to listen for a note from the microphone
function listenForNote() {
    return new Promise((resolve) => {
        if (!audioContext || !analyser) {
            initializeAudio().then(() => {
                listenForNote().then(resolve);
            });
            return;
        }

        const dataArray = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(dataArray);

        const note = detectPitchFromDataArray(dataArray, audioContext.sampleRate);
		console.log(note)
        if (note) {
            resolve(note);
        } else {
            requestAnimationFrame(() => listenForNote().then(resolve));
        }
    });
}

// Function to update the UI with the current chord and notes
function updateUI(chordName, notes) {
    if (!notes || !Array.isArray(notes)) {
        console.error("Invalid notes array passed to updateUI:", notes);
        return;
    }

    // Update the chord name in the UI
    const chordLabel = document.getElementById("chordLabel");
    if (chordLabel) {
        chordLabel.textContent = chordName;
    } else {
        console.error("Chord label element not found.");
    }

    // Update the scale degree labels
    const scaleDegreeLabels = document.getElementsByClassName("scaleDegreeLabel");
    Array.from(scaleDegreeLabels).forEach((label, index) => {
        if (index < notes.length) {
            label.textContent = `${index + 1} (${notes[index]})`;
            label.style.backgroundColor = "white"; // Reset background color
        } else {
            label.textContent = ""; // Clear any extra labels
        }
    });
}

// Function to mark a scale degree as played
function markScaleDegree(index) {
    const scaleDegreeLabels = document.getElementsByClassName("scaleDegreeLabel");
    if (index >= 0 && index < scaleDegreeLabels.length) {
        scaleDegreeLabels[index].style.backgroundColor = "green";
    }
}

// Function to initialize the UI
function initializeUI() {
    const chordContainer = document.getElementById("chordContainer");
    if (chordContainer) {
        chordContainer.innerHTML = '<div id="chordLabel" style="font-size: 24px; padding-bottom: 20px;"></div>';

        for (let i = 0; i < 4; i++) {
            const label = document.createElement("div");
            label.className = "scaleDegreeLabel";
            label.style.fontSize = "20px";
            label.style.padding = "10px";
            label.style.display = "inline-block";
            chordContainer.appendChild(label);
        }
    } else {
        console.error("Chord container element not found.");
    }
}

// Function to play chords and handle note detection
function playChords(chords) {
    let currentChordIndex = 0;
    let currentNoteIndex = 0;

    function processNote() {
        if (currentChordIndex >= chords.length) {
            currentChordIndex = 0;
            currentNoteIndex = 0;
        }

        const notes = chords[currentChordIndex][1];
        const expectedNote = notes[currentNoteIndex];
        const expectedNoteStandardized = standardizeNoteName(expectedNote);

        listenForNote().then((playedNote) => {
			//if (playedNote) {
			if (playedNote == "F11") {
				playedNote = "X"
			}
			console.log(playedNote)
			playedNote = playedNote.replace(/\d+/g, '');
			console.log("AAA")
			console.log(expectedNoteStandardized)
			console.log(expectedNote)
            if (playedNote === expectedNoteStandardized || playedNote === expectedNote) {
                console.log(`Correct note detected: ${playedNote}`);
                markScaleDegree(currentNoteIndex);
                currentNoteIndex++;

                if (currentNoteIndex >= notes.length) {
                    currentChordIndex++;
                    currentNoteIndex = 0;
                    updateUIForChord();
                }
            }

            requestAnimationFrame(processNote); // Continue listening for the next note
        });
    }

    function updateUIForChord() {
        const chordName = chords[currentChordIndex][0];
        const notes = chords[currentChordIndex][1];
        updateUI(chordName, notes);
    }

    updateUIForChord();
    requestAnimationFrame(processNote);
}

// Initialize the UI and start the chord practice
document.addEventListener("DOMContentLoaded", () => {
    initializeUI();

    // Assuming there's a start button to trigger the chord progression
    document.getElementById("startButton").addEventListener("click", () => {
        playChords(chords);
    });
});

function analyzeAudio() {
    analyser.getFloatFrequencyData(dataArray);
    let pitch = detectPitchFromDataArray(dataArray, audioContext.sampleRate);
    
    if (pitch) {
        console.log("Detected pitch:", pitch);
        // Update UI or perform other actions based on detected pitch
    }

    requestAnimationFrame(analyzeAudio);
}

// Start the audio processing
document.getElementById('startButton').addEventListener('click', () => {
    initializeAudio().then(() => {
        analyzeAudio();
    }).catch(err => {
        console.error('Initialization error:', err);
    });
});
