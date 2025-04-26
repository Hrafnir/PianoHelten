// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
// --- Faner ---
const tabButtonPlay = document.getElementById('tabButtonPlay');
const tabButtonRecord = document.getElementById('tabButtonRecord');
const playArea = document.getElementById('playArea');
const recordArea = document.getElementById('recordArea');

// --- Avspillingsområde ---
const songSelector = document.getElementById('songSelector');
const bpmInputElement = document.getElementById('bpmInput');
const originalBpmSpan = document.getElementById('originalBpm');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const volumeSlider = document.getElementById('volumeSlider');
const muteCheckbox = document.getElementById('muteCheckbox');

// --- Innspillingsområde ---
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
const recordPianoCtx = recordPianoCanvas.getContext('2d');
const jsonOutputTextarea = document.getElementById('jsonOutput');
const copyJsonButton = document.getElementById('copyJsonButton');

// --- Felles/Avspillingstilstand ---
const availableSongs = {
    "twinkle_twinkle.json": "Twinkle Twinkle Little Star",
    "pink_panther_theme.json": "Pink Panther Theme"
};
const songsFolderPath = 'songs/';
let currentSong = null;
let currentPlaybackBPM = 100;
let isPlaying = false;
let animationFrameId = null;
let playbackStartTime = 0;
let activeKeys = new Set();

// --- Lydtilstand ---
let audioContext = null;
let masterGainNode = null;
let isAudioInitialized = false;
let currentVolume = 0.7;
let isMuted = false;
let scheduledAudioSources = [];

// --- Innspillingstilstand ---
let isRecording = false;
let recordingMode = 'realtime';
let recordingStartTime = 0;
let recordedRawNotes = [];
let recordedNotes = [];
let currentStepTime = 0;
let selectedStepNote = null;

// --- Piano Konstanter ---
const keyInfo = [ { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 }, { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 }, { name: "E4", type: "white", xOffset: 2 }, { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 }, { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 }, { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 }, { name: "B4", type: "white", xOffset: 6 }, { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 }, { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 }, { name: "E5", type: "white", xOffset: 9 }, { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 }, { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 }, { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 }, { name: "B5", type: "white", xOffset: 13 }, { name: "C6", type: "white", xOffset: 14 } ];
const PIANO_HEIGHT_PLAY = 120;
const PIANO_HEIGHT_RECORD = 150;
const blackKeyWidthRatio = 0.6;
const blackKeyHeightRatio = 0.6;
const keyMappingPlay = {};
const keyMappingRecord = {};

// --- Spill Konstanter ---
const PRE_ROLL_SECONDS = 3;
const NOTE_FALL_SECONDS = 6;
const KEY_HIGHLIGHT_COLOR = 'rgba(255, 80, 80, 0.75)';
const WHITE_NOTE_COLOR = '#3498db';
const BLACK_NOTE_COLOR = '#f1c40f';
const NOTE_BORDER_COLOR = 'rgba(0, 0, 0, 0.3)';
const NOTE_CORNER_RADIUS = 8;
const KEY_NAME_FONT = '11px sans-serif';
const KEY_NAME_COLOR_WHITE = 'black';
const KEY_NAME_COLOR_BLACK = 'white';
const RECORD_KEY_HIGHLIGHT_COLOR = 'rgba(52, 152, 219, 0.8)';

// --- Lyd Konstanter ---
const A4_FREQ = 440.0;
const A4_MIDI_NUM = 69;
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===

// === 2: INITIALISERING START ===
function initialize() {
    console.log("Initialiserer Piano Hero & Komponering...");
    setupCanvases();
    buildKeyMappings();
    drawPianos();
    populateSongSelector();
    setupEventListeners();
    resetUI();
    switchTab('play');
    updateRecordModeUI();
}
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
function setupCanvases() { /* ... som før ... */ }
window.addEventListener('resize', () => { /* ... som før ... */ });
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    // Faner
    tabButtonPlay.addEventListener('click', () => switchTab('play'));
    tabButtonRecord.addEventListener('click', () => switchTab('record'));

    // Avspilling
    songSelector.addEventListener('change', handleSongSelect); // Legg til log her hvis nødvendig
    bpmInputElement.addEventListener('change', handlePlaybackBpmChange);
    playButton.addEventListener('click', togglePlayback);
    volumeSlider.addEventListener('input', handleVolumeChange);
    muteCheckbox.addEventListener('change', handleMuteToggle);

    // Innspilling
    recordModeSelector.addEventListener('change', handleRecordModeChange);
    startRecordButton.addEventListener('click', startRecording); // Legg til log her hvis nødvendig
    stopRecordButton.addEventListener('click', stopRecording);
    clearRecordButton.addEventListener('click', clearRecording);
    addStepNoteButton.addEventListener('click', addStepNote);
    addRestButton.addEventListener('click', addStepRest);
    copyJsonButton.addEventListener('click', copyJsonToClipboard);
    recordPianoCanvas.addEventListener('mousedown', handleRecordPianoMouseDown); // Legg til log her hvis nødvendig
    recordPianoCanvas.addEventListener('mouseup', handleRecordPianoMouseUp);

    console.log("Event listeners satt opp.");
}

function switchTab(tabName) { /* ... som før ... */ }
function updateRecordModeUI() { /* ... som før ... */ }
function populateSongSelector() { /* ... som før ... */ }

// Dobbeltsjekk at songSelector *ikke* blir deaktivert her
function resetUI() {
    playButton.disabled = true; playButton.textContent = "Spill av";
    bpmInputElement.disabled = true; bpmInputElement.value = 100; originalBpmSpan.textContent = "";
    songInfoDiv.textContent = "Velg en sang fra menyen";
    songSelector.selectedIndex = 0;
    songSelector.disabled = false; // *** VIKTIG: Skal være false her ***
    console.log("UI resatt. songSelector disabled:", songSelector.disabled); // LOG
}

function handleSongSelect(event) { // event-objektet er nyttig
    console.log("--- handleSongSelect EVENT START ---"); // Logg start av event handler
    // event.target peker på <select>-elementet
    const selectedFilename = event.target.value;
    console.log("handleSongSelect: Valgt fil:", selectedFilename);

    activeKeys.clear();
    if (!selectedFilename) {
        console.log("handleSongSelect: Ingen fil valgt, nullstiller.");
        currentSong = null;
        resetUI();
        resetPlayback();
        drawPianos(); // Tegn begge (eller kun spillpiano hvis det er logisk)
        console.log("handleSongSelect: Nullstilling ferdig.");
        return;
    }

    console.log("handleSongSelect: Fil valgt, starter lasting...");
    const songPath = songsFolderPath + selectedFilename;
    console.log(`handleSongSelect: Forsøker å laste: ${songPath}`);
    songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`;
    playButton.disabled = true;
    bpmInputElement.disabled = true;
    songSelector.disabled = true; // Deaktiver KUN under lasting
    console.log("handleSongSelect: Kaller fetch (songSelector disabled: true)");

    fetch(songPath)
        .then(response => { /* ... som før ... */ })
        .then(data => { /* ... som før ... */ songSelector.disabled = false; console.log("handleSongSelect: lastet OK (songSelector disabled: false)"); resetPlayback(); })
        .catch(error => { /* ... som før ... */ songSelector.disabled = false; console.log("handleSongSelect: FEIL (songSelector disabled: false)"); resetPlayback(); });
    console.log("handleSongSelect: Fetch-kallet er startet (async).");
}
function handlePlaybackBpmChange(event) { /* ... som før ... */ }
function handleVolumeChange() { /* ... som før ... */ }
function handleMuteToggle() { /* ... som før ... */ }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
// Ingen endring i logikken her, men forrige log-meldinger beholdes.
function buildKeyMappings() { /* ... som før ... */ }
function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) { /* ... som før ... */ }
function drawPianos() { /* ... som før ... */ }
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) { /* ... som før ... */ }
function drawRecordPiano() { /* ... som før ... */ }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===

// === 6: AVSPILLINGS KONTROLL START ===
// Dobbeltsjekk at songSelector aktiveres korrekt ved stopp/pause
function togglePlayback() { /* ... som før ... */ }
function playSong() { /* ... som før ... */ }
function pauseSongVisuals() {
    console.log("pauseSongVisuals: Kjører.");
    isPlaying = false;
    playButton.textContent = "Spill av";
    bpmInputElement.disabled = false;
    songSelector.disabled = false; // *** VIKTIG: Aktiver her ***
    console.log("pauseSongVisuals: Stopper animasjonsløkke. ID:", animationFrameId, "songSelector disabled:", songSelector.disabled); // LOG
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; console.log("pauseSongVisuals: animationFrameId nullstilt."); } else { console.log("pauseSongVisuals: Ingen animationFrameId å stoppe."); }
    activeKeys.clear();
    drawPianos();
    console.log("pauseSongVisuals: Visuell avspilling stoppet.");
}
function resetPlayback() {
    console.log("resetPlayback: Kjører.");
    pauseSongVisuals(); // Kaller denne først, som aktiverer songSelector
    stopSoundPlayback();
    playbackStartTime = 0;

    // UI-status settes nå primært i pauseSongVisuals, sjekk bare currentSong her
    if (!currentSong) {
        playButton.disabled = true;
        bpmInputElement.disabled = true;
        console.log("resetPlayback: Ingen sang lastet, kontroller deaktivert (unntatt velger).");
    } else {
         playButton.disabled = false; // Behøver ikke sette bpm/selector, de er allerede enabled
         console.log("resetPlayback: Sang er lastet, kontroller aktivert.");
    }

    if (gameCtx) gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawPianos();
    console.log("resetPlayback: Avspilling nullstilt ferdig.");
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() { /* ... som før ... */ }
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) { /* ... som før ... */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===

// === 9: START PROGRAMMET START ===
initialize();
// === 9: START PROGRAMMET SLUTT ===

// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() { /* ... som før ... */ }
function noteToFrequency(noteName) { /* ... som før ... */ }
function scheduleSongAudio() { /* ... som før ... */ }
function stopSoundPlayback() { /* ... som før ... */ }
function playFeedbackTone(noteName) { /* ... som før ... */ }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===

// === 11: INNSPILINGSFUNKSJONER START ===
function handleRecordModeChange() { updateRecordModeUI(); }
function getKeyAtRecordCoords(canvas, event) { /* ... som før ... */ }

// *** Modifisert for lydinitiering og tydeligere logging ***
function handleRecordPianoMouseDown(event) {
     console.log("--- Record Piano MouseDown EVENT START ---"); // LOG Start
     // Initialiser lyd hvis nødvendig
     if (!isAudioInitialized) {
         console.log("handleRecordPianoMouseDown: Initialiserer AudioContext...");
         initAudio();
         if (!isAudioInitialized) {
             console.error("handleRecordPianoMouseDown: Kunne ikke initialisere AudioContext.");
             return; // Avbryt hvis lyd feiler
         }
     }
     // Fortsett selv om context var suspended, playFeedbackTone håndterer det implisitt
     if (audioContext && audioContext.state === 'suspended') {
         console.log("handleRecordPianoMouseDown: AudioContext suspended, forsøker resume...");
         audioContext.resume().catch(e => console.error("Resume feilet:", e));
     }

     const keyName = getKeyAtRecordCoords(recordPianoCanvas, event);
     console.log("handleRecordPianoMouseDown: getKeyAtRecordCoords returnerte:", keyName); // LOG Key
     if (!keyName) return;

     if (recordingMode === 'step' && !isRecording) {
         console.log("handleRecordPianoMouseDown: Steg-modus, setter selectedStepNote."); // LOG
         selectedStepNote = keyName;
         addStepNoteButton.disabled = false;
         drawRecordPiano();
     } else if (recordingMode === 'realtime' && isRecording) {
         console.log("handleRecordPianoMouseDown: Sanntidsmodus, starter note-timer (TODO)"); // LOG
         // TODO: Implementer lagring av starttid
     } else {
          console.log("handleRecordPianoMouseDown: Ingen handling for modus/status:", recordingMode, isRecording); // LOG
     }
     playFeedbackTone(keyName);
}

function handleRecordPianoMouseUp(event) { /* ... som før ... */ }

// *** Modifisert for tydeligere logging ***
function startRecording() {
    console.log("--- Start Recording Button Clicked ---"); // LOG Start
    if (isRecording) return;
    console.log(`Starter innspilling i ${recordingMode}-modus...`);
    isRecording = true;
    jsonOutputTextarea.value = "";
    recordedRawNotes = [];
    recordedNotes = [];
    currentStepTime = 0;
    selectedStepNote = null;

    startRecordButton.disabled = true;
    stopRecordButton.disabled = false;
    clearRecordButton.disabled = true;
    recordModeSelector.disabled = true;
    recordTitleInput.disabled = true;
    recordArtistInput.disabled = true;
    recordTempoInput.disabled = true;

    if (recordingMode === 'realtime') {
        recordingStartTime = performance.now();
        recordingStatusSpan.textContent = "Spiller inn...";
        console.log("startRecording: Sanntidsmodus startet."); // LOG
    } else {
        recordingStatusSpan.textContent = "";
        addStepNoteButton.disabled = (selectedStepNote === null);
        addRestButton.disabled = false;
        drawRecordPiano();
        console.log("startRecording: Steg-modus startet."); // LOG
    }
}

function stopRecording() { /* ... som før ... */ }
function clearRecording() { /* ... som før ... */ }
function quantizeRecordedNotes() { /* ... som før (plassholder) ... */ }
function addStepNote() { /* ... som før ... */ }
function addStepRest() { /* ... som før ... */ }
function generateJsonOutput() { /* ... som før ... */ }
function copyJsonToClipboard() { /* ... som før ... */ }
// === 11: INNSPILINGSFUNKSJONER SLUTT ===
