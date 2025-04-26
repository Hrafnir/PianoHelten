// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
// ... (ingen endringer her) ...
const songSelector = document.getElementById('songSelector');
const bpmInputElement = document.getElementById('bpmInput');
const originalBpmSpan = document.getElementById('originalBpm');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const volumeSlider = document.getElementById('volumeSlider');
const muteCheckbox = document.getElementById('muteCheckbox');

const availableSongs = {
    "twinkle_twinkle.json": "Twinkle Twinkle Little Star",
    "pink_panther_melody.json": "Pink Panther (Melody)"
};
const songsFolderPath = 'songs/';

let currentSong = null;
let currentPlaybackBPM = 100;
let isPlaying = false;
let animationFrameId = null;
let startTime = 0;
let activeKeys = new Set();

let audioContext = null;
let masterGainNode = null;
let isAudioInitialized = false;
let currentVolume = 0.7;
let isMuted = false;
let scheduledAudioSources = [];

const keyInfo = [ { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 }, { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 }, { name: "E4", type: "white", xOffset: 2 }, { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 }, { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 }, { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 }, { name: "B4", type: "white", xOffset: 6 }, { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 }, { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 }, { name: "E5", type: "white", xOffset: 9 }, { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 }, { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 }, { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 }, { name: "B5", type: "white", xOffset: 13 }, { name: "C6", type: "white", xOffset: 14 } ];
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

const A4_FREQ = 440.0;
const A4_MIDI_NUM = 69;
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===

// === 2: INITIALISERING START ===
// ... (ingen endringer her) ...
function initialize() { console.log("Initialiserer Piano Hero..."); setupCanvas(); buildKeyMapping(); drawPiano(); populateSongSelector(); setupEventListeners(); resetUI(); }
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
// ... (ingen endringer her) ...
function setupCanvas() { const container = document.querySelector('.game-area'); canvas.width = container.clientWidth; canvas.height = container.clientHeight; console.log(`Canvas satt opp: ${canvas.width}x${canvas.height}`); buildKeyMapping(); }
window.addEventListener('resize', () => { setupCanvas(); activeKeys.clear(); drawPiano(); });
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
// ... (ingen endringer her, inkludert loggingen fra forrige gang) ...
function setupEventListeners() { songSelector.addEventListener('change', handleSongSelect); bpmInputElement.addEventListener('change', handleBpmChange); playButton.addEventListener('click', togglePlayback); volumeSlider.addEventListener('input', handleVolumeChange); muteCheckbox.addEventListener('change', handleMuteToggle); console.log("Event listeners satt opp."); }
function populateSongSelector() { while (songSelector.options.length > 1) { songSelector.remove(1); } for (const filename in availableSongs) { const option = document.createElement('option'); option.value = filename; option.textContent = availableSongs[filename]; songSelector.appendChild(option); } console.log("Sangvelger fylt."); }
function resetUI() { playButton.disabled = true; playButton.textContent = "Spill av"; bpmInputElement.disabled = true; bpmInputElement.value = 100; originalBpmSpan.textContent = ""; songInfoDiv.textContent = "Velg en sang fra menyen"; songSelector.selectedIndex = 0; songSelector.disabled = false; console.log("UI resatt."); }
function handleSongSelect() { console.log("handleSongSelect: Startet."); const selectedFilename = songSelector.value; console.log("handleSongSelect: Valgt fil:", selectedFilename); activeKeys.clear(); if (!selectedFilename) { console.log("handleSongSelect: Ingen fil valgt, nullstiller."); currentSong = null; resetUI(); resetPlayback(); drawPiano(); console.log("handleSongSelect: Nullstilling ferdig."); return; } console.log("handleSongSelect: Fil valgt, starter lasting..."); const songPath = songsFolderPath + selectedFilename; console.log(`handleSongSelect: Forsøker å laste: ${songPath}`); songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`; playButton.disabled = true; bpmInputElement.disabled = true; songSelector.disabled = true; console.log("handleSongSelect: Kaller fetch..."); fetch(songPath) .then(response => { console.log("handleSongSelect: Fetch mottok respons. Status:", response.status, "OK:", response.ok); if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`); } console.log("handleSongSelect: Parser JSON..."); return response.json(); }) .then(data => { console.log("handleSongSelect: JSON parset vellykket."); currentSong = data; if (!currentSong.tempo || !currentSong.notes) { throw new Error("Sangfil mangler 'tempo' eller 'notes'."); } console.log("handleSongSelect: Sangdata validert OK."); songInfoDiv.textContent = `Klar: ${currentSong.title || availableSongs[selectedFilename]} (${currentSong.artist || 'Ukjent'})`; currentPlaybackBPM = currentSong.tempo; bpmInputElement.value = currentPlaybackBPM; originalBpmSpan.textContent = `(Original: ${currentSong.tempo} BPM)`; bpmInputElement.disabled = false; playButton.disabled = false; songSelector.disabled = false; console.log("handleSongSelect: UI oppdatert, kaller resetPlayback."); resetPlayback(); console.log("handleSongSelect: Ferdig med vellykket last."); }) .catch(error => { console.error("handleSongSelect: FEIL i fetch-kjeden:", error); songInfoDiv.textContent = `Feil: Kunne ikke laste sangen "${availableSongs[selectedFilename]}". ${error.message}`; currentSong = null; resetUI(); resetPlayback(); drawPiano(); songSelector.disabled = false; }); console.log("handleSongSelect: Fetch-kallet er startet (async)."); }
function handleBpmChange() { const newBpm = parseInt(bpmInputElement.value, 10); if (isNaN(newBpm) || newBpm < 20 || newBpm > 300) { bpmInputElement.value = currentPlaybackBPM; console.warn("Ugyldig BPM verdi."); return; } currentPlaybackBPM = newBpm; console.log(`Playback BPM endret til: ${currentPlaybackBPM}`); }
function handleVolumeChange() { currentVolume = parseFloat(volumeSlider.value); if (masterGainNode) { if (!isMuted) { masterGainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime); } console.log(`Volum satt til: ${currentVolume.toFixed(2)}`); } }
function handleMuteToggle() { isMuted = muteCheckbox.checked; if (masterGainNode) { if (isMuted) { masterGainNode.gain.setValueAtTime(0, audioContext.currentTime); console.log("Lyd Muted"); } else { masterGainNode.gain.setValueAtTime(currentVolume, audioContext.currentTime); console.log("Lyd Unmuted"); } } }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
// ... (ingen endringer her) ...
function buildKeyMapping() { Object.keys(keyMapping).forEach(key => delete keyMapping[key]); const lastWhiteKey = keyInfo.filter(k => k.type === 'white').pop(); if (!lastWhiteKey) { console.error("Ingen hvite taster definert i keyInfo"); return; } const pianoUnitsWidth = lastWhiteKey.xOffset + 1; const availableWidth = canvas.width; const actualWhiteKeyWidth = availableWidth / pianoUnitsWidth; const actualBlackKeyWidth = actualWhiteKeyWidth * blackKeyWidthRatio; const pianoPixelWidth = canvas.width; const pianoStartX = 0; keyInfo.forEach(key => { const xBase = pianoStartX + key.xOffset * actualWhiteKeyWidth; if (key.type === 'white') { keyMapping[key.name] = { x: xBase, width: actualWhiteKeyWidth, type: 'white', baseXOffset: key.xOffset }; } else { const adjustedX = xBase - actualBlackKeyWidth / 2; keyMapping[key.name] = { x: adjustedX, width: actualBlackKeyWidth, type: 'black', baseXOffset: key.xOffset }; } }); }
function drawPiano() { if (Object.keys(keyMapping).length === 0) return; const pianoDrawHeight = canvas.height - pianoHeight; ctx.fillStyle = '#333'; ctx.fillRect(0, pianoDrawHeight -1, canvas.width, pianoHeight + 1); ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; keyInfo.forEach(key => { if (key.type === 'white') { const keyData = keyMapping[key.name]; if (!keyData) return; ctx.fillStyle = 'white'; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight); if (activeKeys.has(key.name)) { ctx.fillStyle = KEY_HIGHLIGHT_COLOR; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight); } ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight); ctx.fillStyle = KEY_NAME_COLOR_WHITE; ctx.font = KEY_NAME_FONT; ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + pianoHeight - 5); } }); keyInfo.forEach(key => { if (key.type === 'black') { const keyData = keyMapping[key.name]; if (!keyData) return; ctx.fillStyle = 'black'; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, blackKeyHeight); if (activeKeys.has(key.name)) { ctx.fillStyle = KEY_HIGHLIGHT_COLOR; ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, blackKeyHeight); } const textWidth = ctx.measureText(key.name).width; if (keyData.width > textWidth * 1.2) { ctx.fillStyle = KEY_NAME_COLOR_BLACK; ctx.font = KEY_NAME_FONT; ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + blackKeyHeight - 5); } } }); }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() {
    console.log("togglePlayback: Kjører. isPlaying:", isPlaying); // LOGG
    if (!currentSong) {
        console.log("togglePlayback: Ingen sang lastet, avbryter."); // LOGG
        return;
    }

    // Initialiser AudioContext ved første brukerinteraksjon
    if (!isAudioInitialized) {
        console.log("togglePlayback: Initialiserer AudioContext..."); // LOGG
        initAudio();
        if (!isAudioInitialized) { // Dobbeltsjekk om init feilet
             console.log("togglePlayback: AudioContext initialisering feilet, avbryter."); // LOGG
             return;
        }
    }

    // Håndter suspended AudioContext
    if (audioContext && audioContext.state === 'suspended') {
        console.log("togglePlayback: AudioContext er suspended, forsøker resume..."); // LOGG
        audioContext.resume().then(() => {
            console.log("togglePlayback: AudioContext resumed successfully."); // LOGG
            // Nå som context kjører, kall togglePlayback på nytt for å håndtere play/stop
            togglePlayback();
        }).catch(e => {
            console.error("togglePlayback: Error resuming AudioContext:", e); // LOGG Error
            // Ikke fortsett hvis resume feiler
        });
        return; // Viktig: Ikke fortsett før resume er håndtert
    }

    // Nå vet vi at AudioContext er (forhåpentligvis) klar

    if (isPlaying) {
        console.log("togglePlayback: Stopper avspilling..."); // LOGG
        stopSoundPlayback();
        pauseSongVisuals(); // Denne setter isPlaying=false og animationFrameId=null
    } else {
        console.log("togglePlayback: Starter avspilling..."); // LOGG
        playSong(); // Denne setter isPlaying=true og starter gameLoop
    }
}

function playSong() {
    if (!currentSong || !audioContext) {
         console.log("playSong: Ingen sang eller audioContext, avbryter."); // LOGG
         return;
    }
    if (isPlaying) { // Ekstra sjekk for å unngå dobbel start
         console.log("playSong: Kalles, men isPlaying er allerede true. Avbryter."); // LOGG
         return;
    }

    console.log("playSong: Setter isPlaying = true"); // LOGG
    isPlaying = true;
    playButton.textContent = "Stopp";
    bpmInputElement.disabled = true;
    songSelector.disabled = true;

    // Visuell start
    startTime = performance.now() + PRE_ROLL_SECONDS * 1000;
    console.log(`playSong: Starter visuell avspilling (BPM: ${currentPlaybackBPM}) med pre-roll...`); // LOGG

    // Start gameLoop KUN hvis den ikke allerede kjører
    console.log("playSong: Sjekker animationFrameId før start av gameLoop. Nåværende ID:", animationFrameId); // LOGG
    if (!animationFrameId) {
        console.log("playSong: animationFrameId er null, starter gameLoop()."); // LOGG
        gameLoop();
    } else {
         console.warn("playSong: Forsøkte å starte gameLoop, men animationFrameId var ikke null:", animationFrameId); // LOGG Advarsel
    }

    // Lyd start - Planlegg alle noter
    console.log("playSong: Kaller scheduleSongAudio()."); // LOGG
    scheduleSongAudio();
    console.log("playSong: Ferdig."); // LOGG
}

// Funksjon for å stoppe/pause det visuelle
function pauseSongVisuals() {
    console.log("pauseSongVisuals: Kjører."); // LOGG
    isPlaying = false; // Sett FØR knappen endres
    playButton.textContent = "Spill av";
    bpmInputElement.disabled = false;
    songSelector.disabled = false;

    console.log("pauseSongVisuals: Stopper animasjonsløkke. Nåværende ID:", animationFrameId); // LOGG
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null; // *** Sørg for at den blir nullstilt! ***
        console.log("pauseSongVisuals: animationFrameId nullstilt."); // LOGG
    } else {
        console.log("pauseSongVisuals: Ingen animationFrameId å stoppe."); // LOGG
    }
    activeKeys.clear();
    drawPiano();
    console.log("pauseSongVisuals: Visuell avspilling stoppet."); // LOGG
}

// Denne kalles når ny sang velges, eller ved full stopp/feil.
function resetPlayback() {
    console.log("resetPlayback: Kjører."); // LOGG
    // Stopp visuelle elementer FØRST for å nullstille animationFrameId
    pauseSongVisuals();
    // Stopp lyd
    stopSoundPlayback();

    // Generell nullstilling
    startTime = 0;
    // activeKeys ble tømt i pauseSongVisuals

    // Reset UI-elementer relatert til avspillingstilstand
    // playButton.textContent ble satt i pauseSongVisuals

    if (currentSong) { // Hvis en sang ER lastet
        playButton.disabled = false;
        bpmInputElement.disabled = false;
        songSelector.disabled = false;
        console.log("resetPlayback: Sang er lastet, kontroller aktivert."); // LOGG
    } else { // Hvis INGEN sang er lastet
        playButton.disabled = true;
        bpmInputElement.disabled = true;
        songSelector.disabled = false;
        console.log("resetPlayback: Ingen sang lastet, kontroller deaktivert (unntatt velger)."); // LOGG
    }

    // Rydd opp canvas og tegn piano
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPiano();
    console.log("resetPlayback: Avspilling nullstilt ferdig."); // LOGG
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE START ===
function gameLoop() {
    // Forespør neste frame FØR vi gjør noe annet
    animationFrameId = requestAnimationFrame(gameLoop);

    // Sjekk om vi fortsatt skal spille av ETTER å ha satt neste frame
    if (!isPlaying) {
        // Vi bør ikke komme hit hvis pause/stopp fungerer, men som en failsafe:
        console.warn("gameLoop: Kjører, men isPlaying er false. Stopper løkken.");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        return;
    }

    const currentTime = performance.now();
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    const beatsPerSecond = currentPlaybackBPM / 60;
    const currentBeat = elapsedTimeInSeconds * beatsPerSecond;

    activeKeys.clear();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFallingNotes(currentBeat);
    drawPiano();

    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`BPM: ${currentPlaybackBPM}`, canvas.width - 10, 20);
}
// === 7: ANIMASJONSLØKKE SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
// ... (ingen endringer her) ...
function drawFallingNotes(currentBeat) { if (!currentSong || !currentSong.notes || Object.keys(keyMapping).length === 0) return; const secondsPerBeat = 60 / currentPlaybackBPM; const fallHeight = canvas.height - pianoHeight; const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS; const pixelsPerBeat = pixelsPerSecond * secondsPerBeat; const targetLineY = canvas.height - pianoHeight; currentSong.notes.forEach(note => { const keyData = keyMapping[note.key]; if (!keyData) return; const noteStartTime = note.time; const noteEndTime = note.time + note.duration; if (currentBeat >= noteStartTime && currentBeat < noteEndTime) { activeKeys.add(note.key); } const targetBeat = note.time; const beatsUntilHit = targetBeat - currentBeat; const yBottom = targetLineY - (beatsUntilHit * pixelsPerBeat); const notePixelHeight = note.duration * pixelsPerBeat; const yTop = yBottom - notePixelHeight; const xPosition = keyData.x; const noteWidth = keyData.width; if (yTop < canvas.height && yBottom > 0) { ctx.fillStyle = (keyData.type === 'white') ? WHITE_NOTE_COLOR : BLACK_NOTE_COLOR; ctx.fillRect(xPosition, yTop, noteWidth, notePixelHeight); ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xPosition, yBottom); ctx.lineTo(xPosition + noteWidth, yBottom); ctx.stroke(); } }); }
// === 8: TEGNE FALLENDE NOTER SLUTT ===

// === 9: START PROGRAMMET START ===
initialize();
// === 9: START PROGRAMMET SLUTT ===

// === 10: WEB AUDIO FUNKSJONER START ===
// ... (ingen endringer her) ...
function initAudio() { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); masterGainNode = audioContext.createGain(); masterGainNode.connect(audioContext.destination); currentVolume = parseFloat(volumeSlider.value); isMuted = muteCheckbox.checked; masterGainNode.gain.setValueAtTime(isMuted ? 0 : currentVolume, audioContext.currentTime); isAudioInitialized = true; console.log("AudioContext initialisert."); } catch (e) { console.error("Web Audio API støttes ikke i denne nettleseren.", e); alert("Beklager, nettleseren din støtter ikke lyden som trengs for denne appen."); } }
function noteToFrequency(noteName) { const octave = parseInt(noteName.slice(-1)); const key = noteName.slice(0, -1); const keyIndex = noteNames.indexOf(key); if (keyIndex < 0) { console.warn(`Ukjent notenavn: ${noteName}`); return null; } const midiNum = 12 + (octave * 12) + keyIndex; const freq = Math.pow(2, (midiNum - A4_MIDI_NUM) / 12) * A4_FREQ; return freq; }
function scheduleSongAudio() { if (!currentSong || !audioContext || !masterGainNode) return; stopSoundPlayback(); const audioStartTimeOffset = audioContext.currentTime + PRE_ROLL_SECONDS; const secondsPerBeat = 60.0 / currentPlaybackBPM; currentSong.notes.forEach(note => { const freq = noteToFrequency(note.key); if (freq === null) return; const noteStartAudioTime = audioStartTimeOffset + (note.time * secondsPerBeat); const noteEndAudioTime = noteStartAudioTime + (note.duration * secondsPerBeat); const osc = audioContext.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(freq, audioContext.currentTime); const noteGain = audioContext.createGain(); noteGain.gain.setValueAtTime(0, audioContext.currentTime); osc.connect(noteGain); noteGain.connect(masterGainNode); const attackTime = 0.01; const releaseTime = 0.05; const peakVolume = 0.8; noteGain.gain.linearRampToValueAtTime(peakVolume, noteStartAudioTime + attackTime); noteGain.gain.setValueAtTime(peakVolume, noteEndAudioTime - releaseTime); noteGain.gain.linearRampToValueAtTime(0, noteEndAudioTime); osc.start(noteStartAudioTime); osc.stop(noteEndAudioTime + 0.1); scheduledAudioSources.push({ oscillator: osc, gain: noteGain }); }); console.log(`Planlagt ${currentSong.notes.length} noter for avspilling.`); }
function stopSoundPlayback() { if (!audioContext || !masterGainNode) return; console.log(`Stopper ${scheduledAudioSources.length} lydkilder...`); scheduledAudioSources.forEach(source => { try { source.gain.gain.cancelScheduledValues(audioContext.currentTime); source.gain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.05); source.oscillator.stop(audioContext.currentTime + 0.1); } catch (e) { } }); scheduledAudioSources = []; console.log("Alle lydkilder stoppet og listen tømt."); }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===
