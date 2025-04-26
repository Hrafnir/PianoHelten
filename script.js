// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
const songFileInput = document.getElementById('songFileInput');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Context for å tegne på canvas

let currentSong = null; // Holder dataen til den lastede sangen
let audioContext = null; // For fremtidig lydavspilling (ikke brukt nå)
let isPlaying = false;
let startTime = 0; // Når avspillingen startet (brukes til å beregne tid)
let animationFrameId = null; // Holder ID for requestAnimationFrame

// Piano-konstanter
const keyInfo = [ // Definerer tangenter vi vil vise (forenklet oktav)
    { name: "C4", type: "white", xOffset: 0 },
    { name: "C#4", type: "black", xOffset: 0.7 },
    { name: "D4", type: "white", xOffset: 1 },
    { name: "D#4", type: "black", xOffset: 1.7 },
    { name: "E4", type: "white", xOffset: 2 },
    { name: "F4", type: "white", xOffset: 3 },
    { name: "F#4", type: "black", xOffset: 3.7 },
    { name: "G4", type: "white", xOffset: 4 },
    { name: "G#4", type: "black", xOffset: 4.7 },
    { name: "A4", type: "white", xOffset: 5 },
    { name: "A#4", type: "black", xOffset: 5.7 },
    { name: "B4", type: "white", xOffset: 6 },
    { name: "C5", type: "white", xOffset: 7 } // Ekstra C for visuell avslutning
];
const pianoHeight = 80; // Høyde på pianotangentene nederst
const whiteKeyWidth = 50;
const blackKeyWidth = whiteKeyWidth * 0.6;
const blackKeyHeight = pianoHeight * 0.6;
const keyMapping = {}; // Objekt for å raskt finne x-posisjon basert på nøkkelnavn
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===

// === 2: INITIALISERING START ===
function initialize() {
    console.log("Initialiserer Piano Hero...");
    setupCanvas();
    drawPiano(); // Tegn pianoet med en gang
    setupEventListeners();
}
// === 2: INITIALISERING SLUTT ===

// === 3: CANVAS OPPSETT START ===
function setupCanvas() {
    const container = document.querySelector('.game-area');
    // Gjør canvas like stort som containeren den ligger i
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    console.log(`Canvas satt opp: ${canvas.width}x${canvas.height}`);
}

// Listener for å endre canvas-størrelse hvis vinduet endres
window.addEventListener('resize', () => {
    setupCanvas();
    drawPiano(); // Tegn pianoet på nytt når størrelsen endres
    // Må kanskje også tegne fallende noter hvis spillet kjører
});
// === 3: CANVAS OPPSETT SLUTT ===

// === 4: EVENT LISTENERS (KNAPPER, FILVALG) START ===
function setupEventListeners() {
    songFileInput.addEventListener('change', handleFileSelect);
    playButton.addEventListener('click', togglePlayback);
    playButton.disabled = true; // Kan ikke spille før sang er lastet
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log("Ingen fil valgt.");
        return;
    }
    console.log(`Valgt fil: ${file.name}`);

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const fileContent = e.target.result;
            currentSong = JSON.parse(fileContent); // Prøver å tolke filinnholdet som JSON
            console.log("Sang lastet:", currentSong);
            songInfoDiv.textContent = `Lastet: ${currentSong.title || 'Ukjent Tittel'} (${currentSong.artist || 'Ukjent Artist'}) - ${currentSong.tempo} BPM`;
            playButton.disabled = false; // Aktiver spill-knappen
            resetPlayback(); // Nullstill avspillingstilstand
        } catch (error) {
            console.error("Feil ved parsing av JSON-fil:", error);
            songInfoDiv.textContent = "Feil: Kunne ikke lese sangfilen. Er den i korrekt JSON-format?";
            currentSong = null;
            playButton.disabled = true;
        }
    };
    reader.onerror = function() {
        console.error("Feil ved lesing av fil:", reader.error);
        songInfoDiv.textContent = "Feil: Kunne ikke lese filen.";
        currentSong = null;
        playButton.disabled = true;
    };
    reader.readAsText(file); // Leser filen som tekst
}
// === 4: EVENT LISTENERS (KNAPPER, FILVALG) SLUTT ===

// === 5: PIANO TEGNING START ===
function drawPiano() {
    // Tømmer bare piano-området (nederst)
    ctx.fillStyle = '#333'; // Bakgrunnsfarge over pianoet
    ctx.fillRect(0, canvas.height - pianoHeight - 1, canvas.width, pianoHeight + 1); // Litt overlapp for å unngå glipper

    const totalWhiteKeysInDefinition = keyInfo.filter(k => k.type === 'white').length;
    // Justerer bredden slik at pianoet (basert på hvite tangenter) sentreres
    // Vi bruker xOffset-verdiene som relative enheter. Den siste hvite tastens start + 1 bredde = total bredde i enheter.
    const pianoUnitsWidth = keyInfo.find(k => k.name === 'C5').xOffset + 1;
    const keyScale = canvas.width / (pianoUnitsWidth * whiteKeyWidth); // Skaleringsfaktor for å fylle bredden
    const scaledWhiteKeyWidth = whiteKeyWidth * keyScale;
    const scaledBlackKeyWidth = blackKeyWidth * keyScale;
    const pianoWidth = pianoUnitsWidth * scaledWhiteKeyWidth;
    const pianoStartX = (canvas.width - pianoWidth) / 2; // Start X for å sentrere

    // Bygg keyMapping for raskere oppslag senere
    keyMapping.length = 0; // Tøm mappingen før vi bygger den på nytt

    // Tegn hvite tangenter først
    keyInfo.forEach(key => {
        if (key.type === 'white') {
            const x = pianoStartX + key.xOffset * scaledWhiteKeyWidth;
            ctx.fillStyle = 'white';
            ctx.fillRect(x, canvas.height - pianoHeight, scaledWhiteKeyWidth, pianoHeight);
            ctx.strokeStyle = '#555'; // Kantlinje
            ctx.lineWidth = 1;
            ctx.strokeRect(x, canvas.height - pianoHeight, scaledWhiteKeyWidth, pianoHeight);
            keyMapping[key.name] = { x: x, width: scaledWhiteKeyWidth, type: 'white' }; // Lagre posisjon og bredde
        }
    });

    // Tegn svarte tangenter oppå
    keyInfo.forEach(key => {
        if (key.type === 'black') {
            const x = pianoStartX + key.xOffset * scaledWhiteKeyWidth;
            ctx.fillStyle = 'black';
            ctx.fillRect(x, canvas.height - pianoHeight, scaledBlackKeyWidth, blackKeyHeight);
            keyMapping[key.name] = { x: x, width: scaledBlackKeyWidth, type: 'black' }; // Lagre posisjon og bredde
        }
    });
    console.log("Piano tegnet", keyMapping);
}
// === 5: PIANO TEGNING SLUTT ===

// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() {
    if (!currentSong) return; // Gjør ingenting hvis ingen sang er lastet

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
    startTime = performance.now(); // Bruker performance.now() for mer nøyaktig timing
    console.log("Starter avspilling...");
    gameLoop(); // Starter animasjonsløkken
}

function pauseSong() {
    isPlaying = false;
    playButton.textContent = "Spill av";
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId); // Stopper animasjonsløkken
        animationFrameId = null;
    }
    console.log("Avspilling pauset.");
    // Trenger logikk for å lagre nåværende tidspunkt for å kunne gjenoppta
}

function resetPlayback() {
    // Nullstiller tilstanden når en ny sang lastes
    pauseSong(); // Stopper eventuell pågående avspilling
    startTime = 0;
    // Nullstill eventuelle fallende noter (kommer i neste steg)
    drawPiano(); // Sørg for at pianoet er synlig
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE START ===
function gameLoop() {
    if (!isPlaying) return; // Stopp hvis ikke spiller

    const currentTime = performance.now();
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000; // Tid siden start i sekunder
    const beatsPerSecond = currentSong.tempo / 60;
    const currentBeat = elapsedTimeInSeconds * beatsPerSecond; // Hvilket "beat" vi er på nå

    // 1. Tøm hele canvasen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Tegn fallende noter (Logikk kommer her i neste steg)
    // --- (Her skal vi iterere gjennom currentSong.notes) ---
    // --- (Beregne posisjon basert på currentBeat) ---
    // --- (Tegne rektangler som faller nedover) ---
    drawFallingNotes(currentBeat); // Placeholder for funksjon vi lager snart

    // 3. Tegn det statiske pianoet på nytt (siden vi tømte alt)
    drawPiano();

    // 4. Be om neste frame
    animationFrameId = requestAnimationFrame(gameLoop);
}
// === 7: ANIMASJONSLØKKE SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
// Denne funksjonen vil håndtere logikken for å tegne notene som faller
function drawFallingNotes(currentBeat) {
    if (!currentSong || !currentSong.notes) return;

    const secondsPerBeat = 60 / currentSong.tempo;
    const pixelsPerSecond = (canvas.height - pianoHeight) / 4; // Hvor mange sekunder en note bruker på å falle ned (juster tallet 4 for hastighet)
    const pixelsPerBeat = pixelsPerSecond * secondsPerBeat;

    currentSong.notes.forEach(note => {
        // Beregn når noten skal treffe pianoet (målt i beats)
        const targetBeat = note.time;

        // Beregn hvor langt noten har falt (eller hvor langt unna den er)
        const distanceToTargetBeats = targetBeat - currentBeat;
        const yPosition = canvas.height - pianoHeight - (distanceToTargetBeats * pixelsPerBeat);

        // Beregn lengden på noten (visuelt)
        const noteHeight = note.duration * pixelsPerBeat;

        // Finn x-posisjonen og bredden fra keyMapping
        const keyData = keyMapping[note.key];
        if (!keyData) {
            // console.warn(`Fant ikke tangent-mapping for ${note.key}`);
            return; // Hopp over noter vi ikke har definert i pianoet
        }
        const xPosition = keyData.x;
        const noteWidth = keyData.width;

        // Tegn noten KUN hvis den er synlig på skjermen
        // Den skal starte over toppen og slutte ved pianoet
        if (yPosition + noteHeight > 0 && yPosition < canvas.height - pianoHeight) {
             // Sett farge basert på tangenttype (eller annen logikk)
             if (keyData.type === 'white') {
                 ctx.fillStyle = 'cyan';
             } else {
                 ctx.fillStyle = 'magenta';
             }
             ctx.fillRect(xPosition, yPosition, noteWidth, noteHeight);
        }
    });
}
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
initialize(); // Kall initialiseringsfunksjonen når scriptet lastes
// === 9: START PROGRAMMET SLUTT ===
