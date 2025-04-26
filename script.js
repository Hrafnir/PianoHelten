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
const gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;
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
const recordPianoCtx = recordPianoCanvas ? recordPianoCanvas.getContext('2d') : null;
const jsonOutputTextarea = document.getElementById('jsonOutput');
const copyJsonButton = document.getElementById('copyJsonButton');

// --- Felles/Avspillingstilstand ---
const availableSongs = {
    "twinkle_twinkle.json": "Twinkle Twinkle Little Star",
    "odetojoy.json": "Ode to Joy (Beethoven)",
    "pink_panther_theme.json": "Pink Panther Theme (fra MIDI)" // Bruk navnet som reflekterer kilden
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
// *** UTVIDET keyInfo med Oktav 2 og 3 ***
const keyInfo = [
    // Oktav 2
    { name: "C2", type: "white", xOffset: -14 }, { name: "C#2", type: "black", xOffset: -13.3 },
    { name: "D2", type: "white", xOffset: -13 }, { name: "D#2", type: "black", xOffset: -12.3 },
    { name: "E2", type: "white", xOffset: -12 },
    { name: "F2", type: "white", xOffset: -11 }, { name: "F#2", type: "black", xOffset: -10.3 },
    { name: "G2", type: "white", xOffset: -10 }, { name: "G#2", type: "black", xOffset: -9.3 },
    { name: "A2", type: "white", xOffset: -9 }, { name: "A#2", type: "black", xOffset: -8.3 },
    { name: "B2", type: "white", xOffset: -8 },
    // Oktav 3
    { name: "C3", type: "white", xOffset: -7 }, { name: "C#3", type: "black", xOffset: -6.3 },
    { name: "D3", type: "white", xOffset: -6 }, { name: "D#3", type: "black", xOffset: -5.3 },
    { name: "E3", type: "white", xOffset: -5 },
    { name: "F3", type: "white", xOffset: -4 }, { name: "F#3", type: "black", xOffset: -3.3 },
    { name: "G3", type: "white", xOffset: -3 }, { name: "G#3", type: "black", xOffset: -2.3 },
    { name: "A3", type: "white", xOffset: -2 }, { name: "A#3", type: "black", xOffset: -1.3 },
    { name: "B3", type: "white", xOffset: -1 },
    // Oktav 4 (som før)
    { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 },
    { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 },
    { name: "E4", type: "white", xOffset: 2 },
    { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 },
    { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 },
    { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 },
    { name: "B4", type: "white", xOffset: 6 },
    // Oktav 5 (som før)
    { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 },
    { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 },
    { name: "E5", type: "white", xOffset: 9 },
    { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 },
    { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 },
    { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 },
    { name: "B5", type: "white", xOffset: 13 },
    // Oktav 6 (som før)
    { name: "C6", type: "white", xOffset: 14 }
];
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
    console.log("Initialiserer...");
    try {
        if (!gameCanvas || !recordPianoCanvas || !gameCtx || !recordPianoCtx) { console.error("FEIL: Canvas/Context mangler!"); return; }
        setupCanvases(); buildKeyMappings(); drawPianos(); populateSongSelector(); setupEventListeners(); resetUI();
        if(tabButtonPlay) tabButtonPlay.classList.add('active');
        if(tabButtonRecord) tabButtonRecord.classList.remove('active');
        updateRecordModeUI();
        console.log("Initialisering fullført.");
    } catch (error) { console.error("!!! FEIL UNDER INITIALISERING !!!", error); }
}
// === 2: INITIALISERING SLUTT ===


// === 3: CANVAS OPPSETT START ===
function setupCanvases() { const playContainer = document.querySelector('.game-area'); if (playContainer && gameCanvas) { gameCanvas.width = playContainer.clientWidth; gameCanvas.height = playContainer.clientHeight; } const recordContainer = document.querySelector('.record-piano-area'); if (recordContainer && recordPianoCanvas) { recordPianoCanvas.width = recordContainer.clientWidth; recordPianoCanvas.height = PIANO_HEIGHT_RECORD; } }
window.addEventListener('resize', () => { setupCanvases(); buildKeyMappings(); drawPianos(); });
// === 3: CANVAS OPPSETT SLUTT ===


// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() { console.log("Setter opp event listeners..."); function safeAddListener(element, eventType, handler, elementName) { if (element) { element.addEventListener(eventType, handler); } else { console.error(`FEIL: Kunne ikke finne elementet '${elementName}'!`); } } safeAddListener(tabButtonPlay, 'click', () => switchTab('play'), 'tabButtonPlay'); safeAddListener(tabButtonRecord, 'click', () => switchTab('record'), 'tabButtonRecord'); safeAddListener(songSelector, 'change', handleSongSelect, 'songSelector'); safeAddListener(bpmInputElement, 'change', handlePlaybackBpmChange, 'bpmInputElement'); safeAddListener(playButton, 'click', togglePlayback, 'playButton'); safeAddListener(volumeSlider, 'input', handleVolumeChange, 'volumeSlider'); safeAddListener(muteCheckbox, 'change', handleMuteToggle, 'muteCheckbox'); safeAddListener(recordModeSelector, 'change', handleRecordModeChange, 'recordModeSelector'); safeAddListener(startRecordButton, 'click', startRecording, 'startRecordButton'); safeAddListener(stopRecordButton, 'click', stopRecording, 'stopRecordButton'); safeAddListener(clearRecordButton, 'click', clearRecording, 'clearRecordButton'); safeAddListener(addStepNoteButton, 'click', addStepNote, 'addStepNoteButton'); safeAddListener(addRestButton, 'click', addStepRest, 'addRestButton'); safeAddListener(copyJsonButton, 'click', copyJsonToClipboard, 'copyJsonButton'); safeAddListener(recordPianoCanvas, 'mousedown', handleRecordPianoMouseDown, 'recordPianoCanvas'); safeAddListener(recordPianoCanvas, 'mouseup', handleRecordPianoMouseUp, 'recordPianoCanvas'); console.log("Event listeners satt opp."); }
function switchTab(tabName) { console.log("Bytter til fane:", tabName); const isPlayTab = tabName === 'play'; if (!playArea || !recordArea || !tabButtonPlay || !tabButtonRecord) return; playArea.classList.toggle('active', isPlayTab); recordArea.classList.toggle('active', !isPlayTab); tabButtonPlay.classList.toggle('active', isPlayTab); tabButtonRecord.classList.toggle('active', !isPlayTab); if (isPlayTab && isRecording) stopRecording(); if (!isPlayTab && isPlaying) { stopSoundPlayback(); pauseSongVisuals(); } setTimeout(() => { setupCanvases(); buildKeyMappings(); drawPianos(); }, 0); console.log(`Fanebytte til '${tabName}' fullført.`); }
function updateRecordModeUI() { if (!recordModeSelector || !stepModeControls || !realtimeModeControls || !addStepNoteButton || !addRestButton) return; recordingMode = recordModeSelector.value; const isStepMode = recordingMode === 'step'; stepModeControls.style.display = isStepMode ? 'flex' : 'none'; realtimeModeControls.style.display = isStepMode ? 'none' : 'flex'; addStepNoteButton.disabled = !isStepMode || selectedStepNote === null || isRecording; addRestButton.disabled = !isStepMode || isRecording; }
function populateSongSelector() { if (!songSelector) return; while (songSelector.options.length > 1) songSelector.remove(1); for (const filename in availableSongs) { const option = document.createElement('option'); option.value = filename; option.textContent = availableSongs[filename]; songSelector.appendChild(option); } }
function resetUI() { if (!playButton || !bpmInputElement || !songInfoDiv || !songSelector || !originalBpmSpan) return; playButton.disabled = true; playButton.textContent = "Spill av"; bpmInputElement.disabled = true; bpmInputElement.value = 100; originalBpmSpan.textContent = ""; songInfoDiv.textContent = "Velg en sang fra menyen"; songSelector.selectedIndex = 0; songSelector.disabled = false; console.log("UI resatt (Play Tab)."); }
function handleSongSelect(event) { const selectedFilename = event.target.value; console.log("handleSongSelect:", selectedFilename); activeKeys.clear(); if (!selectedFilename) { currentSong = null; resetUI(); resetPlayback(); drawPianos(); return; } const songPath = songsFolderPath + selectedFilename; songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`; playButton.disabled = true; bpmInputElement.disabled = true; songSelector.disabled = true; fetch(songPath) .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }) .then(data => { currentSong = data; if (!currentSong.tempo || !currentSong.notes) throw new Error("Invalid song format."); console.log("Sang lastet:", currentSong.title); songInfoDiv.textContent = `Klar: ${currentSong.title} (${currentSong.artist || 'Ukjent'})`; currentPlaybackBPM = currentSong.tempo; bpmInputElement.value = currentPlaybackBPM; originalBpmSpan.textContent = `(Original: ${currentSong.tempo} BPM)`; bpmInputElement.disabled = false; playButton.disabled = false; songSelector.disabled = false; resetPlayback(); }) .catch(error => { console.error("Feil ved lasting av sang:", error); songInfoDiv.textContent = `Feil: Kunne ikke laste sang. ${error.message}`; currentSong = null; resetUI(); resetPlayback(); drawPianos(); songSelector.disabled = false; }); }
function handlePlaybackBpmChange(event) { currentPlaybackBPM = parseInt(event.target.value, 10) || 100; }
function handleVolumeChange() { currentVolume = parseFloat(volumeSlider.value); if (masterGainNode && !isMuted && audioContext) masterGainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime); }
function handleMuteToggle() { isMuted = muteCheckbox.checked; if (masterGainNode && audioContext) masterGainNode.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioContext.currentTime); }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===


// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMappings() { if (gameCanvas) buildSpecificKeyMapping(gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay); if (recordPianoCanvas) buildSpecificKeyMapping(recordPianoCanvas, PIANO_HEIGHT_RECORD, keyMappingRecord); }
function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) { if (!canvasElement || canvasElement.width === 0) return; Object.keys(mappingObject).forEach(key => delete mappingObject[key]); const lastWhiteKey = keyInfo.filter(k => k.type === 'white').pop(); if (!lastWhiteKey) return; const pianoUnitsWidth = lastWhiteKey.xOffset + 1; const availableWidth = canvasElement.width; const actualWhiteKeyWidth = availableWidth / pianoUnitsWidth; const actualBlackKeyWidth = actualWhiteKeyWidth * blackKeyWidthRatio; const pianoStartX = 0; keyInfo.forEach(key => { const xBase = pianoStartX + key.xOffset * actualWhiteKeyWidth; if (key.type === 'white') { mappingObject[key.name] = { x: xBase, width: actualWhiteKeyWidth, type: 'white', height: pianoHeightPx }; } else { const adjustedX = xBase - actualBlackKeyWidth / 2; mappingObject[key.name] = { x: adjustedX, width: actualBlackKeyWidth, type: 'black', height: pianoHeightPx * blackKeyHeightRatio }; } }); }
function drawPianos() { if (gameCtx) drawSpecificPiano(gameCtx, gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay, activeKeys, KEY_HIGHLIGHT_COLOR); if (recordPianoCtx) drawRecordPiano(); }
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) { if (!ctx || Object.keys(mappingObject).length === 0) return; const pianoDrawHeight = canvasElement.height - pianoHeightPx; const blackKeyActualHeight = pianoHeightPx * blackKeyHeightRatio; ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.lineWidth = 1; keyInfo.forEach(key => { if (key.type === 'white') { const keyData = mappingObject[key.name]; if (!keyData) return; ctx.fillStyle = 'white'; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); if (activeHighlightKeys && activeHighlightKeys.has(key.name)) { ctx.fillStyle = highlightColor; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); } ctx.strokeStyle = '#555'; ctx.strokeRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); ctx.fillStyle = KEY_NAME_COLOR_WHITE; ctx.font = KEY_NAME_FONT; ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + keyData.height - 5); } }); keyInfo.forEach(key => { if (key.type === 'black') { const keyData = mappingObject[key.name]; if (!keyData) return; ctx.fillStyle = 'black'; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); if (activeHighlightKeys && activeHighlightKeys.has(key.name)) { ctx.fillStyle = highlightColor; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, keyData.height); } const textWidth = ctx.measureText(key.name).width; if (keyData.width > textWidth * 1.1) { ctx.fillStyle = KEY_NAME_COLOR_BLACK; ctx.font = KEY_NAME_FONT; ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + keyData.height - 5); } } });
} // *** DEN MANGLENDE KRØLLPARENTESEN ER LAGT TIL HER ***
function drawRecordPiano() { if (!recordPianoCtx) return; const highlightSet = new Set(); if (recordingMode === 'step' && selectedStepNote) highlightSet.add(selectedStepNote); drawSpecificPiano( recordPianoCtx, recordPianoCanvas, PIANO_HEIGHT_RECORD, keyMappingRecord, highlightSet, RECORD_KEY_HIGHLIGHT_COLOR ); }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
async function ensureAudioInitialized() { if (isAudioInitialized) return true; console.log("Forsøker å initialisere AudioContext..."); return initAudio(); }
async function togglePlayback() { if (!currentSong) return; if (!await ensureAudioInitialized()) { console.error("Lyd feilet."); return; } if (audioContext.state === 'suspended') await audioContext.resume(); if (isPlaying) { stopSoundPlayback(); pauseSongVisuals(); } else { playSong(); } }
function playSong() { if (!currentSong || !audioContext || isPlaying) return; isPlaying = true; playButton.textContent = "Stopp"; bpmInputElement.disabled = true; songSelector.disabled = true; playbackStartTime = performance.now() + PRE_ROLL_SECONDS * 1000; scheduleSongAudio(); if (!animationFrameId) gameLoop(); console.log("Avspilling startet."); }
function pauseSongVisuals() { isPlaying = false; playButton.textContent = "Spill av"; bpmInputElement.disabled = false; songSelector.disabled = false; if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; } activeKeys.clear(); drawPianos(); console.log("Visuell avspilling stoppet."); }
function resetPlayback() { console.log("resetPlayback: Kjører."); stopSoundPlayback(); if (isPlaying || animationFrameId) pauseSongVisuals(); playbackStartTime = 0; activeKeys.clear(); if (!currentSong) { playButton.disabled = true; bpmInputElement.disabled = true; } else { playButton.disabled = false; bpmInputElement.disabled = false; } songSelector.disabled = false; if (gameCtx) gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); drawPianos(); console.log("Avspilling nullstilt."); }
// === 6: AVSPILLINGS KONTROLL SLUTT ===


// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() { animationFrameId = requestAnimationFrame(gameLoop); if (!isPlaying) { animationFrameId = null; return; } const currentTime = performance.now(); const elapsedTimeInSeconds = (currentTime - playbackStartTime) / 1000; const beatsPerSecond = currentPlaybackBPM / 60; const currentBeat = elapsedTimeInSeconds * beatsPerSecond; if (!gameCtx || !gameCanvas) { console.error("gameLoop: gameCtx eller gameCanvas er null!"); return; } updateActiveKeys(currentBeat); gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); drawSpecificPiano(gameCtx, gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay, activeKeys, KEY_HIGHLIGHT_COLOR); drawFallingNotes(currentBeat); gameCtx.fillStyle = 'white'; gameCtx.font = '16px sans-serif'; gameCtx.textAlign = 'left'; gameCtx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20); gameCtx.textAlign = 'right'; gameCtx.fillText(`BPM: ${currentPlaybackBPM}`, gameCanvas.width - 10, 20); }
function updateActiveKeys(currentBeat) { activeKeys.clear(); if (!currentSong || !currentSong.notes) return; currentSong.notes.forEach(note => { const noteStartTime = note.time; const noteEndTime = note.time + note.duration; if (currentBeat >= noteStartTime && currentBeat < noteEndTime) { activeKeys.add(note.key); } }); }
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) { if (!currentSong || !currentSong.notes || !gameCtx || !gameCanvas || Object.keys(keyMappingPlay).length === 0) return; const secondsPerBeat = 60 / currentPlaybackBPM; const fallHeight = gameCanvas.height - PIANO_HEIGHT_PLAY; if (fallHeight <= 0) return; const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS; const pixelsPerBeat = pixelsPerSecond * secondsPerBeat; const targetLineY = gameCanvas.height - PIANO_HEIGHT_PLAY; currentSong.notes.forEach(note => { const keyData = keyMappingPlay[note.key]; if (!keyData) return; const targetBeat = note.time; const beatsUntilHit = targetBeat - currentBeat; const yBottom = targetLineY - (beatsUntilHit * pixelsPerBeat); const notePixelHeight = Math.max(1, note.duration * pixelsPerBeat); const yTop = yBottom - notePixelHeight; const xPosition = keyData.x; const noteWidth = keyData.width; if (yTop < gameCanvas.height && yBottom > 0) { gameCtx.fillStyle = (keyData.type === 'white') ? WHITE_NOTE_COLOR : BLACK_NOTE_COLOR; gameCtx.strokeStyle = NOTE_BORDER_COLOR; gameCtx.lineWidth = 1; gameCtx.beginPath(); if (gameCtx.roundRect) { gameCtx.roundRect(xPosition, yTop, noteWidth, notePixelHeight, NOTE_CORNER_RADIUS); } else { gameCtx.rect(xPosition, yTop, noteWidth, notePixelHeight); } gameCtx.fill(); gameCtx.stroke(); } }); }
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
document.addEventListener('DOMContentLoaded', initialize);
// === 9: START PROGRAMMET SLUTT ===


// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() { if (isAudioInitialized) return true; try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); masterGainNode = audioContext.createGain(); masterGainNode.connect(audioContext.destination); currentVolume = parseFloat(volumeSlider.value); isMuted = muteCheckbox.checked; masterGainNode.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioContext.currentTime); isAudioInitialized = true; console.log("AudioContext initialisert OK."); return true; } catch (e) { console.error("Web Audio API støttes ikke eller feilet.", e); alert("Kunne ikke initialisere lyd."); isAudioInitialized = false; return false; } }
function noteToFrequency(noteName) { if (!noteName) return null; const octave = parseInt(noteName.slice(-1)); const key = noteName.slice(0, -1); const keyIndex = noteNames.indexOf(key); if (keyIndex < 0) return null; const midiNum = 12 + (octave * 12) + keyIndex; const freq = Math.pow(2, (midiNum - A4_MIDI_NUM) / 12) * A4_FREQ; return freq; }
function scheduleSongAudio() { if (!currentSong || !audioContext || !masterGainNode) return; stopSoundPlayback(); console.log("scheduleSongAudio: Planlegger lyd..."); const audioStartTimeOffset = audioContext.currentTime + PRE_ROLL_SECONDS; const secondsPerBeat = 60.0 / currentPlaybackBPM; currentSong.notes.forEach(note => { const freq = noteToFrequency(note.key); if (freq === null) return; const noteStartAudioTime = audioStartTimeOffset + (note.time * secondsPerBeat); const noteEndAudioTime = noteStartAudioTime + (note.duration * secondsPerBeat); if (noteEndAudioTime <= noteStartAudioTime) return; const osc = audioContext.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, audioContext.currentTime); const noteGain = audioContext.createGain(); noteGain.gain.setValueAtTime(0, audioContext.currentTime); osc.connect(noteGain); noteGain.connect(masterGainNode); const attackTime = 0.01; const releaseTime = 0.05; const peakVolume = 0.8; noteGain.gain.linearRampToValueAtTime(peakVolume, noteStartAudioTime + attackTime); noteGain.gain.setValueAtTime(peakVolume, Math.max(noteStartAudioTime + attackTime, noteEndAudioTime - releaseTime)); noteGain.gain.linearRampToValueAtTime(0, noteEndAudioTime); osc.start(noteStartAudioTime); osc.stop(noteEndAudioTime + 0.1); scheduledAudioSources.push({ oscillator: osc, gain: noteGain }); }); console.log(`Planlagt ${scheduledAudioSources.length} noter.`); }
function stopSoundPlayback() { if (!audioContext) return; scheduledAudioSources.forEach(source => { try { source.gain.gain.cancelScheduledValues(audioContext.currentTime); source.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05); source.oscillator.stop(audioContext.currentTime + 0.1); } catch (e) {} }); scheduledAudioSources = []; }
function playFeedbackTone(noteName) { if (!audioContext || !masterGainNode) return; const freq = noteToFrequency(noteName); if (!freq) return; const osc = audioContext.createOscillator(); const gain = audioContext.createGain(); osc.connect(gain); gain.connect(masterGainNode); osc.type = 'sine'; osc.frequency.setValueAtTime(freq, audioContext.currentTime); gain.gain.setValueAtTime(0, audioContext.currentTime); gain.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.01); gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2); osc.start(audioContext.currentTime); osc.stop(audioContext.currentTime + 0.25); }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===


// === 11: INNSPILINGSFUNKSJONER START ===
function handleRecordModeChange() { updateRecordModeUI(); }
function getKeyAtRecordCoords(canvas, event) { if (!canvas) return null; const rect = canvas.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top; const pianoDrawHeight = canvas.height - PIANO_HEIGHT_RECORD; for (const key of keyInfo) { if (key.type === 'black') { const keyData = keyMappingRecord[key.name]; if (!keyData) continue; if (x >= keyData.x && x < keyData.x + keyData.width && y >= pianoDrawHeight && y < pianoDrawHeight + keyData.height) return key.name; } } for (const key of keyInfo) { if (key.type === 'white') { const keyData = keyMappingRecord[key.name]; if (!keyData) continue; if (x >= keyData.x && x < keyData.x + keyData.width && y >= pianoDrawHeight && y < pianoDrawHeight + keyData.height) return key.name; } } return null; }
async function handleRecordPianoMouseDown(event) { if (!await ensureAudioInitialized()) return; if (audioContext.state === 'suspended') await audioContext.resume(); const keyName = getKeyAtRecordCoords(recordPianoCanvas, event); if (!keyName) return; playFeedbackTone(keyName); if (recordingMode === 'step' && !isRecording) { selectedStepNote = keyName; addStepNoteButton.disabled = false; drawRecordPiano(); } else if (recordingMode === 'realtime' && isRecording) { console.log("TODO: Realtime note ON:", keyName); } }
function handleRecordPianoMouseUp(event) { if (recordingMode === 'realtime' && isRecording) { console.log("TODO: Realtime note OFF"); } }
function startRecording() { if (isRecording) return; isRecording = true; jsonOutputTextarea.value = ""; recordedRawNotes = []; recordedNotes = []; currentStepTime = 0; selectedStepNote = null; startRecordButton.disabled = true; stopRecordButton.disabled = false; clearRecordButton.disabled = true; recordModeSelector.disabled = true; recordTitleInput.disabled = true; recordArtistInput.disabled = true; recordTempoInput.disabled = true; if (recordingMode === 'realtime') { recordingStartTime = performance.now(); recordingStatusSpan.textContent = "Spiller inn..."; } else { recordingStatusSpan.textContent = ""; addStepNoteButton.disabled = true; addRestButton.disabled = false; drawRecordPiano(); } }
function stopRecording() { if (!isRecording) return; isRecording = false; startRecordButton.disabled = false; stopRecordButton.disabled = true; clearRecordButton.disabled = false; recordModeSelector.disabled = false; recordTitleInput.disabled = false; recordArtistInput.disabled = false; recordTempoInput.disabled = false; recordingStatusSpan.textContent = ""; addStepNoteButton.disabled = true; addRestButton.disabled = true; if (recordingMode === 'realtime') quantizeRecordedNotes(); generateJsonOutput(); drawRecordPiano(); }
function clearRecording() { if (isRecording) stopRecording(); recordedRawNotes = []; recordedNotes = []; jsonOutputTextarea.value = ""; currentStepTime = 0; selectedStepNote = null; clearRecordButton.disabled = true; drawRecordPiano(); }
function quantizeRecordedNotes() { console.warn("quantizeRecordedNotes() - Logikk mangler!"); recordedNotes = []; /* TODO: Implementer kvantisering */ }
function addStepNote() { if (!selectedStepNote || !isRecording) return; const duration = parseFloat(stepDurationSelector.value) || 1.0; recordedNotes.push({ key: selectedStepNote, time: currentStepTime, duration: duration }); currentStepTime += duration; generateJsonOutput(); selectedStepNote = null; addStepNoteButton.disabled = true; drawRecordPiano(); }
function addStepRest() { if (!isRecording) return; const duration = parseFloat(stepDurationSelector.value) || 1.0; currentStepTime += duration; console.log("Pause lagt til, tid flyttet til:", currentStepTime); generateJsonOutput(); }
function generateJsonOutput() { const outputData = { title: recordTitleInput.value || "Ny Sang", artist: recordArtistInput.value || "Ukjent", tempo: parseInt(recordTempoInput.value) || 120, notes: recordedNotes }; outputData.notes.sort((a, b) => a.time - b.time); try { jsonOutputTextarea.value = JSON.stringify(outputData, null, 2); } catch (e) { jsonOutputTextarea.value = "Feil: " + e.message; } }
function copyJsonToClipboard() { if (!jsonOutputTextarea.value) return; navigator.clipboard.writeText(jsonOutputTextarea.value) .then(() => { copyJsonButton.textContent = "Kopiert!"; setTimeout(() => { copyJsonButton.textContent = "Kopier JSON"; }, 1500); }) .catch(err => { console.error('Kunne ikke kopiere JSON: ', err); }); }
// === 11: INNSPILINGSFUNKSJONER SLUTT ===
