// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
const songSelector = document.getElementById('songSelector');
const bpmInputElement = document.getElementById('bpmInput');
const originalBpmSpan = document.getElementById('originalBpm');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Context for å tegne på canvas

const availableSongs = {
    "twinkle_twinkle.json": "Twinkle Twinkle Little Star",
    "pink_panther_melody.json": "Pink Panther (Melody)"
    // Legg til flere sanger her etterhvert
};
const songsFolderPath = 'songs/';

let currentSong = null;
let currentPlaybackBPM = 100;
let audioContext = null;
let isPlaying = false;
let animationFrameId = null;
let startTime = 0;
let activeKeys = new Set(); // *** NY: Holder styr på tangenter som skal lyse opp ***
const NOTE_HIT_TOLERANCE_BEATS = 0.1; // *** NY: Hvor nærme noten må være for å lyse opp tangenten (i beats) ***

// Piano-konstanter
const keyInfo = [
    { name: "C4", type: "white", xOffset: 0 }, { name: "C#4", type: "black", xOffset: 0.7 },
    { name: "D4", type: "white", xOffset: 1 }, { name: "D#4", type: "black", xOffset: 1.7 },
    { name: "E4", type: "white", xOffset: 2 },
    { name: "F4", type: "white", xOffset: 3 }, { name: "F#4", type: "black", xOffset: 3.7 },
    { name: "G4", type: "white", xOffset: 4 }, { name: "G#4", type: "black", xOffset: 4.7 },
    { name: "A4", type: "white", xOffset: 5 }, { name: "A#4", type: "black", xOffset: 5.7 },
    { name: "B4", type: "white", xOffset: 6 },
    { name: "C5", type: "white", xOffset: 7 }, { name: "C#5", type: "black", xOffset: 7.7 },
    { name: "D5", type: "white", xOffset: 8 }, { name: "D#5", type: "black", xOffset: 8.7 },
    { name: "E5", type: "white", xOffset: 9 },
    { name: "F5", type: "white", xOffset: 10 }, { name: "F#5", type: "black", xOffset: 10.7 },
    { name: "G5", type: "white", xOffset: 11 }, { name: "G#5", type: "black", xOffset: 11.7 },
    { name: "A5", type: "white", xOffset: 12 }, { name: "A#5", type: "black", xOffset: 12.7 },
    { name: "B5", type: "white", xOffset: 13 },
    { name: "C6", type: "white", xOffset: 14 }
];
const pianoHeight = 120;
const whiteKeyWidth = 40;
const blackKeyWidth = whiteKeyWidth * 0.6;
const blackKeyHeight = pianoHeight * 0.6;
const keyMapping = {};

// Spill-konstanter
const PRE_ROLL_SECONDS = 3;
const NOTE_FALL_SECONDS = 6;
const KEY_HIGHLIGHT_COLOR = 'rgba(255, 255, 0, 0.6)'; // Gul highlight
const WHITE_NOTE_COLOR = 'cyan';
const BLACK_NOTE_COLOR = 'magenta';
const KEY_NAME_FONT = '11px sans-serif';
const KEY_NAME_COLOR_WHITE = 'black';
const KEY_NAME_COLOR_BLACK = 'white';
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===

// === 2: INITIALISERING START ===
function initialize() {
    console.log("Initialiserer Piano Hero...");
    setupCanvas();
    buildKeyMapping();
    drawPiano(); // Tegn pianoet med en gang (inkl. navn)
    populateSongSelector();
    setupEventListeners();
    resetUI();
}
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
function setupCanvas() {
    const container = document.querySelector('.game-area');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    console.log(`Canvas satt opp: ${canvas.width}x${canvas.height}`);
    buildKeyMapping();
}

window.addEventListener('resize', () => {
    setupCanvas();
    // Tegn piano på nytt ved resize (viktig pga. navn og mapping)
    activeKeys.clear(); // Ingen taster er aktive ved resize
    drawPiano();
});
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    songSelector.addEventListener('change', handleSongSelect);
    bpmInputElement.addEventListener('change', handleBpmChange);
    playButton.addEventListener('click', togglePlayback);
}

function populateSongSelector() {
    while (songSelector.options.length > 1) {
        songSelector.remove(1);
    }
    for (const filename in availableSongs) {
        const option = document.createElement('option');
        option.value = filename;
        option.textContent = availableSongs[filename];
        songSelector.appendChild(option);
    }
}

function resetUI() {
    playButton.disabled = true;
    playButton.textContent = "Spill av";
    bpmInputElement.disabled = true;
    bpmInputElement.value = 100;
    originalBpmSpan.textContent = "";
    songInfoDiv.textContent = "Velg en sang fra menyen";
    songSelector.selectedIndex = 0;
    songSelector.disabled = false; // Sørg for at man kan velge sang
}

function handleSongSelect() {
    const selectedFilename = songSelector.value;
    activeKeys.clear(); // Fjern highlights når ny sang velges
    if (!selectedFilename) {
        currentSong = null;
        resetUI();
        resetPlayback();
        drawPiano(); // Tegn tomt piano
        return;
    }

    const songPath = songsFolderPath + selectedFilename;
    console.log(`Laster sang: ${songPath}`);
    songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`;
    playButton.disabled = true;
    bpmInputElement.disabled = true;

    fetch(songPath)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            currentSong = data;
            console.log("Sang lastet:", currentSong);
            if (!currentSong.tempo || !currentSong.notes) {
                throw new Error("Sangfil mangler 'tempo' eller 'notes'.");
            }
            songInfoDiv.textContent = `Klar: ${currentSong.title || availableSongs[selectedFilename]} (${currentSong.artist || 'Ukjent'})`;
            currentPlaybackBPM = currentSong.tempo;
            bpmInputElement.value = currentPlaybackBPM;
            originalBpmSpan.textContent = `(Original: ${currentSong.tempo} BPM)`;
            bpmInputElement.disabled = false;
            playButton.disabled = false;
            resetPlayback(); // Nullstiller spilltilstand, men ikke UI som er satt over
        })
        .catch(error => {
            console.error("Feil ved lasting eller parsing av sang:", error);
            songInfoDiv.textContent = `Feil: Kunne ikke laste sangen "${availableSongs[selectedFilename]}". Sjekk filen og konsollen.`;
            currentSong = null;
            resetUI();
            resetPlayback(); // Nullstill også spilltilstand ved feil
            drawPiano(); // Tegn tomt piano ved feil
        });
}

function handleBpmChange() {
    const newBpm = parseInt(bpmInputElement.value, 10);
    if (isNaN(newBpm) || newBpm < 20 || newBpm > 300) {
        bpmInputElement.value = currentPlaybackBPM;
        console.warn("Ugyldig BPM verdi.");
        return;
    }
    currentPlaybackBPM = newBpm;
    console.log(`Playback BPM endret til: ${currentPlaybackBPM}`);
}
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMapping() {
    Object.keys(keyMapping).forEach(key => delete keyMapping[key]);

    const totalWhiteKeysInDefinition = keyInfo.filter(k => k.type === 'white').length;
    const lastWhiteKey = keyInfo.filter(k => k.type === 'white').pop();
    if (!lastWhiteKey) { console.error("Ingen hvite taster definert i keyInfo"); return; }
    const pianoUnitsWidth = lastWhiteKey.xOffset + 1;

    const availableWidth = canvas.width * 0.98;
    const calculatedWhiteKeyWidth = availableWidth / pianoUnitsWidth;
    const actualWhiteKeyWidth = Math.min(whiteKeyWidth, calculatedWhiteKeyWidth);
    const actualBlackKeyWidth = actualWhiteKeyWidth * (blackKeyWidth / whiteKeyWidth);
    const pianoPixelWidth = pianoUnitsWidth * actualWhiteKeyWidth;
    const pianoStartX = (canvas.width - pianoPixelWidth) / 2;

    keyInfo.forEach(key => {
        const xBase = pianoStartX + key.xOffset * actualWhiteKeyWidth;
        if (key.type === 'white') {
            keyMapping[key.name] = {
                x: xBase, width: actualWhiteKeyWidth, type: 'white', baseXOffset: key.xOffset
            };
        } else {
            const adjustedX = xBase - actualBlackKeyWidth / 2;
             keyMapping[key.name] = {
                x: adjustedX, width: actualBlackKeyWidth, type: 'black', baseXOffset: key.xOffset
             };
        }
    });
}

function drawPiano() {
    if (Object.keys(keyMapping).length === 0) return;

    const pianoDrawHeight = canvas.height - pianoHeight;
    ctx.fillStyle = '#333';
    ctx.fillRect(0, pianoDrawHeight -1, canvas.width, pianoHeight + 1);
    ctx.textAlign = 'center'; // Felles for alle tangentnavn

    // Tegn hvite tangenter + navn + highlight
    keyInfo.forEach(key => {
        if (key.type === 'white') {
            const keyData = keyMapping[key.name];
            if (!keyData) return;
            // Tegn tangent
            ctx.fillStyle = 'white';
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight);
            // Tegn highlight hvis aktiv
            if (activeKeys.has(key.name)) {
                ctx.fillStyle = KEY_HIGHLIGHT_COLOR;
                ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight);
            }
            // Tegn kantlinje
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight);
            // Tegn navn
            ctx.fillStyle = KEY_NAME_COLOR_WHITE;
            ctx.font = KEY_NAME_FONT;
            ctx.textBaseline = 'bottom';
            ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + pianoHeight - 5);
        }
    });

    // Tegn svarte tangenter + navn + highlight (oppå hvite)
    keyInfo.forEach(key => {
        if (key.type === 'black') {
            const keyData = keyMapping[key.name];
             if (!keyData) return;
            // Tegn tangent
            ctx.fillStyle = 'black';
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, blackKeyHeight);
             // Tegn highlight hvis aktiv
            if (activeKeys.has(key.name)) {
                ctx.fillStyle = KEY_HIGHLIGHT_COLOR;
                // Fremhev kun den svarte delen
                ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, blackKeyHeight);
            }
            // Tegn navn
            ctx.fillStyle = KEY_NAME_COLOR_BLACK;
            ctx.font = KEY_NAME_FONT;
            ctx.textBaseline = 'bottom'; // Plasser nederst på den svarte tangenten
            ctx.fillText(key.name, keyData.x + keyData.width / 2, pianoDrawHeight + blackKeyHeight - 5);
        }
    });
}
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===

// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() {
    if (!currentSong) return;
    activeKeys.clear(); // Fjern highlights ved play/pause
    drawPiano(); // Tegn piano på nytt uten highlights

    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
}

function playSong() {
    if (!currentSong) return;
    isPlaying = true;
    playButton.textContent = "Pause";
    bpmInputElement.disabled = true;
    songSelector.disabled = true;

    // Foreløpig starter vi alltid fra begynnelsen.
    startTime = performance.now() + PRE_ROLL_SECONDS * 1000;
    console.log(`Starter avspilling (BPM: ${currentPlaybackBPM}) med ${PRE_ROLL_SECONDS}s pre-roll...`);

    if (!animationFrameId) {
        gameLoop(); // Start animasjonsløkken
    }
}

function pauseSong() {
    isPlaying = false;
    playButton.textContent = "Spill av"; // Tilbake til "Spill av" da vi ikke har resume
    bpmInputElement.disabled = false;
    songSelector.disabled = false;

    // Stopp animasjonsløkken helt siden vi ikke har resume
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // Fjern aktive taster og tegn piano på nytt i pausetilstand
    activeKeys.clear();
    drawPiano();
    console.log("Avspilling stoppet.");
}

function resetPlayback() {
    isPlaying = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    startTime = 0;
    activeKeys.clear(); // Fjern aktive taster

    playButton.textContent = "Spill av";
    if (currentSong) {
        playButton.disabled = false;
        bpmInputElement.disabled = false;
        songSelector.disabled = false;
    } else {
        playButton.disabled = true;
        bpmInputElement.disabled = true;
        songSelector.disabled = false;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    buildKeyMapping(); // Sørg for at mapping er oppdatert
    drawPiano(); // Tegn piano (uten highlights)
    console.log("Avspilling nullstilt.");
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE START ===
function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop);

    const currentTime = performance.now();

    if (!isPlaying) return; // Ikke gjør noe mer hvis pauset/stoppet

    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    const beatsPerSecond = currentPlaybackBPM / 60;
    const currentBeat = elapsedTimeInSeconds * beatsPerSecond;

    // Nullstill aktive taster før vi sjekker på nytt
    activeKeys.clear();

    // Sjekk hvilke taster som skal være aktive (dette gjøres nå i drawFallingNotes)
    // Tøm canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tegn fallende noter OG oppdater activeKeys
    drawFallingNotes(currentBeat);

    // Tegn piano (vil nå bruke oppdatert activeKeys for highlighting)
    drawPiano();

    // Tegn tidslinje/beat-teller
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`BPM: ${currentPlaybackBPM}`, canvas.width - 10, 20);
}
// === 7: ANIMASJONSLØKKE SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) {
    if (!currentSong || !currentSong.notes || Object.keys(keyMapping).length === 0) return;

    const secondsPerBeat = 60 / currentPlaybackBPM;
    const fallHeight = canvas.height - pianoHeight;
    const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS;
    const pixelsPerBeat = pixelsPerSecond * secondsPerBeat;
    const targetLineY = canvas.height - pianoHeight; // Y-koordinat for toppen av pianoet

    currentSong.notes.forEach(note => {
        const keyData = keyMapping[note.key];
        if (!keyData) return;

        const targetBeat = note.time;
        const beatsUntilHit = targetBeat - currentBeat;
        const yBottom = targetLineY - (beatsUntilHit * pixelsPerBeat);
        const notePixelHeight = note.duration * pixelsPerBeat;
        const yTop = yBottom - notePixelHeight;
        const xPosition = keyData.x;
        const noteWidth = keyData.width;

        // *** Sjekk om noten er nær nok til å aktivere tangenten ***
        // Noten aktiverer tangenten hvis dens starttid (targetBeat) er
        // innenfor toleransen av currentBeat.
        if (Math.abs(beatsUntilHit) < NOTE_HIT_TOLERANCE_BEATS / 2) {
             activeKeys.add(note.key);
        }
        // Alternativt: Aktiver hvis noten *overlapper* trefflinjen:
        // if (yBottom >= targetLineY && yTop < targetLineY) {
        //      activeKeys.add(note.key);
        // }
        // Vi bruker beat-toleranse - det er kanskje mer robust.

        // Tegn noten hvis den er synlig
        if (yTop < canvas.height && yBottom > 0) {
            // Sett farge basert på tangenttype
            ctx.fillStyle = (keyData.type === 'white') ? WHITE_NOTE_COLOR : BLACK_NOTE_COLOR;
            ctx.fillRect(xPosition, yTop, noteWidth, notePixelHeight);

            // Tegn "trefflinje" nederst på noten
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xPosition, yBottom);
            ctx.lineTo(xPosition + noteWidth, yBottom);
            ctx.stroke();
        }
    });
}
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
initialize(); // Kall initialiseringsfunksjonen når scriptet lastes
// === 9: START PROGRAMMET SLUTT ===
