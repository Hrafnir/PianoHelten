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
    // Bytt ut denne med den beste Pink Panther JSON-filen du fant
    "pink_panther_theme.json": "Pink Panther Theme"
};
const songsFolderPath = 'songs/';
let currentSong = null;
let currentPlaybackBPM = 100;
let isPlaying = false;
let animationFrameId = null;
let playbackStartTime = 0;
let activeKeys = new Set(); // For highlighting under playback

// --- Lydtilstand ---
let audioContext = null;
let masterGainNode = null;
let isAudioInitialized = false;
let currentVolume = 0.7;
let isMuted = false;
let scheduledAudioSources = []; // For stopping playback audio

// --- Innspillingstilstand ---
let isRecording = false;
let recordingMode = 'realtime';
let recordingStartTime = 0;
let recordedRawNotes = []; // For potential future realtime capture
let recordedNotes = []; // Final recorded notes [{ key, time, duration }]
let currentStepTime = 0;
let selectedStepNote = null; // For step mode highlighting/adding

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
const RECORD_KEY_HIGHLIGHT_COLOR = 'rgba(52, 152, 219, 0.8)'; // Blå for record highlight

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
    drawPianos(); // Draw initial state
    populateSongSelector();
    setupEventListeners();
    resetUI(); // Set initial UI state for play tab
    switchTab('play'); // Start on play tab
    updateRecordModeUI(); // Set initial state for record controls
}
// === 2: INITIALISERING SLUTT ===


// === 3: CANVAS OPPSETT START ===
function setupCanvases() {
    const playContainer = document.querySelector('.game-area');
    if (playContainer) { gameCanvas.width = playContainer.clientWidth; gameCanvas.height = playContainer.clientHeight; }
    else { console.error("Fant ikke .game-area"); }

    const recordContainer = document.querySelector('.record-piano-area');
    if (recordContainer && recordPianoCanvas) { recordPianoCanvas.width = recordContainer.clientWidth; recordPianoCanvas.height = PIANO_HEIGHT_RECORD; }
    else { console.error("Fant ikke .record-piano-area eller #recordPianoCanvas"); }
     console.log(`Canvas satt opp: Game=${gameCanvas.width}x${gameCanvas.height}, Record=${recordPianoCanvas.width}x${recordPianoCanvas.height}`);
}
window.addEventListener('resize', () => { setupCanvases(); buildKeyMappings(); drawPianos(); });
// === 3: CANVAS OPPSETT SLUTT ===


// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    tabButtonPlay.addEventListener('click', () => switchTab('play'));
    tabButtonRecord.addEventListener('click', () => switchTab('record'));

    songSelector.addEventListener('change', handleSongSelect); // Keeping simple handler name
    bpmInputElement.addEventListener('change', handlePlaybackBpmChange);
    playButton.addEventListener('click', togglePlayback);
    volumeSlider.addEventListener('input', handleVolumeChange);
    muteCheckbox.addEventListener('change', handleMuteToggle);

    recordModeSelector.addEventListener('change', handleRecordModeChange);
    startRecordButton.addEventListener('click', startRecording);
    stopRecordButton.addEventListener('click', stopRecording);
    clearRecordButton.addEventListener('click', clearRecording);
    addStepNoteButton.addEventListener('click', addStepNote);
    addRestButton.addEventListener('click', addStepRest);
    copyJsonButton.addEventListener('click', copyJsonToClipboard);
    recordPianoCanvas.addEventListener('mousedown', handleRecordPianoMouseDown);
    recordPianoCanvas.addEventListener('mouseup', handleRecordPianoMouseUp);

    console.log("Event listeners satt opp.");
}

function switchTab(tabName) {
    const isPlayTab = tabName === 'play';
    playArea.classList.toggle('active', isPlayTab);
    recordArea.classList.toggle('active', !isPlayTab);
    tabButtonPlay.classList.toggle('active', isPlayTab);
    tabButtonRecord.classList.toggle('active', !isPlayTab);

    if (isPlayTab && isRecording) stopRecording();
    if (!isPlayTab && isPlaying) { stopSoundPlayback(); pauseSongVisuals(); }
    if (!isPlayTab) { // When switching TO record tab
         // Ensure correct dimensions and draw piano
         setupCanvases();
         buildKeyMappings();
         drawRecordPiano();
    }
    console.log("Byttet til fane:", tabName);
}

function updateRecordModeUI() {
    recordingMode = recordModeSelector.value;
    const isStepMode = recordingMode === 'step';
    stepModeControls.style.display = isStepMode ? 'flex' : 'none';
    realtimeModeControls.style.display = isStepMode ? 'none' : 'flex';
    addStepNoteButton.disabled = !isStepMode || selectedStepNote === null;
    addRestButton.disabled = !isStepMode; // Only enable in step mode
}

function populateSongSelector() {
    while (songSelector.options.length > 1) songSelector.remove(1);
    for (const filename in availableSongs) { const option = document.createElement('option'); option.value = filename; option.textContent = availableSongs[filename]; songSelector.appendChild(option); }
}

// Sets the initial state or state after song load error
function resetUI() {
    playButton.disabled = true; playButton.textContent = "Spill av";
    bpmInputElement.disabled = true; bpmInputElement.value = 100; originalBpmSpan.textContent = "";
    songInfoDiv.textContent = "Velg en sang fra menyen";
    songSelector.selectedIndex = 0;
    songSelector.disabled = false; // Should be enabled initially
    console.log("UI resatt (Play Tab).");
}

function handleSongSelect(event) {
    const selectedFilename = event.target.value;
     console.log("handleSongSelect:", selectedFilename);
    activeKeys.clear();
    if (!selectedFilename) { currentSong = null; resetUI(); resetPlayback(); drawPianos(); return; }

    const songPath = songsFolderPath + selectedFilename;
    songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`;
    playButton.disabled = true; bpmInputElement.disabled = true; songSelector.disabled = true;

    fetch(songPath)
        .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
        .then(data => {
            currentSong = data;
            if (!currentSong.tempo || !currentSong.notes) throw new Error("Invalid song format.");
            console.log("Sang lastet:", currentSong.title);
            songInfoDiv.textContent = `Klar: ${currentSong.title} (${currentSong.artist || 'Ukjent'})`;
            currentPlaybackBPM = currentSong.tempo; bpmInputElement.value = currentPlaybackBPM;
            originalBpmSpan.textContent = `(Original: ${currentSong.tempo} BPM)`;
            bpmInputElement.disabled = false; playButton.disabled = false; songSelector.disabled = false;
            resetPlayback(); // Reset playback state for the new song
        })
        .catch(error => {
            console.error("Feil ved lasting av sang:", error);
            songInfoDiv.textContent = `Feil: Kunne ikke laste sang. ${error.message}`;
            currentSong = null; resetUI(); resetPlayback(); drawPianos(); songSelector.disabled = false;
        });
}

function handlePlaybackBpmChange(event) { currentPlaybackBPM = parseInt(event.target.value, 10) || 100; }
function handleVolumeChange() { currentVolume = parseFloat(volumeSlider.value); if (masterGainNode && !isMuted) masterGainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime); }
function handleMuteToggle() { isMuted = muteCheckbox.checked; if (masterGainNode) masterGainNode.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioContext.currentTime); }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===


// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMappings() { buildSpecificKeyMapping(gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay); buildSpecificKeyMapping(recordPianoCanvas, PIANO_HEIGHT_RECORD, keyMappingRecord); }
function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) { /* ... som før ... */ }
function drawPianos() { drawSpecificPiano(gameCtx, gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay, activeKeys, KEY_HIGHLIGHT_COLOR); drawRecordPiano(); }
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) { /* ... som før ... */ }
function drawRecordPiano() { if (!recordPianoCtx) return; recordPianoCtx.clearRect(0, 0, recordPianoCanvas.width, recordPianoCanvas.height); const highlightSet = new Set(); if (recordingMode === 'step' && selectedStepNote) highlightSet.add(selectedStepNote); drawSpecificPiano( recordPianoCtx, recordPianoCanvas, PIANO_HEIGHT_RECORD, keyMappingRecord, highlightSet, RECORD_KEY_HIGHLIGHT_COLOR ); }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
async function ensureAudioInitialized() {
    if (isAudioInitialized) return true;
    console.log("Forsøker å initialisere AudioContext...");
    return initAudio(); // Returnerer true/false basert på suksess
}

async function togglePlayback() {
    if (!currentSong) return;
    if (!await ensureAudioInitialized()) { // Vent på initialisering (hvis nødvendig)
        console.error("Kan ikke spille av, AudioContext feilet.");
        return;
    }
    // Håndter suspended state (viktig etter inaktivitet)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    if (isPlaying) { stopSoundPlayback(); pauseSongVisuals(); }
    else { playSong(); }
}

function playSong() {
    if (!currentSong || !audioContext) return;
    if (isPlaying) return; // Ikke start på nytt hvis allerede spiller

    isPlaying = true; playButton.textContent = "Stopp";
    bpmInputElement.disabled = true; songSelector.disabled = true;

    playbackStartTime = performance.now() + PRE_ROLL_SECONDS * 1000;
    scheduleSongAudio(); // Planlegg lyden

    if (!animationFrameId) gameLoop(); // Start visuell løkke
     console.log("Avspilling startet.");
}

function pauseSongVisuals() {
    isPlaying = false; playButton.textContent = "Spill av";
    bpmInputElement.disabled = false; songSelector.disabled = false; // Aktiver kontroller

    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
    activeKeys.clear();
    drawPianos(); // Tegn pianoer i ikke-spillende tilstand
    console.log("Visuell avspilling stoppet.");
}

function resetPlayback() { // Kalles ved sangvalg eller feil
    stopSoundPlayback(); // Stopp alltid lyden
    if (isPlaying || animationFrameId) { // Hvis noe kjører, stopp det visuelle også
        pauseSongVisuals();
    }
    playbackStartTime = 0;
    activeKeys.clear();
    // UI settes i resetUI og pauseSongVisuals
    if (gameCtx) gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Tøm spill-canvas
    drawPianos(); // Tegn begge pianoer på nytt
    console.log("Avspilling nullstilt.");
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===


// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop); if (!isPlaying) { animationFrameId = null; return; } // Stopp løkken hvis ikke playing
    const currentTime = performance.now(); const elapsedTimeInSeconds = (currentTime - playbackStartTime) / 1000; const beatsPerSecond = currentPlaybackBPM / 60; const currentBeat = elapsedTimeInSeconds * beatsPerSecond;
    activeKeys.clear();
    // gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Tømming skjer i drawSpecificPiano
    drawFallingNotes(currentBeat); // Tegn fallende noter
    drawPianos(); // Tegn begge pianoer (highlight påvirker kun spill)
    // Tegn beat-teller etc. på spill-canvas
    gameCtx.fillStyle = 'white'; gameCtx.font = '16px sans-serif'; gameCtx.textAlign = 'left'; gameCtx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20); gameCtx.textAlign = 'right'; gameCtx.fillText(`BPM: ${currentPlaybackBPM}`, gameCanvas.width - 10, 20);
}
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) { /* ... som før ... */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
initialize();
// === 9: START PROGRAMMET SLUTT ===


// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() {
    if (isAudioInitialized) return true;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioContext.createGain();
        masterGainNode.connect(audioContext.destination);
        currentVolume = parseFloat(volumeSlider.value);
        isMuted = muteCheckbox.checked;
        masterGainNode.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioContext.currentTime);
        isAudioInitialized = true;
        console.log("AudioContext initialisert OK.");
        return true; // Suksess
    } catch (e) {
        console.error("Web Audio API støttes ikke eller feilet.", e);
        alert("Kunne ikke initialisere lyd.");
        isAudioInitialized = false;
        return false; // Feil
    }
}
function noteToFrequency(noteName) { /* ... som før ... */ }
function scheduleSongAudio() { /* ... som før ... */ }
function stopSoundPlayback() { /* ... som før ... */ }
function playFeedbackTone(noteName) { if (!audioContext || !masterGainNode) return; const freq = noteToFrequency(noteName); if (!freq) return; const osc = audioContext.createOscillator(); const gain = audioContext.createGain(); osc.connect(gain); gain.connect(masterGainNode); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audioContext.currentTime); gain.gain.setValueAtTime(0, audioContext.currentTime); gain.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.01); gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2); osc.start(audioContext.currentTime); osc.stop(audioContext.currentTime + 0.25); }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===


// === 11: INNSPILINGSFUNKSJONER START ===
function handleRecordModeChange() { updateRecordModeUI(); }
function getKeyAtRecordCoords(canvas, event) { /* ... som før ... */ }

async function handleRecordPianoMouseDown(event) {
    console.log("RecordPiano MouseDown"); // Enkel logg
    if (!await ensureAudioInitialized()) return; // Sikre lyd
    if (audioContext.state === 'suspended') await audioContext.resume(); // Aktiver om nødvendig

    const keyName = getKeyAtRecordCoords(recordPianoCanvas, event);
    if (!keyName) return;

    playFeedbackTone(keyName); // Spill feedback

    if (recordingMode === 'step' && !isRecording) {
        selectedStepNote = keyName;
        addStepNoteButton.disabled = false;
        drawRecordPiano(); // Oppdater highlight
    } else if (recordingMode === 'realtime' && isRecording) {
        // TODO: Start timer for 'keyName'
        console.log("Realtime note ON (TODO):", keyName);
    }
}

function handleRecordPianoMouseUp(event) {
    console.log("RecordPiano MouseUp"); // Enkel logg
    if (recordingMode === 'realtime' && isRecording) {
        // TODO: Stopp timer, beregn varighet, legg til i recordedRawNotes
        // const keyName = getKeyAtRecordCoords(recordPianoCanvas, event); // Kan være nyttig
         console.log("Realtime note OFF (TODO)");
    }
}

function startRecording() {
    console.log("Start Recording trykket."); // Enkel logg
    if (isRecording) return;
    isRecording = true;
    jsonOutputTextarea.value = ""; recordedRawNotes = []; recordedNotes = [];
    currentStepTime = 0; selectedStepNote = null;

    startRecordButton.disabled = true; stopRecordButton.disabled = false;
    clearRecordButton.disabled = true; recordModeSelector.disabled = true;
    recordTitleInput.disabled = true; recordArtistInput.disabled = true; recordTempoInput.disabled = true;

    if (recordingMode === 'realtime') { recordingStartTime = performance.now(); recordingStatusSpan.textContent = "Spiller inn..."; }
    else { recordingStatusSpan.textContent = ""; addStepNoteButton.disabled = true; addRestButton.disabled = false; drawRecordPiano(); }
}

function stopRecording() {
     console.log("Stop Recording trykket."); // Enkel logg
    if (!isRecording) return;
    isRecording = false;

    startRecordButton.disabled = false; stopRecordButton.disabled = true;
    clearRecordButton.disabled = false; recordModeSelector.disabled = false;
    recordTitleInput.disabled = false; recordArtistInput.disabled = false; recordTempoInput.disabled = false;
    recordingStatusSpan.textContent = "";
    addStepNoteButton.disabled = true; addRestButton.disabled = true;

    if (recordingMode === 'realtime') quantizeRecordedNotes();
    generateJsonOutput();
    drawRecordPiano();
}

function clearRecording() {
    console.log("Clear Recording trykket."); // Enkel logg
    if (isRecording) stopRecording();
    recordedRawNotes = []; recordedNotes = []; jsonOutputTextarea.value = "";
    currentStepTime = 0; selectedStepNote = null; clearRecordButton.disabled = true;
    drawRecordPiano();
}

function quantizeRecordedNotes() { /* ... som før (plassholder) ... */ }
function addStepNote() { /* ... som før ... */ }
function addStepRest() { /* ... som før ... */ }
function generateJsonOutput() { /* ... som før ... */ }
function copyJsonToClipboard() { /* ... som før ... */ }
// === 11: INNSPILINGSFUNKSJONER SLUTT ===
