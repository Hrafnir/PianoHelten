console.log("--- SCRIPT.JS START (v. Minimal Test 2) ---");

// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
// ... (Alle variabler og konstanter som i forrige komplette versjon) ...
const tabButtonPlay = document.getElementById('tabButtonPlay'); const tabButtonRecord = document.getElementById('tabButtonRecord'); const playArea = document.getElementById('playArea'); const recordArea = document.getElementById('recordArea');
const songSelector = document.getElementById('songSelector'); const bpmInputElement = document.getElementById('bpmInput'); const originalBpmSpan = document.getElementById('originalBpm'); const playButton = document.getElementById('playButton'); const songInfoDiv = document.getElementById('songInfo'); const gameCanvas = document.getElementById('gameCanvas'); const gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null; const volumeSlider = document.getElementById('volumeSlider'); const muteCheckbox = document.getElementById('muteCheckbox');
const recordTitleInput = document.getElementById('recordTitle'); const recordArtistInput = document.getElementById('recordArtist'); const recordTempoInput = document.getElementById('recordTempo'); const recordModeSelector = document.getElementById('recordModeSelector'); const startRecordButton = document.getElementById('startRecordButton'); const stopRecordButton = document.getElementById('stopRecordButton'); const clearRecordButton = document.getElementById('clearRecordButton'); const stepModeControls = document.getElementById('stepModeControls'); const stepDurationSelector = document.getElementById('stepDurationSelector'); const addStepNoteButton = document.getElementById('addStepNoteButton'); const addRestButton = document.getElementById('addRestButton'); const realtimeModeControls = document.getElementById('realtimeModeControls'); const quantizeSelector = document.getElementById('quantizeSelector'); const recordingStatusSpan = document.getElementById('recordingStatus'); const recordPianoCanvas = document.getElementById('recordPianoCanvas'); const recordPianoCtx = recordPianoCanvas ? recordPianoCanvas.getContext('2d') : null; const jsonOutputTextarea = document.getElementById('jsonOutput'); const copyJsonButton = document.getElementById('copyJsonButton');
const availableSongs = { "twinkle_twinkle.json": "Twinkle Twinkle Little Star", "pink_panther_theme.json": "Pink Panther Theme", "odetojoy.json": "Ode to Joy (Beethoven)" };
const songsFolderPath = 'songs/'; let currentSong = null; let currentPlaybackBPM = 100; let isPlaying = false; let animationFrameId = null; let playbackStartTime = 0; let activeKeys = new Set();
let audioContext = null; let masterGainNode = null; let isAudioInitialized = false; let currentVolume = 0.7; let isMuted = false; let scheduledAudioSources = [];
let isRecording = false; let recordingMode = 'realtime'; let recordingStartTime = 0; let recordedRawNotes = []; let recordedNotes = []; let currentStepTime = 0; let selectedStepNote = null;
const keyInfo = [ { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 }, { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 }, { name: "E4", type: "white", xOffset: 2 }, { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 }, { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 }, { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 }, { name: "B4", type: "white", xOffset: 6 }, { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 }, { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 }, { name: "E5", type: "white", xOffset: 9 }, { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 }, { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 }, { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 }, { name: "B5", type: "white", xOffset: 13 }, { name: "C6", type: "white", xOffset: 14 } ];
const PIANO_HEIGHT_PLAY = 120; const PIANO_HEIGHT_RECORD = 150; const blackKeyWidthRatio = 0.6; const blackKeyHeightRatio = 0.6; const keyMappingPlay = {}; const keyMappingRecord = {};
const PRE_ROLL_SECONDS = 3; const NOTE_FALL_SECONDS = 6; const KEY_HIGHLIGHT_COLOR = 'rgba(255, 80, 80, 0.75)'; const WHITE_NOTE_COLOR = '#3498db'; const BLACK_NOTE_COLOR = '#f1c40f'; const NOTE_BORDER_COLOR = 'rgba(0, 0, 0, 0.3)'; const NOTE_CORNER_RADIUS = 8; const KEY_NAME_FONT = '11px sans-serif'; const KEY_NAME_COLOR_WHITE = 'black'; const KEY_NAME_COLOR_BLACK = 'white'; const RECORD_KEY_HIGHLIGHT_COLOR = 'rgba(52, 152, 219, 0.8)';
const A4_FREQ = 440.0; const A4_MIDI_NUM = 69; const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
console.log("--- Globale konstanter/variabler definert ---");
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===


// === 2: INITIALISERING START ===
function initialize() {
    console.log("--- INITIALIZE START ---");
    try {
        if (!gameCanvas || !recordPianoCanvas) { console.error("FEIL: Canvas-element(er) ikke funnet FØR oppsett!"); return; } // Ekstra sjekk
        console.log("Initializer: Kaller setupCanvases..."); setupCanvases();
        console.log("Initializer: Kaller buildKeyMappings..."); buildKeyMappings();
        console.log("Initializer: Kaller drawPianos..."); drawPianos();
        console.log("Initializer: Kaller populateSongSelector..."); populateSongSelector();
        console.log("Initializer: Kaller setupEventListeners..."); setupEventListeners();
        console.log("Initializer: Kaller resetUI..."); resetUI();
        console.log("Initializer: Kaller switchTab('play')..."); switchTab('play');
        console.log("Initializer: Kaller updateRecordModeUI..."); updateRecordModeUI();
        console.log("--- INITIALIZE FERDIG ---");
    } catch (error) { console.error("!!! FEIL UNDER INITIALISERING !!!", error); }
}
// === 2: INITIALISERING SLUTT ===


// === 3: CANVAS OPPSETT START ===
function setupCanvases() { /* ... Som før ... */ }
window.addEventListener('resize', () => { /* ... Som før ... */ });
// === 3: CANVAS OPPSETT SLUTT ===


// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    console.log("--- setupEventListeners START (v. Direkte + Logg Element) ---");

    // Funksjon for å trygt legge til listener (beholdes for ryddighet)
    function safeAddListener(element, eventType, handler, elementName) {
        if (element) {
            element.addEventListener(eventType, handler);
        } else {
            console.error(`FEIL: Kunne ikke finne elementet '${elementName}' for å legge til listener!`);
        }
    }

    // --- Faner ---
    // Play-knapp (vi vet denne funker, logger for sammenligning)
    console.log("tabButtonPlay element:", tabButtonPlay); // Logg elementet
    safeAddListener(tabButtonPlay, 'click', () => {
        console.log("--- tabButtonPlay CLICKED! ---");
        switchTab('play');
    }, 'tabButtonPlay');

    // Record-knapp (den som feiler)
    console.log("tabButtonRecord element:", tabButtonRecord); // *** LOGG DETTE ELEMENTET ***
    safeAddListener(tabButtonRecord, 'click', () => {
         console.log("--- tabButtonRecord CLICKED! ---"); // Bør se denne hvis klikk virker
         switchTab('record');
    }, 'tabButtonRecord');

    // *** EKSTRA TEST: Mouseover listener for record-knappen ***
    safeAddListener(tabButtonRecord, 'mouseover', () => {
        console.log("--- tabButtonRecord MOUSEOVER! (Test Listener) ---");
    }, 'tabButtonRecord (mouseover test)');
    // *** SLUTT PÅ EKSTRA TEST ***


    // --- Resten av listenerne ---
    safeAddListener(songSelector, 'change', handleSongSelect, 'songSelector');
    safeAddListener(bpmInputElement, 'change', handlePlaybackBpmChange, 'bpmInputElement');
    safeAddListener(playButton, 'click', togglePlayback, 'playButton');
    safeAddListener(volumeSlider, 'input', handleVolumeChange, 'volumeSlider');
    safeAddListener(muteCheckbox, 'change', handleMuteToggle, 'muteCheckbox');
    safeAddListener(recordModeSelector, 'change', handleRecordModeChange, 'recordModeSelector');
    safeAddListener(startRecordButton, 'click', startRecording, 'startRecordButton');
    safeAddListener(stopRecordButton, 'click', stopRecording, 'stopRecordButton');
    safeAddListener(clearRecordButton, 'click', clearRecording, 'clearRecordButton');
    safeAddListener(addStepNoteButton, 'click', addStepNote, 'addStepNoteButton');
    safeAddListener(addRestButton, 'click', addStepRest, 'addRestButton');
    safeAddListener(copyJsonButton, 'click', copyJsonToClipboard, 'copyJsonButton');
    safeAddListener(recordPianoCanvas, 'mousedown', handleRecordPianoMouseDown, 'recordPianoCanvas');
    safeAddListener(recordPianoCanvas, 'mouseup', handleRecordPianoMouseUp, 'recordPianoCanvas');

    console.log("--- setupEventListeners FERDIG (v. Direkte + Logg Element) ---");
}
function switchTab(tabName) { /* ... Som før ... */ }
function updateRecordModeUI() { /* ... Som før ... */ }
function populateSongSelector() { /* ... Som før ... */ }
function resetUI() { /* ... Som før ... */ }
function handleSongSelect(event) { /* ... Som før ... */ }
function handlePlaybackBpmChange(event) { /* ... Som før ... */ }
function handleVolumeChange() { /* ... Som før ... */ }
function handleMuteToggle() { /* ... Som før ... */ }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMappings() { /* ... Som før ... */ }
function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) { /* ... Som før ... */ }
function drawPianos() { /* ... Som før ... */ }
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) { /* ... Som før ... */ }
function drawRecordPiano() { /* ... Som før ... */ }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
async function ensureAudioInitialized() { /* ... Som før ... */ }
async function togglePlayback() { /* ... Som før ... */ }
function playSong() { /* ... Som før ... */ }
function pauseSongVisuals() { /* ... Som før ... */ }
function resetPlayback() { /* ... Som før ... */ }
// === 6: AVSPILLINGS KONTROLL SLUTT ===


// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() { /* ... Som før ... */ }
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) { /* ... Som før ... */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
console.log("--- Kjører initialize() direkte ---");
// *** Ekstra sjekk FØR initialize kalles ***
console.log("Sjekker nøkkelelementer før init:", {
    tabButtonPlay: !!document.getElementById('tabButtonPlay'),
    songSelector: !!document.getElementById('songSelector'),
    gameCanvas: !!document.getElementById('gameCanvas'),
    recordPianoCanvas: !!document.getElementById('recordPianoCanvas')
});
initialize(); // *** Kaller direkte, ikke via DOMContentLoaded ***
console.log("--- SCRIPT.JS SLUTT ---");
// document.addEventListener('DOMContentLoaded', initialize); // Kommentert ut
// === 9: START PROGRAMMET SLUTT ===


// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() { /* ... Som før ... */ }
function noteToFrequency(noteName) { /* ... Som før ... */ }
function scheduleSongAudio() { /* ... Som før (med forenklet test) ... */ }
function stopSoundPlayback() { /* ... Som før ... */ }
function playFeedbackTone(noteName) { /* ... Som før ... */ }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===


// === 11: INNSPILINGSFUNKSJONER START ===
function handleRecordModeChange() { /* ... Som før ... */ }
function getKeyAtRecordCoords(canvas, event) { /* ... Som før ... */ }
async function handleRecordPianoMouseDown(event) { /* ... Som før ... */ }
function handleRecordPianoMouseUp(event) { /* ... Som før ... */ }
function startRecording() { /* ... Som før ... */ }
function stopRecording() { /* ... Som før ... */ }
function clearRecording() { /* ... Som før ... */ }
function quantizeRecordedNotes() { /* ... Som før (plassholder) ... */ }
function addStepNote() { /* ... Som før ... */ }
function addStepRest() { /* ... Som før ... */ }
function generateJsonOutput() { /* ... Som før ... */ }
function copyJsonToClipboard() { /* ... Som før ... */ }
// === 11: INNSPILINGSFUNKSJONER SLUTT ===
