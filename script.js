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
const gameCanvas = document.getElementById('gameCanvas'); // Endret navn fra canvas
const gameCtx = gameCanvas.getContext('2d');             // Endret navn fra ctx
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
const recordPianoCtx = recordPianoCanvas.getContext('2d'); // Egen context for innspillingspiano
const jsonOutputTextarea = document.getElementById('jsonOutput');
const copyJsonButton = document.getElementById('copyJsonButton');

// --- Felles/Avspillingstilstand ---
const availableSongs = {
    "twinkle_twinkle.json": "Twinkle Twinkle Little Star",
    "pink_panther_theme.json": "Pink Panther Theme"
};
const songsFolderPath = 'songs/';
let currentSong = null; // For avspilling
let currentPlaybackBPM = 100;
let isPlaying = false;
let animationFrameId = null;
let playbackStartTime = 0; // Tydeliggjør at dette er for avspilling
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
let recordingMode = 'realtime'; // 'realtime' or 'step'
let recordingStartTime = 0;
let recordedRawNotes = []; // For realtime capture: [{ note: "C4", startTime: timestamp, endTime: timestamp }]
let recordedNotes = []; // Final quantized/step notes: [{ key: "C4", time: beat, duration: beats }]
let currentStepTime = 0; // Holder styr på tid i steg-modus
let selectedStepNote = null; // Hvilken tangent som er valgt i steg-modus

// --- Piano Konstanter (brukes av begge pianoer) ---
const keyInfo = [ { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 }, { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 }, { name: "E4", type: "white", xOffset: 2 }, { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 }, { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 }, { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 }, { name: "B4", type: "white", xOffset: 6 }, { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 }, { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 }, { name: "E5", type: "white", xOffset: 9 }, { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 }, { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 }, { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 }, { name: "B5", type: "white", xOffset: 13 }, { name: "C6", type: "white", xOffset: 14 } ];
const PIANO_HEIGHT_PLAY = 120; // Høyde for avspillingspiano
const PIANO_HEIGHT_RECORD = 150; // Høyde for innspillingspiano (fra CSS)
const blackKeyWidthRatio = 0.6;
const blackKeyHeightRatio = 0.6; // Relativt til total høyde
const keyMappingPlay = {}; // Egen mapping for avspillingspiano
const keyMappingRecord = {}; // Egen mapping for innspillingspiano

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
const RECORD_KEY_HIGHLIGHT_COLOR = 'rgba(52, 152, 219, 0.8)'; // Blå for innspilling

// --- Lyd Konstanter ---
const A4_FREQ = 440.0;
const A4_MIDI_NUM = 69;
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===


// === 2: INITIALISERING START ===
function initialize() {
    console.log("Initialiserer Piano Hero & Komponering...");
    setupCanvases(); // Setter opp begge canvas
    buildKeyMappings(); // Bygger begge mappings
    drawPianos(); // Tegner begge pianoer
    populateSongSelector();
    setupEventListeners();
    resetUI();
    switchTab('play'); // Start på avspillingsfanen
    updateRecordModeUI(); // Sett opp UI for default record mode
}
// === 2: INITIALISERING SLUTT ===


// === 3: CANVAS OPPSETT START ===
function setupCanvases() { // Setter opp begge
    const playContainer = document.querySelector('.game-area');
    gameCanvas.width = playContainer.clientWidth;
    gameCanvas.height = playContainer.clientHeight;
    console.log(`Game Canvas satt opp: ${gameCanvas.width}x${gameCanvas.height}`);

    const recordContainer = document.querySelector('.record-piano-area');
    // Bruk containerens bredde, men CSS-høyde for record piano
    recordPianoCanvas.width = recordContainer.clientWidth;
    recordPianoCanvas.height = PIANO_HEIGHT_RECORD; // Bruk konstant/CSS-verdi
     console.log(`Record Piano Canvas satt opp: ${recordPianoCanvas.width}x${recordPianoCanvas.height}`);
}

window.addEventListener('resize', () => {
    setupCanvases();
    buildKeyMappings(); // Må bygge begge på nytt
    activeKeys.clear();
    drawPianos(); // Tegn begge på nytt
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
    // *** VIKTIG: Legg til event listener for klikk på innspillingspianoet ***
    recordPianoCanvas.addEventListener('mousedown', handleRecordPianoMouseDown);
    recordPianoCanvas.addEventListener('mouseup', handleRecordPianoMouseUp);
    // Legg til touch-events for mobil senere hvis nødvendig
    // recordPianoCanvas.addEventListener('touchstart', handleRecordPianoTouchStart);
    // recordPianoCanvas.addEventListener('touchend', handleRecordPianoTouchEnd);

    console.log("Event listeners satt opp.");
}

function switchTab(tabName) {
    console.log("Bytter til fane:", tabName);
    if (tabName === 'play') {
        playArea.classList.add('active');
        recordArea.classList.remove('active');
        tabButtonPlay.classList.add('active');
        tabButtonRecord.classList.remove('active');
        // Stopp eventuell innspilling hvis vi bytter vekk
        if (isRecording) {
            stopRecording();
        }
    } else if (tabName === 'record') {
        playArea.classList.remove('active');
        recordArea.classList.add('active');
        tabButtonPlay.classList.remove('active');
        tabButtonRecord.classList.add('active');
        // Stopp eventuell avspilling hvis vi bytter vekk
        if (isPlaying) {
             stopSoundPlayback();
             pauseSongVisuals();
        }
        // Sørg for at innspillingspianoet tegnes riktig
        buildKeyMappings(); // Kan være nødvendig hvis dimensjoner endres
        drawRecordPiano();
    }
}

function updateRecordModeUI() {
    recordingMode = recordModeSelector.value;
    if (recordingMode === 'step') {
        stepModeControls.style.display = 'flex'; // Vis steg-kontroller
        realtimeModeControls.style.display = 'none'; // Skjul sanntid-kontroller
        addStepNoteButton.disabled = (selectedStepNote === null); // Aktiver kun hvis note er valgt
    } else { // realtime
        stepModeControls.style.display = 'none';
        realtimeModeControls.style.display = 'flex';
        addStepNoteButton.disabled = true;
    }
     console.log("Record mode UI oppdatert til:", recordingMode);
}


function populateSongSelector() { /* ... som før ... */ }
function resetUI() { /* ... som før, men påvirker kun playArea ... */ }
function handleSongSelect() { /* ... som før ... */ }
function handlePlaybackBpmChange() { /* ... som før, endret navn for tydelighet ... */ }
function handleVolumeChange() { /* ... som før ... */ }
function handleMuteToggle() { /* ... som før ... */ }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===


// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMappings() { // Bygger for begge pianoer
    buildSpecificKeyMapping(gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay);
    buildSpecificKeyMapping(recordPianoCanvas, PIANO_HEIGHT_RECORD, keyMappingRecord);
    console.log("Bygget key mappings for begge pianoer.");
}

function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) {
    // Tømmer eksisterende mapping
    Object.keys(mappingObject).forEach(key => delete mappingObject[key]);

    const lastWhiteKey = keyInfo.filter(k => k.type === 'white').pop();
    if (!lastWhiteKey) { console.error("Ingen hvite taster definert i keyInfo"); return; }
    const pianoUnitsWidth = lastWhiteKey.xOffset + 1;

    const availableWidth = canvasElement.width; // Bruk canvas-bredden
    const actualWhiteKeyWidth = availableWidth / pianoUnitsWidth;
    const actualBlackKeyWidth = actualWhiteKeyWidth * blackKeyWidthRatio;
    const pianoStartX = 0; // Starter alltid på 0

    keyInfo.forEach(key => {
        const xBase = pianoStartX + key.xOffset * actualWhiteKeyWidth;
        if (key.type === 'white') {
            mappingObject[key.name] = {
                x: xBase, width: actualWhiteKeyWidth, type: 'white', height: pianoHeightPx // Lagre høyde
            };
        } else {
            const adjustedX = xBase - actualBlackKeyWidth / 2;
             mappingObject[key.name] = {
                x: adjustedX, width: actualBlackKeyWidth, type: 'black', height: pianoHeightPx * blackKeyHeightRatio // Lagre høyde
             };
        }
    });
}

function drawPianos() { // Tegner begge
    drawSpecificPiano(gameCtx, gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay, activeKeys, KEY_HIGHLIGHT_COLOR);
    drawRecordPiano(); // Egen funksjon for innspillingspiano
}

// Generisk funksjon for å tegne et piano
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) {
     if (Object.keys(mappingObject).length === 0) return;

    const pianoDrawHeight = canvasElement.height - pianoHeightPx;
    const blackKeyActualHeight = pianoHeightPx * blackKeyHeightRatio;

    // Bakgrunn (valgfritt, hvis canvas ikke er transparent)
    // ctx.fillStyle = '#333';
    // ctx.fillRect(0, pianoDrawHeight - 1, canvasElement.width, pianoHeightPx + 1);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 1; // Standard linjetykkelse

    // Tegn hvite tangenter
    keyInfo.forEach(key => {
        if (key.type === 'white') {
            const keyData = mappingObject[key.name];
            if (!keyData) return;
            ctx.fillStyle = 'white';
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height);
            if (activeHighlightKeys && activeHighlightKeys.has(key.name)) {
                ctx.fillStyle = highlightColor;
                ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height);
            }
            ctx.strokeStyle = '#555';
            ctx.strokeRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height);
            ctx.fillStyle = KEY_NAME_COLOR_WHITE;
            ctx.font = KEY_NAME_FONT;
            // Juster Y-posisjon for tekst basert på full høyde
            ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + keyData.height - 5);
        }
    });

    // Tegn svarte tangenter
    keyInfo.forEach(key => {
        if (key.type === 'black') {
            const keyData = mappingObject[key.name];
             if (!keyData) return;
            ctx.fillStyle = 'black';
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); // Bruker lagret høyde
            if (activeHighlightKeys && activeHighlightKeys.has(key.name)) {
                ctx.fillStyle = highlightColor;
                ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height);
            }
             // Tegn navn (mindre font?)
             const textWidth = ctx.measureText(key.name).width;
             if (keyData.width > textWidth * 1.1) { // Litt mindre krav til plass
                 ctx.fillStyle = KEY_NAME_COLOR_BLACK;
                 ctx.font = KEY_NAME_FONT;
                  // Juster Y-posisjon for tekst basert på svart tangent-høyde
                 ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + keyData.height - 5);
             }
        }
    });
}

// Egen funksjon for å tegne innspillingspiano (pga. ulik highlight-logikk)
function drawRecordPiano() {
    // Bruker den generiske funksjonen, men med spesifikk context, mapping,
    // og en annen highlight-farge basert på `selectedStepNote`
    recordPianoCtx.clearRect(0, 0, recordPianoCanvas.width, recordPianoCanvas.height); // Tøm først
    const highlightSet = new Set();
    if (recordingMode === 'step' && selectedStepNote) {
        highlightSet.add(selectedStepNote); // Lag et sett med kun den valgte noten
    }
    // TODO: Legg til highlight for tangent som trykkes ned i realtime-modus?

    drawSpecificPiano(
        recordPianoCtx,
        recordPianoCanvas,
        PIANO_HEIGHT_RECORD,
        keyMappingRecord,
        highlightSet, // Send inn settet med valgt note (eller tomt sett)
        RECORD_KEY_HIGHLIGHT_COLOR // Bruk blå highlight
    );
}
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() { /* ... som før ... */ }
function playSong() { /* ... som før ... */ }
function pauseSongVisuals() { /* ... som før ... */ }
function resetPlayback() { /* ... som før ... */ }
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() { /* ... som før, men bruk gameCtx ... */ }
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) { /* ... som før, men bruk gameCtx ... */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
initialize();
// === 9: START PROGRAMMET SLUTT ===


// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() { /* ... som før ... */ }
function noteToFrequency(noteName) { /* ... som før ... */ }
function scheduleSongAudio() { /* ... som før ... */ }
function stopSoundPlayback() { /* ... som før ... */ }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===


// === 11: INNSPILINGSFUNKSJONER START ===

// Håndterer bytte av modus i UI
function handleRecordModeChange() {
    updateRecordModeUI();
    // Tøm eventuell påbegynt innspilling ved modusbytte? Eller behold?
    // clearRecording(); // Vurder om dette er ønskelig
    console.log("Byttet innspillingsmodus til:", recordModeSelector.value);
}

// Finner hvilken tangent som ble klikket på innspillingspianoet
function getKeyAtRecordCoords(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pianoDrawHeight = canvas.height - PIANO_HEIGHT_RECORD;

    // Sjekk svarte taster først (de ligger oppå)
    for (const key of keyInfo) {
        if (key.type === 'black') {
            const keyData = keyMappingRecord[key.name];
            if (!keyData) continue;
            if (x >= keyData.x && x < keyData.x + keyData.width &&
                y >= pianoDrawHeight && y < pianoDrawHeight + keyData.height) {
                return key.name;
            }
        }
    }
    // Sjekk hvite taster
    for (const key of keyInfo) {
         if (key.type === 'white') {
            const keyData = keyMappingRecord[key.name];
            if (!keyData) continue;
            if (x >= keyData.x && x < keyData.x + keyData.width &&
                y >= pianoDrawHeight && y < pianoDrawHeight + keyData.height) {
                return key.name;
            }
        }
    }
    return null; // Ingen tangent truffet
}


// Håndterer museklikk ned på innspillingspianoet
function handleRecordPianoMouseDown(event) {
     const keyName = getKeyAtRecordCoords(recordPianoCanvas, event);
     if (!keyName) return;
     console.log("Record Piano MouseDown:", keyName);

     // --- Logikk for Steg-modus ---
     if (recordingMode === 'step' && !isRecording) {
         selectedStepNote = keyName;
         addStepNoteButton.disabled = false; // Aktiver legg til-knapp
         drawRecordPiano(); // Tegn piano på nytt med highlight
     }
     // --- Logikk for Sanntid-modus ---
     else if (recordingMode === 'realtime' && isRecording) {
        // Start å lagre tiden for denne noten
        // TODO: Implementer lagring av starttid
     }
     // Spill av en kort lyd ved klikk (feedback)
     playFeedbackTone(keyName);
}

// Håndterer mus opp på innspillingspianoet
function handleRecordPianoMouseUp(event) {
     // --- Logikk for Sanntid-modus ---
     if (recordingMode === 'realtime' && isRecording) {
          const keyName = getKeyAtRecordCoords(recordPianoCanvas, event); // Kan være null hvis mus dras utenfor
          console.log("Record Piano MouseUp:", keyName);
          // Stopp lagring av tid for noten som ble sluppet opp
          // TODO: Implementer lagring av slutt-tid og legg til i recordedRawNotes
     }
}

// Spiller en kort tone som feedback
function playFeedbackTone(noteName) {
    if (!isAudioInitialized || !audioContext) return;
    const freq = noteToFrequency(noteName);
    if (!freq) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain);
    gain.connect(masterGainNode);

    osc.type = 'sine'; // Ren tone for feedback
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.01); // Rask attack
    gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2); // Kort decay

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.25);
}


// --- Funksjoner for innspilling (foreløpig plassholdere) ---
function startRecording() {
    if (isRecording) return;
    console.log(`Starter innspilling i ${recordingMode}-modus...`);
    isRecording = true;
    jsonOutputTextarea.value = ""; // Tøm output
    recordedRawNotes = []; // Tøm rådata (sanntid)
    recordedNotes = []; // Tøm ferdige noter
    currentStepTime = 0; // Nullstill tid for steg-modus
    selectedStepNote = null; // Nullstill valgt note

    // UI-oppdateringer
    startRecordButton.disabled = true;
    stopRecordButton.disabled = false;
    clearRecordButton.disabled = true; // Kan ikke tømme under innspilling
    recordModeSelector.disabled = true;
    recordTitleInput.disabled = true;
    recordArtistInput.disabled = true;
    recordTempoInput.disabled = true;

    if (recordingMode === 'realtime') {
        recordingStartTime = performance.now();
        recordingStatusSpan.textContent = "Spiller inn...";
    } else { // step
        recordingStatusSpan.textContent = "";
        addStepNoteButton.disabled = (selectedStepNote === null);
        addRestButton.disabled = false;
         drawRecordPiano(); // Sørg for at highlight er riktig
    }
}

function stopRecording() {
    if (!isRecording) return;
    console.log("Stopper innspilling.");
    isRecording = false;

    // UI-oppdateringer
    startRecordButton.disabled = false;
    stopRecordButton.disabled = true;
    clearRecordButton.disabled = false; // Kan tømme nå
    recordModeSelector.disabled = false;
    recordTitleInput.disabled = false;
    recordArtistInput.disabled = false;
    recordTempoInput.disabled = false;
    recordingStatusSpan.textContent = "";
    addStepNoteButton.disabled = true; // Deaktiver steg-knapper utenfor record
    addRestButton.disabled = true;

    // Behandle innspilte data
    if (recordingMode === 'realtime') {
        quantizeRecordedNotes(); // Konverter rådata til JSON-format
    }
    // For steg-modus er `recordedNotes` allerede i riktig format

    // Generer og vis JSON
    generateJsonOutput();
    drawRecordPiano(); // Fjern eventuell highlight
}

function clearRecording() {
    console.log("Tømmer innspilling.");
    if (isRecording) {
        stopRecording(); // Stopp først hvis den kjører
    }
    recordedRawNotes = [];
    recordedNotes = [];
    jsonOutputTextarea.value = "";
    currentStepTime = 0;
    selectedStepNote = null;
    clearRecordButton.disabled = true; // Kan ikke tømme en tom innspilling
    drawRecordPiano();
}

// --- Plassholdere for kjernefunksjonalitet ---
function quantizeRecordedNotes() {
    console.log("Kvantiserer sanntidsnoter...");
    recordedNotes = []; // Start med tom liste
    const tempoBPM = parseFloat(recordTempoInput.value) || 120;
    const secondsPerBeat = 60.0 / tempoBPM;
    const quantizeValue = parseInt(quantizeSelector.value); // 16, 8, 4, 0
    const quantizationUnitBeats = quantizeValue > 0 ? 1.0 / quantizeValue : 0; // Beats per enhet

    // Gå gjennom recordedRawNotes (som må fylles ut i mouse up/down)
    // For hver raw note:
    // 1. Beregn starttid i sekunder relativt til recordingStartTime
    // 2. Beregn varighet i sekunder
    // 3. Konverter starttid og varighet til beats
    // 4. Hvis quantizeValue > 0:
    //    - Rund av startBeat: Math.round(startBeat / quantizationUnitBeats) * quantizationUnitBeats
    //    - Rund av durationBeats: Math.round(durationBeats / quantizationUnitBeats) * quantizationUnitBeats
    //    - Sørg for at durationBeats > 0 (minst en kvantiseringsenhet)
    // 5. Lag note-objekt { key, time, duration } og legg til i recordedNotes
    // 6. Sorter recordedNotes etter tid til slutt

    // *** FAKTISK IMPLEMENTERING AV STEG 1-6 MANGLER HER ***

    console.log("Kvantisering (logikk mangler) - Resultat:", recordedNotes);
}

function addStepNote() {
     if (!selectedStepNote) return; // Ingen note valgt
     console.log("Legger til steg-note:", selectedStepNote);
     const duration = parseFloat(stepDurationSelector.value) || 1.0; // Hent varighet

     recordedNotes.push({
         key: selectedStepNote,
         time: currentStepTime, // Start på nåværende tidspunkt
         duration: duration
     });
     currentStepTime += duration; // Flytt tiden fremover

     console.log("Nåværende steg-noter:", recordedNotes);
     generateJsonOutput(); // Oppdater JSON umiddelbart

     // Nullstill valgt note og deaktiver knapp
     selectedStepNote = null;
     addStepNoteButton.disabled = true;
     drawRecordPiano(); // Tegn piano uten highlight
}

function addStepRest() {
    console.log("Legger til pause (steg)...");
    const duration = parseFloat(stepDurationSelector.value) || 1.0; // Hent varighet
    // Legger ikke til et note-objekt, bare flytter tiden
    currentStepTime += duration;

    console.log("Tid flyttet til:", currentStepTime);
     generateJsonOutput(); // Oppdater JSON for å vise tidsgap
}

function generateJsonOutput() {
    console.log("Genererer JSON output...");
    const outputData = {
        title: recordTitleInput.value || "Ny Sang",
        artist: recordArtistInput.value || "Ukjent",
        tempo: parseInt(recordTempoInput.value) || 120,
        notes: recordedNotes // Bruker de ferdige notene
    };
    // Sorter for sikkerhets skyld (viktig for avspilling)
    outputData.notes.sort((a, b) => a.time - b.time);

    try {
        jsonOutputTextarea.value = JSON.stringify(outputData, null, 2); // Pent formatert
    } catch (e) {
        jsonOutputTextarea.value = "Feil ved generering av JSON: " + e.message;
        console.error("Feil ved JSON stringify:", e);
    }
}

function copyJsonToClipboard() {
    if (!jsonOutputTextarea.value) return;
    navigator.clipboard.writeText(jsonOutputTextarea.value)
        .then(() => {
            console.log('JSON kopiert til utklippstavle!');
            // Gi visuell feedback? Endre knappetekst midlertidig?
            copyJsonButton.textContent = "Kopiert!";
            setTimeout(() => { copyJsonButton.textContent = "Kopier JSON"; }, 1500);
        })
        .catch(err => {
            console.error('Kunne ikke kopiere JSON: ', err);
            alert('Kunne ikke kopiere til utklippstavlen. Prøv å markere og kopiere manuelt.');
        });
}

// === 11: INNSPILINGSFUNKSJONER SLUTT ===
