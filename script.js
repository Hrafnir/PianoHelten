// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
// Ingen endringer her
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
// Ingen endringer her
function initialize() { console.log("Initialiserer Piano Hero..."); setupCanvas(); buildKeyMapping(); drawPiano(); populateSongSelector(); setupEventListeners(); resetUI(); }
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
// Ingen endringer her
function setupCanvas() { const container = document.querySelector('.game-area'); canvas.width = container.clientWidth; canvas.height = container.clientHeight; console.log(`Canvas satt opp: ${canvas.width}x${canvas.height}`); buildKeyMapping(); }
window.addEventListener('resize', () => { setupCanvas(); activeKeys.clear(); drawPiano(); });
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    songSelector.addEventListener('change', handleSongSelect);
    bpmInputElement.addEventListener('change', handleBpmChange);
    playButton.addEventListener('click', togglePlayback);
    volumeSlider.addEventListener('input', handleVolumeChange);
    muteCheckbox.addEventListener('change', handleMuteToggle);
    console.log("Event listeners satt opp."); // LOGG
}

function populateSongSelector() {
    // Ingen endring her
    while (songSelector.options.length > 1) { songSelector.remove(1); }
    for (const filename in availableSongs) { const option = document.createElement('option'); option.value = filename; option.textContent = availableSongs[filename]; songSelector.appendChild(option); }
    console.log("Sangvelger fylt."); // LOGG
}

function resetUI() {
    // Ingen endring her
    playButton.disabled = true; playButton.textContent = "Spill av";
    bpmInputElement.disabled = true; bpmInputElement.value = 100; originalBpmSpan.textContent = "";
    songInfoDiv.textContent = "Velg en sang fra menyen";
    songSelector.selectedIndex = 0; songSelector.disabled = false; // Sørg for at den er enabled
    console.log("UI resatt."); // LOGG
}

// *** OPPGRADERT handleSongSelect med mer logging ***
function handleSongSelect() {
    console.log("handleSongSelect: Startet."); // LOGG 1

    const selectedFilename = songSelector.value;
    console.log("handleSongSelect: Valgt fil:", selectedFilename); // LOGG 2

    activeKeys.clear();

    if (!selectedFilename) {
        console.log("handleSongSelect: Ingen fil valgt, nullstiller."); // LOGG 3a
        currentSong = null;
        resetUI();
        resetPlayback();
        drawPiano();
        console.log("handleSongSelect: Nullstilling ferdig."); // LOGG 3b
        return;
    }

    // --- Fil er valgt, fortsetter ---
    console.log("handleSongSelect: Fil valgt, starter lasting..."); // LOGG 4

    const songPath = songsFolderPath + selectedFilename;
    console.log(`handleSongSelect: Forsøker å laste: ${songPath}`); // LOGG 5
    songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`;
    playButton.disabled = true;
    bpmInputElement.disabled = true;
    songSelector.disabled = true; // Deaktiver mens vi laster

    console.log("handleSongSelect: Kaller fetch..."); // LOGG 6
    fetch(songPath)
        .then(response => {
            console.log("handleSongSelect: Fetch mottok respons. Status:", response.status, "OK:", response.ok); // LOGG 7
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            console.log("handleSongSelect: Parser JSON..."); // LOGG 8
            return response.json();
        })
        .then(data => {
            console.log("handleSongSelect: JSON parset vellykket."); // LOGG 9
            currentSong = data;
            if (!currentSong.tempo || !currentSong.notes) {
                throw new Error("Sangfil mangler 'tempo' eller 'notes'.");
            }
            console.log("handleSongSelect: Sangdata validert OK."); // LOGG 10

            songInfoDiv.textContent = `Klar: ${currentSong.title || availableSongs[selectedFilename]} (${currentSong.artist || 'Ukjent'})`;
            currentPlaybackBPM = currentSong.tempo;
            bpmInputElement.value = currentPlaybackBPM;
            originalBpmSpan.textContent = `(Original: ${currentSong.tempo} BPM)`;
            bpmInputElement.disabled = false;
            playButton.disabled = false;
            songSelector.disabled = false; // Aktiver igjen etter vellykket last
            console.log("handleSongSelect: UI oppdatert, kaller resetPlayback."); // LOGG 11
            resetPlayback();
            console.log("handleSongSelect: Ferdig med vellykket last."); // LOGG 12

        })
        .catch(error => {
            console.error("handleSongSelect: FEIL i fetch-kjeden:", error); // LOGG Error
            songInfoDiv.textContent = `Feil: Kunne ikke laste sangen "${availableSongs[selectedFilename]}". ${error.message}`;
            currentSong = null;
            resetUI();
            resetPlayback();
            drawPiano();
            songSelector.disabled = false; // Sørg for at velgeren er aktiv etter feil
        });
    console.log("handleSongSelect: Fetch-kallet er startet (async)."); // LOGG 13
}


function handleBpmChange() { /* Ingen endring */ }
function handleVolumeChange() { /* Ingen endring */ }
function handleMuteToggle() { /* Ingen endring */ }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMapping() { /* Ingen endring */ }
function drawPiano() { /* Ingen endring */ }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() { /* Ingen endring, bortsett fra initAudio flyttet hit */
    if (!currentSong) return;
    if (!isAudioInitialized) { initAudio(); }
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
             console.log("AudioContext resumed.");
             if (isPlaying) { stopSoundPlayback(); pauseSongVisuals(); }
             else { playSong(); }
        }).catch(e => console.error("Error resuming AudioContext:", e));
    } else {
        if (isPlaying) { stopSoundPlayback(); pauseSongVisuals(); }
        else { playSong(); }
    }
}
function playSong() { /* Ingen endring */ }
function pauseSongVisuals() { /* Ingen endring */ }

// *** OPPGRADERT resetPlayback med tydeligere logikk for songSelector ***
function resetPlayback() {
    // Stopper visuelle elementer FØRST
    isPlaying = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Stopper lyd
    stopSoundPlayback(); // Sikrer at lyden stopper

    // Generell nullstilling
    startTime = 0;
    activeKeys.clear();

    // Reset UI-elementer relatert til avspillingstilstand
    playButton.textContent = "Spill av";

    if (currentSong) { // Hvis en sang ER lastet (selv om vi nullstiller avspilling)
        playButton.disabled = false;
        bpmInputElement.disabled = false;
        songSelector.disabled = false; // Hold aktivert hvis en sang er lastet
        console.log("resetPlayback: Sang er lastet, kontroller aktivert."); // LOGG
    } else { // Hvis INGEN sang er lastet (f.eks. etter "-- velg --" eller lastefeil)
        playButton.disabled = true;
        bpmInputElement.disabled = true;
        songSelector.disabled = false; // Velgeren skal alltid være brukbar med mindre den lastes aktivt
        console.log("resetPlayback: Ingen sang lastet, kontroller deaktivert (unntatt velger)."); // LOGG
    }

    // Rydd opp canvas og tegn piano
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPiano(); // Tegn piano (uten highlights)
    console.log("resetPlayback: Avspilling nullstilt ferdig."); // LOGG
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE START ===
function gameLoop() { /* Ingen endring */ }
// === 7: ANIMASJONSLØKKE SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) { /* Ingen endring */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===

// === 9: START PROGRAMMET START ===
initialize();
// === 9: START PROGRAMMET SLUTT ===

// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() { /* Ingen endring */ }
function noteToFrequency(noteName) { /* Ingen endring */ }
function scheduleSongAudio() { /* Ingen endring */ }
function stopSoundPlayback() { /* Ingen endring */ }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===
