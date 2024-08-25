// Chord progression
const chords = [
    { name: "Cm7", notes: ["C", "Eb", "G", "Bb"] },
    { name: "Cm7", notes: ["C", "Eb", "G", "Bb"] },
    { name: "Fm6", notes: ["F", "Ab", "C", "Eb"] },
    { name: "Fm6", notes: ["F", "Ab", "C", "Eb"] },
    { name: "Dm7b5", notes: ["D", "F", "Ab", "C"] },
    { name: "G7", notes: ["G", "B", "D", "F"] },
    { name: "Cm6", notes: ["C", "Eb", "G", "Bb"] },
    { name: "Cm6", notes: ["C", "Eb", "G", "Bb"] },
    { name: "Ebm7", notes: ["Eb", "Gb", "Bb", "Db"] },
    { name: "Ab7", notes: ["Ab", "C", "Eb", "Gb"] },
    { name: "Db", notes: ["Db", "F", "Ab", "C"] },
    { name: "Db", notes: ["Db", "F", "Ab", "C"] },
    { name: "Dm7b5", notes: ["D", "F", "Ab", "C"] },
    { name: "G7", notes: ["G", "B", "D", "F"] },
    { name: "Cm6", notes: ["C", "Eb", "G", "Bb"] },
    { name: "G7", notes: ["G", "B", "D", "F"] },
];

// Enharmonic equivalents
const enharmonicMap = {
    "C#": "Db", "Db": "C#",
    "D#": "Eb", "Eb": "D#",
    "F#": "Gb", "Gb": "F#",
    "G#": "Ab", "Ab": "G#",
    "A#": "Bb", "Bb": "A#"
};

function standardizeNoteName(note) {
    return enharmonicMap[note] || note;
}

async function startListening() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    source.connect(analyser);
    analyser.fftSize = 2048;

    const bufferLength = analyser.fftSize;
    const dataArray = new Float32Array(bufferLength);

    function detectPitch() {
        analyser.getFloatTimeDomainData(dataArray);
        const pitch = detectPitchFromDataArray(dataArray, audioContext.sampleRate);
        return pitch;
    }

    function detectPitchFromDataArray(dataArray, sampleRate) {
        // Implement pitch detection algorithm (e.g., autocorrelation)
        // For simplicity, consider using a library like ml5.js's pitch detection
        // which wraps the CREPE model: https://learn.ml5js.org/#/reference/pitch-detection
        return "C"; // Placeholder value
    }

    return detectPitch;
}

function updateUI(chord, scaleDegrees) {
    document.getElementById('chord-name').textContent = chord;
    scaleDegrees.forEach((degree, i) => {
        const degreeElem = document.getElementById(`degree-${i + 1}`);
        degreeElem.classList.remove('played');
        degreeElem.textContent = degree;
    });
}

function markScaleDegree(index) {
    const degreeElem = document.getElementById(`degree-${index + 1}`);
    degreeElem.classList.add('played');
}

async function playChords(chords) {
    const detectPitch = await startListening();

    for (let { name, notes } of chords) {
        updateUI(name, notes.map((_, i) => i + 1));

        for (let i = 0; i < notes.length; i++) {
            const expectedNote = standardizeNoteName(notes[i]);

            while (true) {
                const playedNote = detectPitch();

                if (playedNote === expectedNote) {
                    markScaleDegree(i);
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
    }
}

playChords(chords);
