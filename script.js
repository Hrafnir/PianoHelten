// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
// ... (Ingen endringer fra forrige komplette versjon) ...
const tabButtonPlay = document.getElementById('tabButtonPlay'); // etc.
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===


// === 2: INITIALISERING START ===
function initialize() { /* ... Som før ... */ }
// === 2: INITIALISERING SLUTT ===


// === 3: CANVAS OPPSETT START ===
function setupCanvases() { /* ... Som før ... */ }
window.addEventListener('resize', () => { /* ... Som før ... */ });
// === 3: CANVAS OPPSETT SLUTT ===


// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() { /* ... Som før ... */ }
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
function gameLoop(timestamp) { // timestamp kan være nyttig for debugging
    animationFrameId = requestAnimationFrame(gameLoop);
    if (!isPlaying) {
        // console.log("gameLoop: Stopper fordi isPlaying er false."); // Kan aktivere for debug
        animationFrameId = null;
        return;
    }

    // *** LOGG FOR Å BEKREFTE AT LØKKEN KJØRER ***
    // console.log(`gameLoop kjører - Tid: ${timestamp.toFixed(0)}`);

    const currentTime = performance.now();
    const elapsedTimeInSeconds = (currentTime - playbackStartTime) / 1000;
    const beatsPerSecond = currentPlaybackBPM / 60;
    const currentBeat = elapsedTimeInSeconds * beatsPerSecond;

    activeKeys.clear(); // Nullstill aktive taster for denne framen

    if (!gameCtx || !gameCanvas) { console.error("gameLoop: gameCtx eller gameCanvas er null!"); return; }

    // Tegn piano FØRST (drawSpecificPiano tømmer lerretet)
    // Vi MÅ sende inn activeKeys her for at highlight skal fungere
    drawSpecificPiano(gameCtx, gameCanvas, PIANO_HEIGHT_PLAY, keyMappingPlay, activeKeys, KEY_HIGHLIGHT_COLOR);

    // Tegn fallende noter OPPÅ pianoet
    drawFallingNotes(currentBeat);

    // Tegn UI-tekst OPPÅ alt annet
    gameCtx.fillStyle = 'white'; gameCtx.font = '16px sans-serif';
    gameCtx.textAlign = 'left'; gameCtx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20);
    gameCtx.textAlign = 'right'; gameCtx.fillText(`BPM: ${currentPlaybackBPM}`, gameCanvas.width - 10, 20);
}
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) {
    if (!currentSong || !currentSong.notes || !gameCtx || !gameCanvas || Object.keys(keyMappingPlay).length === 0) return;
    const secondsPerBeat = 60 / currentPlaybackBPM;
    const fallHeight = gameCanvas.height - PIANO_HEIGHT_PLAY;
    if (fallHeight <= 0) return;
    const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS;
    const pixelsPerBeat = pixelsPerSecond * secondsPerBeat;
    const targetLineY = gameCanvas.height - PIANO_HEIGHT_PLAY;

    currentSong.notes.forEach(note => {
        const keyData = keyMappingPlay[note.key]; if (!keyData) return;
        const noteStartTime = note.time; const noteEndTime = note.time + note.duration;
        // *** NB: activeKeys settes her, FØR highlight tegnes i neste gameLoop-kall ***
        if (currentBeat >= noteStartTime && currentBeat < noteEndTime) { activeKeys.add(note.key); }

        const targetBeat = note.time; const beatsUntilHit = targetBeat - currentBeat;
        const yBottom = targetLineY - (beatsUntilHit * pixelsPerBeat);
        const notePixelHeight = Math.max(1, note.duration * pixelsPerBeat);
        const yTop = yBottom - notePixelHeight;
        const xPosition = keyData.x; const noteWidth = keyData.width;

        if (yTop < gameCanvas.height && yBottom > 0) {
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
document.addEventListener('DOMContentLoaded', initialize);
// === 9: START PROGRAMMET SLUTT ===


// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() { /* ... Som før ... */ }
function noteToFrequency(noteName) { /* ... Som før ... */ }
// *** Gjenopprettet full scheduleSongAudio ***
function scheduleSongAudio() { if (!currentSong || !audioContext || !masterGainNode) return; stopSoundPlayback(); console.log("scheduleSongAudio: Planlegger lyd..."); const audioStartTimeOffset = audioContext.currentTime + PRE_ROLL_SECONDS; const secondsPerBeat = 60.0 / currentPlaybackBPM; currentSong.notes.forEach(note => { const freq = noteToFrequency(note.key); if (freq === null) return; const noteStartAudioTime = audioStartTimeOffset + (note.time * secondsPerBeat); const noteEndAudioTime = noteStartAudioTime + (note.duration * secondsPerBeat); if (noteEndAudioTime <= noteStartAudioTime) return; const osc = audioContext.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, audioContext.currentTime); const noteGain = audioContext.createGain(); noteGain.gain.setValueAtTime(0, audioContext.currentTime); osc.connect(noteGain); noteGain.connect(masterGainNode); const attackTime = 0.01; const releaseTime = 0.05; const peakVolume = 0.8; noteGain.gain.linearRampToValueAtTime(peakVolume, noteStartAudioTime + attackTime); noteGain.gain.setValueAtTime(peakVolume, Math.max(noteStartAudioTime + attackTime, noteEndAudioTime - releaseTime)); noteGain.gain.linearRampToValueAtTime(0, noteEndAudioTime); osc.start(noteStartAudioTime); osc.stop(noteEndAudioTime + 0.1); scheduledAudioSources.push({ oscillator: osc, gain: noteGain }); }); console.log(`Planlagt ${scheduledAudioSources.length} noter.`); }
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
