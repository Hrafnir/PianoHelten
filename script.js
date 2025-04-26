// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
const songSelector = document.getElementById('songSelector');
const bpmInputElement = document.getElementById('bpmInput');
const originalBpmSpan = document.getElementById('originalBpm');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const volumeSlider = document.getElementById('volumeSlider'); // NY
const muteCheckbox = document.getElementById('muteCheckbox'); // NY

const availableSongs = {
    "twinkle_twinkle.json": "Twinkle Twinkle Little Star",
    "pink_panther_melody.json": "Pink Panther (Melody)"
    // Legg til flere sanger her etterhvert
};
const songsFolderPath = 'songs/';

let currentSong = null;
let currentPlaybackBPM = 100;
let isPlaying = false;
let animationFrameId = null;
let startTime = 0; // Visual start time (performance.now)
let activeKeys = new Set();

// --- Web Audio API Variabler ---
let audioContext = null;
let masterGainNode = null;
let isAudioInitialized = false; // Flag to check if context is created
let currentVolume = 0.7; // Default volume matching slider
let isMuted = false;
let scheduledAudioSources = []; // Holder styr på kilder for å kunne stoppe dem

// --- Piano og Spill Konstanter ---
const keyInfo = [
    { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 },
    { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 },
    { name: "E4", type: "white", xOffset: 2 },
    { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 },
    { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 },
    { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 },
    { name: "B4", type: "white", xOffset: 6 },
    { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 },
    { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 },
    { name: "E5", type: "white", xOffset: 9 },
    { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 },
    { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 },
    { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 },
    { name: "B5", type: "white", xOffset: 13 },
    { name: "C6", type: "white", xOffset: 14 }
];
const pianoHeight = 120;
const blackKeyWidthRatio = 0.6;
const blackKeyHeight = pianoHeight * 0.6;
const keyMapping = {};

const PRE_ROLL_SECONDS = 3;
const NOTE_FALL_SECONDS = 6;
const KEY_HIGHLIGHT_COLOR = 'rgba(255, 50, 50, 0.7)';
const WHITE_NOTE_COLOR = 'cyan';
const BLACK_NOTE_COLOR = 'magenta';
const KEY_NAME_FONT = '11px sans-serif';
const KEY_NAME_COLOR_WHITE = 'black';
const KEY_NAME_COLOR_BLACK = 'white';

// Frekvensmapping (A4 = 440 Hz)
const A4_FREQ = 440.0;
const A4_MIDI_NUM = 69; // MIDI nummer for A4
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===

// === 2: INITIALISERING START ===
function initialize() {
    console.log("Initialiserer Piano Hero...");
    setupCanvas();
    buildKeyMapping();
    drawPiano();
    populateSongSelector();
    setupEventListeners();
    resetUI();
    // Ikke initialiser AudioContext her, vent på brukerinteraksjon (første Play)
}
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
// Ingen endring her
function setupCanvas() {
    const container = document.querySelector('.game-area');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    console.log(`Canvas satt opp: ${canvas.width}x${canvas.height}`);
    buildKeyMapping();
}
window.addEventListener('resize', () => {
    setupCanvas();
    activeKeys.clear();
    drawPiano();
});
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    songSelector.addEventListener('change', handleSongSelect);
    bpmInputElement.addEventListener('change', handleBpmChange);
    playButton.addEventListener('click', togglePlayback);
    volumeSlider.addEventListener('input', handleVolumeChange); // NY
    muteCheckbox.addEventListener('change', handleMuteToggle); // NY
}

function populateSongSelector() { /* Ingen endring */ }
function resetUI() { /* Ingen endring */ }
function handleSongSelect() { /* Ingen endring */ }
function handleBpmChange() { /* Ingen endring */ }

// --- NYE Handlers for Lydkontroll ---
function handleVolumeChange() {
    currentVolume = parseFloat(volumeSlider.value);
    if (masterGainNode) {
        if (!isMuted) {
            // Sett volumet umiddelbart
            masterGainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime);
        }
        console.log(`Volum satt til: ${currentVolume.toFixed(2)}`);
    }
}

function handleMuteToggle() {
    isMuted = muteCheckbox.checked;
    if (masterGainNode) {
        if (isMuted) {
            // Sett gain til 0 umiddelbart
            masterGainNode.gain.setValueAtTime(0, audioContext.currentTime);
            console.log("Lyd Muted");
        } else {
            // Sett gain tilbake til lagret volum
            masterGainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime);
            console.log("Lyd Unmuted");
        }
    }
}
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
// Ingen endring i disse funksjonene
function buildKeyMapping() { /* ... */ }
function drawPiano() { /* ... */ }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() {
    if (!currentSong) return;

    // *** Initialiser AudioContext ved første brukerinteraksjon (klikk på Play) ***
    if (!isAudioInitialized) {
        initAudio();
    }
    // *** Prøv å gjenoppta AudioContext hvis den er suspended ***
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
             console.log("AudioContext resumed successfully.");
             // Fortsett med play/pause logikk etter resume
             if (isPlaying) {
                 stopSoundPlayback(); // Stopp lyden først
                 pauseSongVisuals(); // Stopp det visuelle
             } else {
                 playSong(); // Start både lyd og bilde
             }
        }).catch(e => console.error("Error resuming AudioContext:", e));
    } else {
        // Hvis AudioContext allerede kjører, fortsett som normalt
        if (isPlaying) {
            stopSoundPlayback();
            pauseSongVisuals();
        } else {
            playSong();
        }
    }
}


function playSong() {
    if (!currentSong || !audioContext) return; // Sjekk at audioContext finnes

    isPlaying = true;
    playButton.textContent = "Stopp"; // Endret navn
    bpmInputElement.disabled = true;
    songSelector.disabled = true;

    // Visuell start
    startTime = performance.now() + PRE_ROLL_SECONDS * 1000;
    console.log(`Starter avspilling (BPM: ${currentPlaybackBPM}) med ${PRE_ROLL_SECONDS}s pre-roll...`);
    if (!animationFrameId) {
        gameLoop();
    }

    // Lyd start - Planlegg alle noter
    scheduleSongAudio();
}

// Egen funksjon for å stoppe/pause det visuelle
function pauseSongVisuals() {
    isPlaying = false;
    playButton.textContent = "Spill av";
    bpmInputElement.disabled = false;
    songSelector.disabled = false;

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    activeKeys.clear();
    drawPiano(); // Tegn piano i stoppet tilstand
    console.log("Visuell avspilling stoppet.");
}

function resetPlayback() {
    // Stopper visuelle elementer
    pauseSongVisuals();
    // Stopper lyd
    stopSoundPlayback();

    // Generell nullstilling (som før, men uten lydstopp her)
    startTime = 0;
    activeKeys.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPiano();
    console.log("Avspilling nullstilt.");
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE START ===
// Ingen endring her
function gameLoop() { /* ... */ }
// === 7: ANIMASJONSLØKKE SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
// Ingen endring her
function drawFallingNotes(currentBeat) { /* ... */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===

// === 9: START PROGRAMMET START ===
initialize();
// === 9: START PROGRAMMET SLUTT ===

// === 10: WEB AUDIO FUNKSJONER START ===

// Initialiserer Web Audio API
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();
        masterGainNode.connect(audioContext.destination);

        // Sett initiell volum/mute status
        currentVolume = parseFloat(volumeSlider.value);
        isMuted = muteCheckbox.checked;
        masterGainNode.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioContext.currentTime);

        isAudioInitialized = true;
        console.log("AudioContext initialisert.");
    } catch (e) {
        console.error("Web Audio API støttes ikke i denne nettleseren.", e);
        alert("Beklager, nettleseren din støtter ikke lyden som trengs for denne appen.");
    }
}

// Konverterer notenavn (f.eks. "C#4") til frekvens (Hz)
function noteToFrequency(noteName) {
    const octave = parseInt(noteName.slice(-1));
    const key = noteName.slice(0, -1);
    const keyIndex = noteNames.indexOf(key);

    if (keyIndex < 0) {
        console.warn(`Ukjent notenavn: ${noteName}`);
        return null; // Returner null ved ukjent note
    }

    const midiNum = 12 + (octave * 12) + keyIndex;
    const freq = Math.pow(2, (midiNum - A4_MIDI_NUM) / 12) * A4_FREQ;
    return freq;
}

// Planlegger avspilling av hele sangen
function scheduleSongAudio() {
    if (!currentSong || !audioContext || !masterGainNode) return;

    stopSoundPlayback(); // Stopp eventuelle tidligere lyder først

    const audioStartTimeOffset = audioContext.currentTime + PRE_ROLL_SECONDS;
    const secondsPerBeat = 60.0 / currentPlaybackBPM;

    currentSong.notes.forEach(note => {
        const freq = noteToFrequency(note.key);
        if (freq === null) return; // Hopp over hvis notenavn er ugyldig

        const noteStartAudioTime = audioStartTimeOffset + (note.time * secondsPerBeat);
        const noteEndAudioTime = noteStartAudioTime + (note.duration * secondsPerBeat);

        // Lag oscillator (lydgenerator)
        const osc = audioContext.createOscillator();
        osc.type = 'triangle'; // Type bølgeform (sine, square, sawtooth, triangle)
        osc.frequency.setValueAtTime(freq, audioContext.currentTime); // Sett frekvens umiddelbart

        // Lag gain node for denne spesifikke noten (for volumkontroll/envelope)
        const noteGain = audioContext.createGain();
        noteGain.gain.setValueAtTime(0, audioContext.currentTime); // Start med volum 0

        // Koble sammen: oscillator -> noteGain -> masterGain -> høyttalere
        osc.connect(noteGain);
        noteGain.connect(masterGainNode);

        // Planlegg volumendringer for attack/decay (enkel versjon)
        const attackTime = 0.01; // Kort attack
        const releaseTime = 0.05; // Kort release
        const peakVolume = 0.8; // Maks volum for en enkelt note (juster etter smak)

        noteGain.gain.linearRampToValueAtTime(peakVolume, noteStartAudioTime + attackTime);
        // Hold volumet til slutten, start fade ut litt før
         noteGain.gain.setValueAtTime(peakVolume, noteEndAudioTime - releaseTime);
         noteGain.gain.linearRampToValueAtTime(0, noteEndAudioTime);


        // Planlegg start og stopp av oscillatoren
        osc.start(noteStartAudioTime);
        osc.stop(noteEndAudioTime + 0.1); // Stopp litt etter at volumet er 0

        // Legg til i listen over kilder for å kunne stoppe manuelt
        scheduledAudioSources.push({ oscillator: osc, gain: noteGain });
    });
    console.log(`Planlagt ${currentSong.notes.length} noter for avspilling.`);
}

// Stopper all pågående og planlagt lyd umiddelbart
function stopSoundPlayback() {
    if (!audioContext || !masterGainNode) return;

     console.log(`Stopper ${scheduledAudioSources.length} lydkilder...`);
    // Stopp alle aktive oscillatorer
    scheduledAudioSources.forEach(source => {
        try {
            // Ramp ned volumet på note-gain raskt for å unngå klikk
            source.gain.gain.cancelScheduledValues(audioContext.currentTime);
            source.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05);
            // Stopp oscillatoren litt etterpå
            source.oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Ignorer feil hvis kilden allerede er stoppet
            // console.warn("Kunne ikke stoppe en lydkilde (kanskje allerede stoppet):", e);
        }
    });

    // Tøm listen over kilder
    scheduledAudioSources = [];
    console.log("Alle lydkilder stoppet og listen tømt.");

    // Alternativt, for en hardere stopp:
    // masterGainNode.gain.cancelScheduledValues(audioContext.currentTime);
    // masterGainNode.gain.setValueAtTime(0, audioContext.currentTime);
}

// === 10: WEB AUDIO FUNKSJONER SLUTT ===
