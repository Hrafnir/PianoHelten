console.log("--- SCRIPT.JS START ---"); // LOG 1: Ser vi dette i det hele tatt?

// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
let testVariable = "OK"; // Bare en enkel variabel
console.log("--- Globale variable (test) satt ---", testVariable); // LOG 2

const tabButtonPlay = document.getElementById('tabButtonPlay');
// ... (resten av getElementById-kallene som før)
const tabButtonRecord = document.getElementById('tabButtonRecord');
const playArea = document.getElementById('playArea');
const recordArea = document.getElementById('recordArea');
const songSelector = document.getElementById('songSelector');
const bpmInputElement = document.getElementById('bpmInput');
const originalBpmSpan = document.getElementById('originalBpm');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const gameCanvas = document.getElementById('gameCanvas');
// *** VIKTIG: Hent context KUN hvis canvas finnes ***
const gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;
const volumeSlider = document.getElementById('volumeSlider');
const muteCheckbox = document.getElementById('muteCheckbox');
const recordTitleInput = document.getElementById('recordTitle');
const recordArtistInput = document.getElementById('recordArtist');
const recordTempoInput = document.getElementById('recordTempo');
const recordModeSelector = document.getElementById('recordModeSelector');
const startRecordButton = document.getElementById('startRecordButton');
const stopRecordButton = document.getElementById('stopRecordButton');
const clearRecordButton = document.getElementById('clearRecordButton');
const stepModeControls = document.getElementById('stepModeControls');
const stepDurationSelector = document.getElementById('stepDurationSelector');
const addStepNoteButton = document.getElementById('addStepNoteButton');
const addRestButton = document.getElementById('addRestButton');
const realtimeModeControls = document.getElementById('realtimeModeControls');
const quantizeSelector = document.getElementById('quantizeSelector');
const recordingStatusSpan = document.getElementById('recordingStatus');
const recordPianoCanvas = document.getElementById('recordPianoCanvas');
// *** VIKTIG: Hent context KUN hvis canvas finnes ***
const recordPianoCtx = recordPianoCanvas ? recordPianoCanvas.getContext('2d') : null;
const jsonOutputTextarea = document.getElementById('jsonOutput');
const copyJsonButton = document.getElementById('copyJsonButton');

console.log("--- Globale element-referanser hentet ---"); // LOG 3

// --- Felles/Avspillingstilstand ---
const availableSongs = { "twinkle_twinkle.json": "Twinkle Twinkle Little Star", "pink_panther_theme.json": "Pink Panther Theme" };
const songsFolderPath = 'songs/';
let currentSong = null; let currentPlaybackBPM = 100; let isPlaying = false; let animationFrameId = null; let playbackStartTime = 0; let activeKeys = new Set();
// --- Lydtilstand ---
let audioContext = null; let masterGainNode = null; let isAudioInitialized = false; let currentVolume = 0.7; let isMuted = false; let scheduledAudioSources = [];
// --- Innspillingstilstand ---
let isRecording = false; let recordingMode = 'realtime'; let recordingStartTime = 0; let recordedRawNotes = []; let recordedNotes = []; let currentStepTime = 0; let selectedStepNote = null;
// --- Piano Konstanter ---
const keyInfo = [ { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 }, { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 }, { name: "E4", type: "white", xOffset: 2 }, { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 }, { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 }, { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 }, { name: "B4", type: "white", xOffset: 6 }, { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 }, { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 }, { name: "E5", type: "white", xOffset: 9 }, { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 }, { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 }, { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 }, { name: "B5", type: "white", xOffset: 13 }, { name: "C6", type: "white", xOffset: 14 } ];
const PIANO_HEIGHT_PLAY = 120; const PIANO_HEIGHT_RECORD = 150; const blackKeyWidthRatio = 0.6; const blackKeyHeightRatio = 0.6; const keyMappingPlay = {}; const keyMappingRecord = {};
// --- Spill Konstanter ---
const PRE_ROLL_SECONDS = 3; const NOTE_FALL_SECONDS = 6; const KEY_HIGHLIGHT_COLOR = 'rgba(255, 80, 80, 0.75)'; const WHITE_NOTE_COLOR = '#3498db'; const BLACK_NOTE_COLOR = '#f1c40f'; const NOTE_BORDER_COLOR = 'rgba(0, 0, 0, 0.3)'; const NOTE_CORNER_RADIUS = 8; const KEY_NAME_FONT = '11px sans-serif'; const KEY_NAME_COLOR_WHITE = 'black'; const KEY_NAME_COLOR_BLACK = 'white'; const RECORD_KEY_HIGHLIGHT_COLOR = 'rgba(52, 152, 219, 0.8)';
// --- Lyd Konstanter ---
const A4_FREQ = 440.0; const A4_MIDI_NUM = 69; const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===


// === 2: INITIALISERING START ===
function initialize() {
    console.log("--- INITIALIZE START ---"); // LOG 4: Kommer vi hit?

    // Kjør KUN de mest nødvendige funksjonene for å se om de feiler
    try {
        console.log("Initializer: Kaller setupCanvases...");
        setupCanvases();
        console.log("Initializer: Kaller buildKeyMappings...");
        buildKeyMappings();
        console.log("Initializer: Kaller drawPianos...");
        drawPianos(); // Draw initial state
        console.log("Initializer: Kaller populateSongSelector...");
        populateSongSelector();
         console.log("Initializer: Kaller setupEventListeners...");
        setupEventListeners();
         console.log("Initializer: Kaller resetUI...");
        resetUI(); // Set initial UI state for play tab
        console.log("Initializer: Kaller switchTab('play')...");
        switchTab('play'); // Start on play tab
        console.log("Initializer: Kaller updateRecordModeUI...");
        updateRecordModeUI(); // Set initial state for record controls
         console.log("--- INITIALIZE FERDIG ---"); // LOG 5: Fullførte initialize?
    } catch (error) {
        console.error("!!! FEIL UNDER INITIALISERING !!!", error); // LOG Feil under init
    }
}
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
function setupCanvases() {
    // ... (som før, med logging) ...
    const playContainer = document.querySelector('.game-area'); if (playContainer && gameCanvas) { gameCanvas.width = playContainer.clientWidth; gameCanvas.height = playContainer.clientHeight; } else { console.error("Fant ikke .game-area eller gameCanvas"); }
    const recordContainer = document.querySelector('.record-piano-area'); if (recordContainer && recordPianoCanvas) { recordPianoCanvas.width = recordContainer.clientWidth; recordPianoCanvas.height = PIANO_HEIGHT_RECORD; } else { console.error("Fant ikke .record-piano-area eller recordPianoCanvas"); }
    console.log(`Canvas satt opp: Game=${gameCanvas?.width}x${gameCanvas?.height}, Record=${recordPianoCanvas?.width}x${recordPianoCanvas?.height}`); // Bruk optional chaining
}
window.addEventListener('resize', () => { setupCanvases(); buildKeyMappings(); drawPianos(); });
// === 3: CANVAS OPPSETT SLUTT ===


// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
// --- La resten av funksjonene være som i forrige svar, MED loggingen ---
function setupEventListeners() { /* ... som før ... */ }
function switchTab(tabName) { /* ... som før ... */ }
function updateRecordModeUI() { /* ... som før ... */ }
function populateSongSelector() { /* ... som før ... */ }
function resetUI() { /* ... som før ... */ }
function handleSongSelect(event) { /* ... som før ... */ }
function handlePlaybackBpmChange(event) { /* ... som før ... */ }
function handleVolumeChange() { /* ... som før ... */ }
function handleMuteToggle() { /* ... som før ... */ }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===


// === 5: PIANO TEGNING OG KEY MAPPING START ===
// --- La resten av funksjonene være som i forrige svar, MED loggingen ---
function buildKeyMappings() { /* ... som før ... */ }
function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) { /* ... som før ... */ }
function drawPianos() { /* ... som før ... */ }
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) { /* ... som før ... */ }
function drawRecordPiano() { /* ... som før ... */ }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
// --- La resten av funksjonene være som i forrige svar, MED loggingen ---
async function ensureAudioInitialized() { /* ... som før ... */ }
async function togglePlayback() { /* ... som før ... */ }
function playSong() { /* ... som før ... */ }
function pauseSongVisuals() { /* ... som før ... */ }
function resetPlayback() { /* ... som før ... */ }
// === 6: AVSPILLINGS KONTROLL SLUTT ===


// === 7: ANIMASJONSLØKKE (Avspilling) START ===
// --- La resten av funksjonene være som i forrige svar, MED loggingen ---
function gameLoop() { /* ... som før ... */ }
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
// --- La resten av funksjonene være som i forrige svar, MED loggingen ---
function drawFallingNotes(currentBeat) { /* ... som før ... */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
// *** Prøv å kjøre initialize() ETTER at hele siden er lastet ***
// window.addEventListener('load', initialize); // Alternativ 1
// Eller mer moderne:
document.addEventListener('DOMContentLoaded', initialize); // Alternativ 2
console.log("--- SCRIPT.JS SLUTT (Venter på DOMContentLoaded for initialize) ---"); // LOG 6
// initialize(); // Kommenter ut den direkte kallet
// === 9: START PROGRAMMET SLUTT ===


// === 10: WEB AUDIO FUNKSJONER START ===
// --- La resten av funksjonene være som i forrige svar, MED loggingen ---
function initAudio() { /* ... som før ... */ }
function noteToFrequency(noteName) { /* ... som før ... */ }
function scheduleSongAudio() { /* ... som før (med forenklet test) ... */ }
function stopSoundPlayback() { /* ... som før ... */ }
function playFeedbackTone(noteName) { /* ... som før ... */ }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===


// === 11: INNSPILINGSFUNKSJONER START ===
// --- La resten av funksjonene være som i forrige svar, MED loggingen ---
function handleRecordModeChange() { /* ... som før ... */ }
function getKeyAtRecordCoords(canvas, event) { /* ... som før ... */ }
async function handleRecordPianoMouseDown(event) { /* ... som før ... */ }
function handleRecordPianoMouseUp(event) { /* ... som før ... */ }
function startRecording() { /* ... som før ... */ }
function stopRecording() { /* ... som før ... */ }
function clearRecording() { /* ... som før ... */ }
function quantizeRecordedNotes() { /* ... som før (plassholder) ... */ }
function addStepNote() { /* ... som før ... */ }
function addStepRest() { /* ... som før ... */ }
function generateJsonOutput() { /* ... som før ... */ }
function copyJsonToClipboard() { /* ... som før ... */ }
// === 11: INNSPILINGSFUNKSJONER SLUTT ===
