// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
const songSelector = document.getElementById('songSelector');
const bpmInputElement = document.getElementById('bpmInput');
const originalBpmSpan = document.getElementById('originalBpm');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Context for å tegne på canvas

// --- Sangliste (Manuelt vedlikeholdt) ---
// Nøkkelen er filnavnet i 'songs/'-mappen, verdien er visningsnavnet i dropdown.
const availableSongs = {
    "twinkle_twinkle.json": "Twinkle Twinkle Little Star",
    // Legg til flere sanger her etterhvert, f.eks.:
    // "mary_had_a_little_lamb.json": "Mary Had a Little Lamb"
};
const songsFolderPath = 'songs/'; // Mappen der sangfilene ligger

let currentSong = null; // Holder dataen til den lastede sangen
let currentPlaybackBPM = 100; // BPM som faktisk brukes til avspilling
let audioContext = null; // For fremtidig lydavspilling (ikke brukt nå)
let isPlaying = false;
let animationFrameId = null; // Holder ID for requestAnimationFrame
let startTime = 0; // Tidspunktet da beat 0 *skal treffe* bunnen (inkluderer pre-roll)

// Piano-konstanter
const keyInfo = [ // Definerer tangenter vi vil vise
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
    { name: "C6", type: "white", xOffset: 14 } // Ekstra C for visuell avslutning
];
const pianoHeight = 120;
const whiteKeyWidth = 40;
const blackKeyWidth = whiteKeyWidth * 0.6;
const blackKeyHeight = pianoHeight * 0.6;
const keyMapping = {}; // Objekt for å raskt finne x-posisjon basert på nøkkelnavn

// Spill-konstanter
const PRE_ROLL_SECONDS = 3;
const NOTE_FALL_SECONDS = 6;
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===

// === 2: INITIALISERING START ===
function initialize() {
    console.log("Initialiserer Piano Hero...");
    setupCanvas();
    buildKeyMapping(); // Bygg mappingen FØR første drawPiano
    drawPiano(); // Tegn pianoet med en gang
    populateSongSelector(); // Fyll dropdown-menyen
    setupEventListeners();
    resetUI(); // Sett UI til starttilstand (knapper deaktivert etc.)
}
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
function setupCanvas() {
    const container = document.querySelector('.game-area');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    console.log(`Canvas satt opp: ${canvas.width}x${canvas.height}`);
    buildKeyMapping(); // Oppdater mapping hvis størrelsen endres
}

window.addEventListener('resize', () => {
    setupCanvas();
    drawPiano(); // Tegn pianoet på nytt
    // Hvis spillet kjører, bør vi kanskje tegne notene på nytt også
    if (isPlaying) {
         // Foreløpig: Bare tegn piano. Mer avansert logikk kan legges til.
    }
});
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    songSelector.addEventListener('change', handleSongSelect);
    bpmInputElement.addEventListener('change', handleBpmChange);
    playButton.addEventListener('click', togglePlayback);
}

function populateSongSelector() {
    // Tøm eventuelle eksisterende options (utenom den første)
    while (songSelector.options.length > 1) {
        songSelector.remove(1);
    }
    // Legg til sanger fra availableSongs
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
    bpmInputElement.value = 100; // Standardverdi
    originalBpmSpan.textContent = "";
    songInfoDiv.textContent = "Velg en sang fra menyen";
    songSelector.selectedIndex = 0; // Tilbakestill til "-- Velg en sang --"
}

function handleSongSelect() {
    const selectedFilename = songSelector.value;
    if (!selectedFilename) {
        currentSong = null;
        resetUI();
        resetPlayback(); // Nullstill spilltilstand også
        return;
    }

    const songPath = songsFolderPath + selectedFilename;
    console.log(`Laster sang: ${songPath}`);
    songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`;
    playButton.disabled = true;
    bpmInputElement.disabled = true;

    fetch(songPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // Parser responsen som JSON
        })
        .then(data => {
            currentSong = data;
            console.log("Sang lastet:", currentSong);
            if (!currentSong.tempo || !currentSong.notes) {
                throw new Error("Sangfil mangler 'tempo' eller 'notes'.");
            }

            // Oppdater UI med sanginfo
            songInfoDiv.textContent = `Klar: ${currentSong.title || availableSongs[selectedFilename]} (${currentSong.artist || 'Ukjent'})`;
            currentPlaybackBPM = currentSong.tempo; // Sett playback BPM til sangens default
            bpmInputElement.value = currentPlaybackBPM;
            originalBpmSpan.textContent = `(Original: ${currentSong.tempo} BPM)`;
            bpmInputElement.disabled = false; // Aktiver BPM-input
            playButton.disabled = false; // Aktiver spill-knappen
            resetPlayback(); // Nullstill spilltilstand (viktig før nytt spill)

        })
        .catch(error => {
            console.error("Feil ved lasting eller parsing av sang:", error);
            songInfoDiv.textContent = `Feil: Kunne ikke laste sangen "${availableSongs[selectedFilename]}". Sjekk filen og konsollen.`;
            currentSong = null;
            resetUI();
        });
}

function handleBpmChange() {
    const newBpm = parseInt(bpmInputElement.value, 10);
    if (isNaN(newBpm) || newBpm < 20 || newBpm > 300) {
        // Ugyldig verdi, sett tilbake til forrige gyldige
        bpmInputElement.value = currentPlaybackBPM;
        console.warn("Ugyldig BPM verdi.");
        return;
    }
    currentPlaybackBPM = newBpm;
    console.log(`Playback BPM endret til: ${currentPlaybackBPM}`);
    // Hvis sangen spiller, vil endringen tas i bruk i neste gameLoop-tick
    // Hvis sangen ikke spiller, vil den starte med denne nye BPM-en
}
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===

// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMapping() {
    Object.keys(keyMapping).forEach(key => delete keyMapping[key]);

    const totalWhiteKeysInDefinition = keyInfo.filter(k => k.type === 'white').length;
    const lastWhiteKey = keyInfo.filter(k => k.type === 'white').pop();
    if (!lastWhiteKey) { console.error("Ingen hvite taster definert i keyInfo"); return; }
    const pianoUnitsWidth = lastWhiteKey.xOffset + 1;

    const availableWidth = canvas.width * 0.98; // Bruk 98% for litt mindre luft
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
            // Svart tangent: Juster x for sentrering rundt linjen (xOffset er relativt til forrige hvite)
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

    // Tegn hvite tangenter
    keyInfo.forEach(key => {
        if (key.type === 'white') {
            const keyData = keyMapping[key.name];
            if (!keyData) return;
            ctx.fillStyle = 'white';
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight);
        }
    });

    // Tegn svarte tangenter
    keyInfo.forEach(key => {
        if (key.type === 'black') {
            const keyData = keyMapping[key.name];
             if (!keyData) return;
            ctx.fillStyle = 'black';
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, blackKeyHeight);
        }
    });
}
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===

// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() {
    if (!currentSong) return;

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
    bpmInputElement.disabled = true; // Kan ikke endre BPM mens det spilles (forenkling)
    songSelector.disabled = true; // Kan ikke bytte sang mens det spilles

    // Hvis startTime er 0 (eller veldig gammel), start fra begynnelsen med pre-roll
    // Ellers, hvis vi implementerer pause/resume, må vi justere startTime her.
    // Foreløpig starter vi alltid fra begynnelsen.
    startTime = performance.now() + PRE_ROLL_SECONDS * 1000;
    console.log(`Starter avspilling (BPM: ${currentPlaybackBPM}) med ${PRE_ROLL_SECONDS}s pre-roll...`);

    if (!animationFrameId) {
        gameLoop(); // Start animasjonsløkken
    }
}

function pauseSong() {
    isPlaying = false;
    playButton.textContent = "Fortsett"; // Endret fra "Spill av"
    bpmInputElement.disabled = false; // Kan endre BPM i pause
    songSelector.disabled = false; // Kan bytte sang i pause
    // Ikke kanseller animationFrameId her hvis vi skal kunne fortsette
    // Vi stopper bare bevegelsen i gameLoop
    console.log("Avspilling pauset.");
    // For å kunne fortsette nøyaktig, må vi lagre `currentBeat` når vi pauser.
    // Dette er ikke implementert ennå. "Fortsett" vil starte fra begynnelsen.
    // For å reflektere dette, sett knappen tilbake til "Spill av" og stopp løkken:
    playButton.textContent = "Spill av"; // Tilbake til "Spill av" siden vi ikke har resume
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

function resetPlayback() {
    // Denne kalles når ny sang velges, eller ved full stopp.
    isPlaying = false; // Stopp avspilling
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Stopp animasjonen
        animationFrameId = null;
    }
    startTime = 0; // Nullstill starttid
    playButton.textContent = "Spill av";
    // Aktiver kontroller hvis en sang er lastet
    if (currentSong) {
        playButton.disabled = false;
        bpmInputElement.disabled = false;
        songSelector.disabled = false;
    } else {
        playButton.disabled = true;
        bpmInputElement.disabled = true;
        songSelector.disabled = false; // Kan alltid velge sang
    }

    // Tøm canvas og tegn bare pianoet
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    buildKeyMapping(); // Sørg for at mapping er oppdatert
    drawPiano();
    console.log("Avspilling nullstilt.");
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE START ===
function gameLoop() {
    animationFrameId = requestAnimationFrame(gameLoop);

    const currentTime = performance.now();

    // Hvis ikke spiller, tegn statisk bilde og returner
    if (!isPlaying) {
         // Tegn piano i tilfelle resize e.l. har skjedd mens pauset
         // drawPiano(); // Kan droppes hvis vi ikke forventer endringer i pause
        return;
    }

    // Beregn tid og beat basert på JUSTERBAR BPM
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    const beatsPerSecond = currentPlaybackBPM / 60; // *** BRUKER currentPlaybackBPM ***
    const currentBeat = elapsedTimeInSeconds * beatsPerSecond;

    // Tøm canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tegn fallende noter (bruker også currentPlaybackBPM internt nå)
    drawFallingNotes(currentBeat);

    // Tegn piano
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

    // Beregninger basert på JUSTERBAR BPM
    const secondsPerBeat = 60 / currentPlaybackBPM; // *** BRUKER currentPlaybackBPM ***
    const fallHeight = canvas.height - pianoHeight;
    const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS;
    const pixelsPerBeat = pixelsPerSecond * secondsPerBeat;

    currentSong.notes.forEach(note => {
        const keyData = keyMapping[note.key];
        if (!keyData) return;

        const targetBeat = note.time;
        const beatsUntilHit = targetBeat - currentBeat;
        const yBottom = (canvas.height - pianoHeight) - (beatsUntilHit * pixelsPerBeat);
        const notePixelHeight = note.duration * pixelsPerBeat;
        const yTop = yBottom - notePixelHeight;
        const xPosition = keyData.x;
        const noteWidth = keyData.width;

        if (yTop < canvas.height && yBottom > 0) {
            if (keyData.type === 'white') {
                ctx.fillStyle = 'cyan';
            } else {
                ctx.fillStyle = 'magenta';
            }
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
