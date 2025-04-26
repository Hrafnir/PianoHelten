// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
const songFileInput = document.getElementById('songFileInput');
const playButton = document.getElementById('playButton');
const songInfoDiv = document.getElementById('songInfo');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d'); // Context for å tegne på canvas

let currentSong = null; // Holder dataen til den lastede sangen
let audioContext = null; // For fremtidig lydavspilling (ikke brukt nå)
let isPlaying = false;
let animationFrameId = null; // Holder ID for requestAnimationFrame
let startTime = 0; // Tidspunktet da beat 0 *skal treffe* bunnen (inkluderer pre-roll)

// Piano-konstanter
const keyInfo = [ // Definerer tangenter vi vil vise (forenklet oktav)
    // Vi utvider litt for å ha flere tangenter å mappe til
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
const pianoHeight = 120; // *** ØKT HØYDE PÅ TANGENTENE ***
const whiteKeyWidth = 40; // Justert bredde for å få plass til flere
const blackKeyWidth = whiteKeyWidth * 0.6;
const blackKeyHeight = pianoHeight * 0.6; // Svarte tangenter er 60% av høyden
const keyMapping = {}; // Objekt for å raskt finne x-posisjon basert på nøkkelnavn

// Spill-konstanter
const PRE_ROLL_SECONDS = 3; // *** TID I SEKUNDER FØR FØRSTE NOTE TREFFER ***
const NOTE_FALL_SECONDS = 6; // *** TID EN NOTE BRUKER PÅ Å FALLE NED SKJERMEN ***
// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===

// === 2: INITIALISERING START ===
function initialize() {
    console.log("Initialiserer Piano Hero...");
    setupCanvas();
    buildKeyMapping(); // Bygg mappingen etter canvas er satt opp
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
    // Bygg key mapping på nytt hvis canvas endrer størrelse
    buildKeyMapping();
}

// Listener for å endre canvas-størrelse hvis vinduet endres
window.addEventListener('resize', () => {
    setupCanvas();
    drawPiano(); // Tegn pianoet på nytt når størrelsen endres
    // Hvis spillet kjører, må vi kanskje justere posisjoner etc.,
    // men foreløpig tegner vi bare pianoet på nytt.
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
            if (!currentSong.tempo || !currentSong.notes) {
                throw new Error("Mangler 'tempo' eller 'notes' i JSON-filen.");
            }
            console.log("Sang lastet:", currentSong);
            songInfoDiv.textContent = `Lastet: ${currentSong.title || 'Ukjent Tittel'} (${currentSong.artist || 'Ukjent Artist'}) - ${currentSong.tempo} BPM`;
            playButton.disabled = false; // Aktiver spill-knappen
            resetPlayback(); // Nullstill avspillingstilstand
            // Tegn pianoet og eventuelt startposisjonen for notene umiddelbart
            drawPiano();
            // Vi kan vurdere å tegne de første notene statisk før start her
        } catch (error) {
            console.error("Feil ved parsing av JSON-fil:", error);
            songInfoDiv.textContent = `Feil: Kunne ikke lese sangfilen. ${error.message}`;
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

// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMapping() {
    // Tømmer mappingen før vi bygger den på nytt
    Object.keys(keyMapping).forEach(key => delete keyMapping[key]);

    const totalWhiteKeysInDefinition = keyInfo.filter(k => k.type === 'white').length;
    // Bruker xOffset fra siste hvite tangent + 1 for å finne total bredde i enheter
    const lastWhiteKey = keyInfo.filter(k => k.type === 'white').pop();
    const pianoUnitsWidth = lastWhiteKey.xOffset + 1; // Antall hvite tangentbredder

    // Beregn skaleringsfaktor for å få plass til pianoet innenfor canvas-bredden
    const availableWidth = canvas.width * 0.95; // Bruk 95% av bredden for litt luft på sidene
    const calculatedWhiteKeyWidth = availableWidth / pianoUnitsWidth;

    // Bruk enten beregnet bredde eller den definerte konstanten, avhengig av hva som er minst
    const actualWhiteKeyWidth = Math.min(whiteKeyWidth, calculatedWhiteKeyWidth);
    const actualBlackKeyWidth = actualWhiteKeyWidth * (blackKeyWidth / whiteKeyWidth); // Skaler svart bredde proporsjonalt

    const pianoPixelWidth = pianoUnitsWidth * actualWhiteKeyWidth;
    const pianoStartX = (canvas.width - pianoPixelWidth) / 2; // Start X for å sentrere

    keyInfo.forEach(key => {
        const xBase = pianoStartX + key.xOffset * actualWhiteKeyWidth;
        if (key.type === 'white') {
            keyMapping[key.name] = {
                x: xBase,
                width: actualWhiteKeyWidth,
                type: 'white',
                baseXOffset: key.xOffset // Lagrer for referanse
            };
        } else { // Black key
            keyMapping[key.name] = {
                x: xBase, // xOffset for svarte er relativt til forrige hvite
                width: actualBlackKeyWidth,
                type: 'black',
                baseXOffset: key.xOffset // Lagrer for referanse
            };
        }
    });
     // console.log("Key mapping bygget:", keyMapping);
     // console.log(`Piano StartX: ${pianoStartX}, Piano Width: ${pianoPixelWidth}`);
}

function drawPiano() {
    if (Object.keys(keyMapping).length === 0) {
        console.warn("Key mapping er tom, kan ikke tegne piano.");
        return;
    }

    // Tømmer bare piano-området (nederst)
    ctx.fillStyle = '#333'; // Bakgrunnsfarge over pianoet
    ctx.fillRect(0, canvas.height - pianoHeight - 1, canvas.width, pianoHeight + 1); // Litt overlapp

    const pianoDrawHeight = canvas.height - pianoHeight; // Y-posisjonen der pianoet starter

    // Tegn hvite tangenter først
    keyInfo.forEach(key => {
        if (key.type === 'white') {
            const keyData = keyMapping[key.name];
            if (!keyData) return;
            ctx.fillStyle = 'white';
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight);
            ctx.strokeStyle = '#555'; // Kantlinje
            ctx.lineWidth = 1;
            ctx.strokeRect(keyData.x, pianoDrawHeight, keyData.width, pianoHeight);
        }
    });

    // Tegn svarte tangenter oppå
    keyInfo.forEach(key => {
        if (key.type === 'black') {
            const keyData = keyMapping[key.name];
             if (!keyData) return;
            ctx.fillStyle = 'black';
            // Justerer x-posisjonen litt for bedre sentrering av den svarte tasten over skillet
            // const adjustedX = keyData.x - keyData.width / 2; // Sentrerer den svarte tasten over linjen
            ctx.fillRect(keyData.x, pianoDrawHeight, keyData.width, blackKeyHeight); // Bruker blackKeyHeight
        }
    });
    // console.log("Piano tegnet");
}
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===

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
    // Starttiden settes til NÅ + pre-roll tid.
    // Dette betyr at tiden (currentTime - startTime) vil være negativ i starten,
    // og når den blir 0, har pre-roll tiden gått.
    startTime = performance.now() + PRE_ROLL_SECONDS * 1000;
    console.log(`Starter avspilling med ${PRE_ROLL_SECONDS}s pre-roll...`);
    if (!animationFrameId) {
        gameLoop(); // Starter animasjonsløkken KUN hvis den ikke allerede kjører
    }
}

function pauseSong() {
    isPlaying = false;
    playButton.textContent = "Spill av";
    // VIKTIG: Ikke stopp animasjonsløkken her hvis vi bare pauser.
    // Vi lar den gå, men tegner ikke noter i bevegelse.
    // Eller vi stopper den og lagrer nåværende beat for å gjenoppta.
    // For enkelhets skyld stopper vi den nå:
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    console.log("Avspilling pauset.");
    // TODO: Lagre nåværende beat/posisjon for å kunne gjenoppta nøyaktig.
}

function resetPlayback() {
    // Nullstiller tilstanden når en ny sang lastes eller stoppes helt
    pauseSong(); // Stopper eventuell pågående avspilling og animasjon
    startTime = 0; // Nullstill starttiden
    // Tøm canvas og tegn bare pianoet
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    buildKeyMapping(); // Sørg for at mapping er oppdatert
    drawPiano();
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===

// === 7: ANIMASJONSLØKKE START ===
function gameLoop() {
    // Be om neste frame med en gang for jevn animasjon
    animationFrameId = requestAnimationFrame(gameLoop);

    // Hent nåværende tid
    const currentTime = performance.now();

    // Hvis ikke spiller, gjør ingenting mer i denne framen (men løkka fortsetter via requestAnimationFrame)
    if (!isPlaying) {
         // Vi kan evt tegne et statisk bilde i pausemodus her, men foreløpig gjør vi ingenting.
         // Siden vi kansellerer frame i pauseSong, vil ikke dette kjøre uansett.
         // Om vi endrer pauseSong til å *ikke* kansellere frame, må vi ha logikk her.
        return;
    }

    // Beregn tid relativt til når beat 0 skal treffe bunnen
    // elapsedTimeInSeconds vil være negativ under pre-roll
    const elapsedTimeInSeconds = (currentTime - startTime) / 1000;
    const beatsPerSecond = currentSong.tempo / 60;
    // currentBeat vil være negativ under pre-roll, 0 når første note skal treffe, positiv etterpå
    const currentBeat = elapsedTimeInSeconds * beatsPerSecond;

    // 1. Tøm hele canvasen før ny tegning
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Tegn fallende noter
    drawFallingNotes(currentBeat);

    // 3. Tegn det statiske pianoet på nytt
    drawPiano();

    // 4. (Valgfritt) Tegn tidslinje/beat-teller e.l.
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Beat: ${currentBeat.toFixed(2)}`, 10, 20);

}
// === 7: ANIMASJONSLØKKE SLUTT ===

// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) {
    if (!currentSong || !currentSong.notes || Object.keys(keyMapping).length === 0) return;

    const secondsPerBeat = 60 / currentSong.tempo;
    // Høyden notene skal falle (hele canvas minus piano)
    const fallHeight = canvas.height - pianoHeight;
    // Hastighet: Piksler per sekund
    const pixelsPerSecond = fallHeight / NOTE_FALL_SECONDS; // Bruker konstanten
    // Hastighet: Piksler per beat
    const pixelsPerBeat = pixelsPerSecond * secondsPerBeat;

    currentSong.notes.forEach(note => {
        // Finn tangentdata fra mappingen
        const keyData = keyMapping[note.key];
        if (!keyData) {
            // console.warn(`Fant ikke tangent-mapping for ${note.key}`);
            return; // Hopp over noter vi ikke har definert i pianoet
        }

        // Mål-beat: Når noten skal treffe bunnen (pianoet)
        const targetBeat = note.time;

        // Antall beats til noten treffer bunnen. Vil være positiv før treff, negativ etter.
        const beatsUntilHit = targetBeat - currentBeat;

        // Y-posisjon for NOTENS NEDERKANT (der den treffer pianoet)
        // Når beatsUntilHit er 0, skal yBottom være ved pianoDrawHeight
        const yBottom = (canvas.height - pianoHeight) - (beatsUntilHit * pixelsPerBeat);

        // Lengden på noten (visuelt) i piksler
        const notePixelHeight = note.duration * pixelsPerBeat;

        // Y-posisjon for NOTENS ØVERKANT
        const yTop = yBottom - notePixelHeight;

        // Hent posisjon og bredde for tangenten
        const xPosition = keyData.x;
        const noteWidth = keyData.width;

        // Tegn noten KUN hvis den er (delvis) synlig på skjermen
        // Noten er synlig hvis dens topp er over bunnen av skjermen
        // OG dens bunn er under toppen av spillområdet (0)
        if (yTop < canvas.height && yBottom > 0) {
            // Sett farge basert på tangenttype
            if (keyData.type === 'white') {
                ctx.fillStyle = 'cyan';
            } else {
                ctx.fillStyle = 'magenta'; // F.eks. annen farge for svarte
            }
            // Tegn rektangelet fra yTop med høyden notePixelHeight
            ctx.fillRect(xPosition, yTop, noteWidth, notePixelHeight);

             // Valgfritt: Tegn en linje midt i noten for tydeligere timing
             ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
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
