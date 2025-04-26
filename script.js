// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
// ... (Som i forrige 'Clean Fiksa Versjon') ...
const tabButtonPlay = document.getElementById('tabButtonPlay');
// ... (resten) ...
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d'); // *** Sjekk at denne brukes konsekvent for spillområdet ***
// ... (resten) ...
const recordPianoCanvas = document.getElementById('recordPianoCanvas');
const recordPianoCtx = recordPianoCanvas.getContext('2d'); // *** Sjekk at denne brukes konsekvent for innspilling ***
// ... (resten) ...
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===


// === 2: INITIALISERING START ===
function initialize() { /* ... som før ... */ }
// === 2: INITIALISERING SLUTT ===


// === 3: CANVAS OPPSETT START ===
function setupCanvases() { /* ... som før ... */ }
window.addEventListener('resize', () => { /* ... som før ... */ });
// === 3: CANVAS OPPSETT SLUTT ===


// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
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
function buildKeyMappings() { /* ... som før ... */ }
function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) { /* ... som før ... */ }
function drawPianos() { /* ... som før ... */ }
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) { /* ... som før - sjekk at ctx brukes riktig internt */ }
function drawRecordPiano() { /* ... som før ... */ }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
async function ensureAudioInitialized() { /* ... som før ... */ }
async function togglePlayback() { /* ... som før ... */ }
function playSong() { /* ... som før ... */ }
function pauseSongVisuals() { /* ... som før ... */ }
function resetPlayback() { /* ... som før ... */ }
// === 6: AVSPILLINGS KONTROLL SLUTT ===


// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop);
    if (!isPlaying) { animationFrameId = null; return; }
    const currentTime = performance.now();
    const elapsedTimeInSeconds = (currentTime - playbackStartTime) / 1000;
    const beatsPerSecond = currentPlaybackBPM / 60;
    const currentBeat = elapsedTimeInSeconds * beatsPerSecond;

    activeKeys.clear();

    // *** Bruk KUN gameCtx her ***
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height); // Tøm spill-canvas
    drawFallingNotes(currentBeat); // Tegn noter på spill-canvas
    drawPianos(); // Tegner begge pianoer, men drawSpecificPiano internt bruker riktig ctx

    // Tegn beat-teller på spill-canvas
    gameCtx.fillStyle = 'white'; gameCtx.font = '16px sans-serif';
    gameCtx.textAlign = 'left'; gameCtx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20);
    gameCtx.textAlign = 'right'; gameCtx.fillText(`BPM: ${currentPlaybackBPM}`, gameCanvas.width - 10, 20);
}
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) {
    if (!currentSong || !currentSong.notes || Object.keys(keyMappingPlay).length === 0) return;

    const secondsPerBeat = 60 / currentPlaybackBPM;
    const fallHeight = gameCanvas.height - PIANO_HEIGHT_PLAY;
    const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS;
    const pixelsPerBeat = pixelsPerSecond * secondsPerBeat;
    const targetLineY = gameCanvas.height - PIANO_HEIGHT_PLAY;

    // *** LOGGING AV FØRSTE NOTE ***
    let loggedFirstNote = false;

    currentSong.notes.forEach(note => {
        const keyData = keyMappingPlay[note.key];
        if (!keyData) return;

        const noteStartTime = note.time;
        const noteEndTime = note.time + note.duration;
        if (currentBeat >= noteStartTime && currentBeat < noteEndTime) activeKeys.add(note.key);

        const targetBeat = note.time;
        const beatsUntilHit = targetBeat - currentBeat;
        const yBottom = targetLineY - (beatsUntilHit * pixelsPerBeat);
        const notePixelHeight = Math.max(1, note.duration * pixelsPerBeat);
        const yTop = yBottom - notePixelHeight;
        const xPosition = keyData.x;
        const noteWidth = keyData.width;

        // *** Logg data for første note som BØR være synlig ***
        if (!loggedFirstNote && yTop < gameCanvas.height && yBottom > 0) {
            console.log(`Tegner note: key=${note.key}, x=${xPosition.toFixed(1)}, yTop=${yTop.toFixed(1)}, w=${noteWidth.toFixed(1)}, h=${notePixelHeight.toFixed(1)}, currentBeat=${currentBeat.toFixed(2)}`);
            loggedFirstNote = true; // Logg kun én gang per frame
        }

        if (yTop < gameCanvas.height && yBottom > 0) {
             // *** Sørg for å bruke gameCtx ***
            gameCtx.fillStyle = (keyData.type === 'white') ? WHITE_NOTE_COLOR : BLACK_NOTE_COLOR;
            gameCtx.strokeStyle = NOTE_BORDER_COLOR;
            gameCtx.lineWidth = 1;

            gameCtx.beginPath();
            if (gameCtx.roundRect) { gameCtx.roundRect(xPosition, yTop, noteWidth, notePixelHeight, NOTE_CORNER_RADIUS); }
            else { gameCtx.rect(xPosition, yTop, noteWidth, notePixelHeight); }
            gameCtx.fill();
            gameCtx.stroke();
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

// *** Forenklet scheduleSongAudio for testing ***
function scheduleSongAudio() {
    if (!currentSong || !audioContext || !masterGainNode) return;
    stopSoundPlayback();
    console.log("scheduleSongAudio: Planlegger lyd (FORENKLET TEST)...");

    // Bare spill en C4 ved start som test
    const freq = noteToFrequency("C4");
    if (!freq) return;
    const audioStartTime = audioContext.currentTime + PRE_ROLL_SECONDS;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.connect(gain); gain.connect(masterGainNode);
    osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.8, audioStartTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, audioStartTime + 0.5); // Kort tone
    osc.start(audioStartTime);
    osc.stop(audioStartTime + 0.6);
    scheduledAudioSources.push({ oscillator: osc, gain: gain }); // Fortsatt lagre for stopp
    console.log("scheduleSongAudio: Planla EN test-tone.");

    // Kommenter ut den faktiske planleggingen midlertidig:
    /*
    const audioStartTimeOffset = audioContext.currentTime + PRE_ROLL_SECONDS;
    const secondsPerBeat = 60.0 / currentPlaybackBPM;
    currentSong.notes.forEach(note => {
        const freq = noteToFrequency(note.key); if (freq === null) return;
        const noteStartAudioTime = audioStartTimeOffset + (note.time * secondsPerBeat);
        const noteEndAudioTime = noteStartAudioTime + (note.duration * secondsPerBeat);
        const osc = audioContext.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, audioContext.currentTime);
        const noteGain = audioContext.createGain(); noteGain.gain.setValueAtTime(0, audioContext.currentTime);
        osc.connect(noteGain); noteGain.connect(masterGainNode);
        const attackTime = 0.01; const releaseTime = 0.05; const peakVolume = 0.8;
        noteGain.gain.linearRampToValueAtTime(peakVolume, noteStartAudioTime + attackTime);
        noteGain.gain.setValueAtTime(peakVolume, noteEndAudioTime - releaseTime);
        noteGain.gain.linearRampToValueAtTime(0, noteEndAudioTime);
        osc.start(noteStartAudioTime); osc.stop(noteEndAudioTime + 0.1);
        scheduledAudioSources.push({ oscillator: osc, gain: noteGain });
    });
    console.log(`Planlagt ${currentSong.notes.length} noter for avspilling.`);
    */
}

function stopSoundPlayback() { /* ... som før ... */ }
function playFeedbackTone(noteName) { /* ... som før ... */ }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===


// === 11: INNSPILINGSFUNKSJONER START ===
function handleRecordModeChange() { /* ... som før ... */ }
function getKeyAtRecordCoords(canvas, event) { /* ... som før ... */ }

async function handleRecordPianoMouseDown(event) {
    console.log("--- Record Piano MouseDown EVENT START ---");
    if (!await ensureAudioInitialized()) { console.error("Lyd feilet."); return; }
    if (audioContext.state === 'suspended') await audioContext.resume();

    const keyName = getKeyAtRecordCoords(recordPianoCanvas, event);
    console.log("Mousedown key:", keyName);
    if (!keyName) return;

    playFeedbackTone(keyName);
    console.log("Feedback tone spilt."); // *** LOGG ETTER LYD ***

    if (recordingMode === 'step' && !isRecording) {
        selectedStepNote = keyName; addStepNoteButton.disabled = false; drawRecordPiano();
        console.log("Steg-modus: Note valgt."); // *** LOGG ETTER HANDLING ***
    } else if (recordingMode === 'realtime' && isRecording) {
        console.log("Sanntid note ON (TODO):", keyName);
    } else {
         console.log("Ingen handling for mouseDown i modus/status:", recordingMode, isRecording);
    }
}

function handleRecordPianoMouseUp(event) { /* ... som før ... */ }

function startRecording() {
    console.log("--- Start Recording Button Clicked ---"); // LOG
    if (isRecording) return;
    isRecording = true;
    // ... (resten som før)
    if (recordingMode === 'realtime') { /* ... */ console.log("startRecording: Sanntidsmodus startet."); }
    else { /* ... */ console.log("startRecording: Steg-modus startet."); }
}

function stopRecording() { /* ... som før ... */ }
function clearRecording() { /* ... som før ... */ }
function quantizeRecordedNotes() { /* ... som før (plassholder) ... */ }
function addStepNote() { /* ... som før ... */ }
function addStepRest() { /* ... som før ... */ }
function generateJsonOutput() { /* ... som før ... */ }
function copyJsonToClipboard() { /* ... som før ... */ }
// === 11: INNSPILINGSFUNKSJONER SLUTT ===
