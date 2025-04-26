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

// --- Piano Konstanter (brukes av begge pianoer) ---
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
    buildKeyMappings(); // Bygger FØR første draw
    drawPianos(); // Tegner begge etter at mapping er klar
    populateSongSelector();
    setupEventListeners();
    resetUI();
    switchTab('play');
    updateRecordModeUI();
}
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
function setupCanvases() {
    const playContainer = document.querySelector('.game-area');
    if (playContainer) {
        gameCanvas.width = playContainer.clientWidth;
        gameCanvas.height = playContainer.clientHeight;
        console.log(`Game Canvas satt opp: ${gameCanvas.width}x${gameCanvas.height}`);
    } else {
        console.error("Fant ikke .game-area container");
    }

    const recordContainer = document.querySelector('.record-piano-area');
    if (recordContainer && recordPianoCanvas) {
        recordPianoCanvas.width = recordContainer.clientWidth;
        recordPianoCanvas.height = PIANO_HEIGHT_RECORD;
        console.log(`Record Piano Canvas satt opp: ${recordPianoCanvas.width}x${recordPianoCanvas.height}`);
    } else {
        console.error("Fant ikke .record-piano-area container eller #recordPianoCanvas");
    }
}

window.addEventListener('resize', () => {
    console.log("Resize event - setter opp canvases og tegner på nytt."); // LOG
    setupCanvases();
    buildKeyMappings();
    activeKeys.clear();
    drawPianos();
});
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    // Faner
    tabButtonPlay.addEventListener('click', () => switchTab('play'));
    tabButtonRecord.addEventListener('click', () => switchTab('record'));

    // Avspilling
    songSelector.addEventListener('change', handleSongSelect);
    bpmInputElement.addEventListener('change', handlePlaybackBpmChange);
    playButton.addEventListener('click', togglePlayback);
    volumeSlider.addEventListener('input', handleVolumeChange);
    muteCheckbox.addEventListener('change', handleMuteToggle);

    // Innspilling
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
    console.log("Bytter til fane:", tabName);
    if (tabName === 'play') {
        playArea.classList.add('active');
        recordArea.classList.remove('active');
        tabButtonPlay.classList.add('active');
        tabButtonRecord.classList.remove('active');
        if (isRecording) { stopRecording(); }
    } else if (tabName === 'record') {
        playArea.classList.remove('active');
        recordArea.classList.add('active');
        tabButtonPlay.classList.remove('active');
        tabButtonRecord.classList.add('active');
        if (isPlaying) { stopSoundPlayback(); pauseSongVisuals(); }
        // Tving re-oppsett og tegning av record piano ved fanebytte
        console.log("SwitchTab: Kaller setupCanvases, buildKeyMappings, drawRecordPiano for record tab."); // LOG
        setupCanvases(); // Sørg for at dimensjoner er korrekte
        buildKeyMappings(); // Oppdater mapping
        drawRecordPiano(); // Tegn
    }
}
function updateRecordModeUI() { /* ... som før ... */ }
function populateSongSelector() { /* ... som før ... */ }
function resetUI() { /* ... som før ... */ }
function handleSongSelect() { /* ... som før ... */ }
function handlePlaybackBpmChange(event) { /* ENDRET NAVN */ currentPlaybackBPM = parseInt(event.target.value, 10) || 100; console.log(`Playback BPM endret til: ${currentPlaybackBPM}`); }
function handleVolumeChange() { /* ... som før ... */ }
function handleMuteToggle() { /* ... som før ... */ }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMappings() {
    console.log("buildKeyMappings: Starter..."); // LOG
    buildSpecificKeyMapping(gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay);
    buildSpecificKeyMapping(recordPianoCanvas, PIANO_HEIGHT_RECORD, keyMappingRecord);
    console.log("buildKeyMappings: Ferdig. Play keys:", Object.keys(keyMappingPlay).length, "Record keys:", Object.keys(keyMappingRecord).length); // LOG
}

function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) {
    const canvasId = canvasElement.id || 'unknown';
    console.log(`buildSpecificKeyMapping: Starter for '#${canvasId}' - Bredde: ${canvasElement.width}`); // LOG Bredde
    if (!canvasElement || canvasElement.width === 0) {
        console.warn(`buildSpecificKeyMapping: Canvas '#${canvasId}' er ikke klar eller har bredde 0. Avbryter mapping.`);
        return; // Ikke bygg mapping hvis canvas ikke er klar
    }

    Object.keys(mappingObject).forEach(key => delete mappingObject[key]);

    const lastWhiteKey = keyInfo.filter(k => k.type === 'white').pop();
    if (!lastWhiteKey) { console.error("Ingen hvite taster definert i keyInfo"); return; }
    const pianoUnitsWidth = lastWhiteKey.xOffset + 1;

    const availableWidth = canvasElement.width;
    const actualWhiteKeyWidth = availableWidth / pianoUnitsWidth;
    const actualBlackKeyWidth = actualWhiteKeyWidth * blackKeyWidthRatio;
    const pianoStartX = 0;

    keyInfo.forEach(key => {
        const xBase = pianoStartX + key.xOffset * actualWhiteKeyWidth;
        if (key.type === 'white') {
            mappingObject[key.name] = { x: xBase, width: actualWhiteKeyWidth, type: 'white', height: pianoHeightPx };
        } else {
            const adjustedX = xBase - actualBlackKeyWidth / 2;
             mappingObject[key.name] = { x: adjustedX, width: actualBlackKeyWidth, type: 'black', height: pianoHeightPx * blackKeyHeightRatio };
        }
    });
     console.log(`buildSpecificKeyMapping: Ferdig for '#${canvasId}'. Antall keys: ${Object.keys(mappingObject).length}`); // LOG
}

function drawPianos() {
    console.log("drawPianos: Kjører..."); // LOG
    // Sjekk om gameCtx er gyldig før tegning
    if (gameCtx) {
        drawSpecificPiano(gameCtx, gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay, activeKeys, KEY_HIGHLIGHT_COLOR);
    } else {
        console.warn("drawPianos: gameCtx er ikke definert, kan ikke tegne spillpiano.");
    }
    drawRecordPiano(); // Kaller egen funksjon som sjekker recordPianoCtx
}

function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) {
     const canvasId = canvasElement.id || 'unknown';
     console.log(`drawSpecificPiano: Kjører for canvas '#${canvasId}'. Har ${Object.keys(mappingObject).length} keys i mapping.`); // LOG

     if (!ctx) {
         console.error(`drawSpecificPiano: Context (ctx) for '#${canvasId}' er ugyldig!`);
         return;
     }
     if (Object.keys(mappingObject).length === 0) {
         console.warn(`drawSpecificPiano: Avslutter tidlig for '#${canvasId}' pga. tom mapping.`); // LOG
         // Tegn en feilmelding på canvas?
         ctx.fillStyle = 'orange';
         ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
         ctx.fillStyle = 'black';
         ctx.font = '16px sans-serif';
         ctx.textAlign = 'center';
         ctx.fillText('Mapping mangler!', canvasElement.width / 2, canvasElement.height / 2);
         return;
     }

    const pianoDrawHeight = canvasElement.height - pianoHeightPx;
    const blackKeyActualHeight = pianoHeightPx * blackKeyHeightRatio;
    console.log(`drawSpecificPiano (#${canvasId}): canvasH=${canvasElement.height}, pianoH=${pianoHeightPx}, drawY=${pianoDrawHeight}`); // LOG

    // Tøm kun hvis vi tegner spillpianoet (recordpiano tømmes i drawRecordPiano)
    if (canvasId === 'gameCanvas') {
         ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }

    // --- Resten av tegnekoden ---
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 1;

    keyInfo.forEach(key => { if (key.type === 'white') { const keyData = mappingObject[key.name]; if (!keyData) return; ctx.fillStyle = 'white'; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); if (activeHighlightKeys && activeHighlightKeys.has(key.name)) { ctx.fillStyle = highlightColor; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); } ctx.strokeStyle = '#555'; ctx.strokeRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); ctx.fillStyle = KEY_NAME_COLOR_WHITE; ctx.font = KEY_NAME_FONT; ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + keyData.height - 5); } });
    keyInfo.forEach(key => { if (key.type === 'black') { const keyData = mappingObject[key.name]; if (!keyData) return; ctx.fillStyle = 'black'; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); if (activeHighlightKeys && activeHighlightKeys.has(key.name)) { ctx.fillStyle = highlightColor; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); } const textWidth = ctx.measureText(key.name).width; if (keyData.width > textWidth * 1.1) { ctx.fillStyle = KEY_NAME_COLOR_BLACK; ctx.font = KEY_NAME_FONT; ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + keyData.height - 5); } } });
    // --- Slutt på tegnekode ---

    console.log(`drawSpecificPiano (#${canvasId}): Ferdig med å tegne tangenter.`); // LOG
}

function drawRecordPiano() {
    console.log("drawRecordPiano: Kjører."); // LOG
    if (!recordPianoCtx) {
        console.error("drawRecordPiano: recordPianoCtx er ikke definert!");
        return;
    }
    recordPianoCtx.clearRect(0, 0, recordPianoCanvas.width, recordPianoCanvas.height); // Tøm først
    const highlightSet = new Set();
    if (recordingMode === 'step' && selectedStepNote) {
        highlightSet.add(selectedStepNote);
    }

    console.log("drawRecordPiano: Kaller drawSpecificPiano for record canvas."); // LOG
    drawSpecificPiano(
        recordPianoCtx,
        recordPianoCanvas,
        PIANO_HEIGHT_RECORD,
        keyMappingRecord,
        highlightSet,
        RECORD_KEY_HIGHLIGHT_COLOR
    );
     console.log("drawRecordPiano: Ferdig."); // LOG
}
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===

// === 6: AVSPILLINGS KONTROLL START ===
// ... (som før) ...
function togglePlayback() { console.log("togglePlayback: Kjører. isPlaying:", isPlaying); if (!currentSong) { console.log("togglePlayback: Ingen sang lastet, avbryter."); return; } if (!isAudioInitialized) { console.log("togglePlayback: Initialiserer AudioContext..."); initAudio(); if (!isAudioInitialized) { console.log("togglePlayback: AudioContext initialisering feilet, avbryter."); return; } } if (audioContext && audioContext.state === 'suspended') { console.log("togglePlayback: AudioContext er suspended, forsøker resume..."); audioContext.resume().then(() => { console.log("togglePlayback: AudioContext resumed successfully."); togglePlayback(); }).catch(e => { console.error("togglePlayback: Error resuming AudioContext:", e); }); return; } if (isPlaying) { console.log("togglePlayback: Stopper avspilling..."); stopSoundPlayback(); pauseSongVisuals(); } else { console.log("togglePlayback: Starter avspilling..."); playSong(); } }
function playSong() { if (!currentSong || !audioContext) { console.log("playSong: Ingen sang eller audioContext, avbryter."); return; } if (isPlaying) { console.log("playSong: Kalles, men isPlaying er allerede true. Avbryter."); return; } console.log("playSong: Setter isPlaying = true"); isPlaying = true; playButton.textContent = "Stopp"; bpmInputElement.disabled = true; songSelector.disabled = true; playbackStartTime = performance.now() + PRE_ROLL_SECONDS * 1000; console.log(`playSong: Starter visuell avspilling (BPM: ${currentPlaybackBPM}) med pre-roll...`); console.log("playSong: Sjekker animationFrameId før start av gameLoop. Nåværende ID:", animationFrameId); if (!animationFrameId) { console.log("playSong: animationFrameId er null, starter gameLoop()."); gameLoop(); } else { console.warn("playSong: Forsøkte å starte gameLoop, men animationFrameId var ikke null:", animationFrameId); } console.log("playSong: Kaller scheduleSongAudio()."); scheduleSongAudio(); console.log("playSong: Ferdig."); }
function pauseSongVisuals() { console.log("pauseSongVisuals: Kjører."); isPlaying = false; playButton.textContent = "Spill av"; bpmInputElement.disabled = false; songSelector.disabled = false; console.log("pauseSongVisuals: Stopper animasjonsløkke. Nåværende ID:", animationFrameId); if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; console.log("pauseSongVisuals: animationFrameId nullstilt."); } else { console.log("pauseSongVisuals: Ingen animationFrameId å stoppe."); } activeKeys.clear(); drawPianos(); console.log("pauseSongVisuals: Visuell avspilling stoppet."); } // Kall drawPianos
function resetPlayback() { console.log("resetPlayback: Kjører."); pauseSongVisuals(); stopSoundPlayback(); playbackStartTime = 0; if (currentSong) { playButton.disabled = false; bpmInputElement.disabled = false; songSelector.disabled = false; console.log("resetPlayback: Sang er lastet, kontroller aktivert."); } else { playButton.disabled = true; bpmInputElement.disabled = true; songSelector.disabled = false; console.log("resetPlayback: Ingen sang lastet, kontroller deaktivert (unntatt velger)."); } if (gameCtx) gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Tøm kun gameCanvas
 drawPianos(); console.log("resetPlayback: Avspilling nullstilt ferdig."); } // Kall drawPianos
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop); if (!isPlaying) { console.warn("gameLoop: Kjører, men isPlaying er false. Stopper løkken."); cancelAnimationFrame(animationFrameId); animationFrameId = null; return; } const currentTime = performance.now(); const elapsedTimeInSeconds = (currentTime - playbackStartTime) / 1000; const beatsPerSecond = currentPlaybackBPM / 60; const currentBeat = elapsedTimeInSeconds * beatsPerSecond; activeKeys.clear();
    // gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Fjernet, gjøres i drawSpecificPiano
    drawFallingNotes(currentBeat);
    drawPianos(); // Tegner begge, men activeKeys påvirker kun spillpianoet
    gameCtx.fillStyle = 'white'; gameCtx.font = '16px sans-serif'; gameCtx.textAlign = 'left'; gameCtx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20); gameCtx.textAlign = 'right'; gameCtx.fillText(`BPM: ${currentPlaybackBPM}`, gameCanvas.width - 10, 20);
}
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) {
     if (!currentSong || !currentSong.notes || Object.keys(keyMappingPlay).length === 0) return; // Bruk spillpiano-mapping

    const secondsPerBeat = 60 / currentPlaybackBPM;
    const fallHeight = gameCanvas.height - PIANO_HEIGHT_PLAY; // Bruk spill-canvas/-høyde
    const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS;
    const pixelsPerBeat = pixelsPerSecond * secondsPerBeat;
    const targetLineY = gameCanvas.height - PIANO_HEIGHT_PLAY; // Bruk spill-canvas/-høyde

    currentSong.notes.forEach(note => {
        const keyData = keyMappingPlay[note.key]; // Bruk spillpiano-mapping
        if (!keyData) return;

        const noteStartTime = note.time; const noteEndTime = note.time + note.duration;
        if (currentBeat >= noteStartTime && currentBeat < noteEndTime) { activeKeys.add(note.key); }

        const targetBeat = note.time; const beatsUntilHit = targetBeat - currentBeat;
        const yBottom = targetLineY - (beatsUntilHit * pixelsPerBeat);
        const notePixelHeight = Math.max(1, note.duration * pixelsPerBeat);
        const yTop = yBottom - notePixelHeight;
        const xPosition = keyData.x; const noteWidth = keyData.width;

        if (yTop < gameCanvas.height && yBottom > 0) { // Sjekk mot spill-canvas høyde
            gameCtx.fillStyle = (keyData.type === 'white') ? WHITE_NOTE_COLOR : BLACK_NOTE_COLOR;
            gameCtx.strokeStyle = NOTE_BORDER_COLOR; gameCtx.lineWidth = 1;

            gameCtx.beginPath();
            if (gameCtx.roundRect) { gameCtx.roundRect(xPosition, yTop, noteWidth, notePixelHeight, NOTE_CORNER_RADIUS); }
            else { gameCtx.rect(xPosition, yTop, noteWidth, notePixelHeight); }
            gameCtx.fill(); gameCtx.stroke();
        }
    });
}
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
function handleRecordPianoMouseDown(event) { /* ... som før ... */ }
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
