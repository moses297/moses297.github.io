let audioContext;
let analyser;
let microphone;
let bufferLength;
let dataArray;

// Initialize AudioContext and Analyser
function initializeAudio() {
    return new Promise((resolve, reject) => {
        if (audioContext) {
            resolve();
            return;
        }

        audioContext = new AudioContext();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 4096;  // Increase fftSize for better frequency resolution
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

// Apply a window function to reduce spectral leakage
function applyWindowFunction(dataArray) {
    const size = dataArray.length;
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1))); // Hanning window
    }
    for (let i = 0; i < size; i++) {
        dataArray[i] *= window[i];
    }
}

// Detect pitch using FFT
function detectPitchFromDataArray(dataArray, sampleRate) {
    applyWindowFunction(dataArray);
    analyser.getFloatFrequencyData(dataArray);

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

// Get note name from frequency
function getNoteName(freq) {
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    if (freq <= 0) return null;

    const h = Math.round(12 * Math.log2(freq / C0));
    const n = (h + 120) % 12; // normalize to within range
    const octave = Math.floor(h / 12) - 1;
    return `${noteNames[n]}${octave}`;
}

// Main loop to continuously check audio input
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
