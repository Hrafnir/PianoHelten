// === 1: GLOBALE VARIABLER OG KONSTANTER START ===
// ... (ingen endringer her, behold alle fra forrige versjon) ...
const tabButtonPlay = document.getElementById('tabButtonPlay');
// ... (resten av variablene)

// === 1: GLOBALE VARIABLER OG KONSTANTER SLUTT ===


// === 2: INITIALISERING START ===
function initialize() { /* ... som før ... */ }
// === 2: INITIALISERING SLUTT ===


// === 3: CANVAS OPPSETT START ===
function setupCanvases() { /* ... som før ... */ }
window.addEventListener('resize', () => { /* ... som før ... */ });
// === 3: CANVAS OPPSETT SLUTT ===


// === 4: EVENT LISTENERS OG UI HÅNDTERING START ===
function setupEventListeners() {
    // Faner
    tabButtonPlay.addEventListener('click', () => switchTab('play'));
    tabButtonRecord.addEventListener('click', () => switchTab('record'));

    // Avspilling
    // *** MODIFISERT EVENT LISTENER FOR songSelector ***
    songSelector.addEventListener('change', (event) => {
        // *** HELT FØRSTE LOGG NÅR EVENTET SKJER ***
        console.log("--- songSelector 'change' EVENT FYRTE! ---", event.target.value);
        // Kall den faktiske håndteringsfunksjonen
        handleSongSelect(event);
    });
    // *** SLUTT PÅ MODIFIKASJON ***

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
    recordPianoCanvas.addEventListener('mousedown', handleRecordPianoMouseDown);
    recordPianoCanvas.addEventListener('mouseup', handleRecordPianoMouseUp);

    console.log("Event listeners satt opp.");
}

function switchTab(tabName) { /* ... som før ... */ }
function updateRecordModeUI() { /* ... som før ... */ }
function populateSongSelector() { /* ... som før ... */ }

// *** Forenklet resetUI ***
function resetUI() {
    playButton.disabled = true;
    playButton.textContent = "Spill av";
    bpmInputElement.disabled = true;
    bpmInputElement.value = 100;
    originalBpmSpan.textContent = "";
    songInfoDiv.textContent = "Velg en sang fra menyen";
    songSelector.selectedIndex = 0;
    songSelector.disabled = false; // *** ALLTID ENABLED HER ***
    console.log("UI resatt. songSelector disabled:", songSelector.disabled);
}

function handleSongSelect(event) {
    console.log("--- handleSongSelect FUNKSJON START ---"); // Endret logg
    const selectedFilename = event.target.value;
    console.log("handleSongSelect: Valgt fil:", selectedFilename);

    activeKeys.clear();
    if (!selectedFilename) {
        console.log("handleSongSelect: Ingen fil valgt, nullstiller.");
        currentSong = null;
        resetUI(); // Kaller forenklet reset
        resetPlayback();
        drawPianos();
        console.log("handleSongSelect: Nullstilling ferdig.");
        return;
    }

    console.log("handleSongSelect: Fil valgt, starter lasting...");
    const songPath = songsFolderPath + selectedFilename;
    console.log(`handleSongSelect: Forsøker å laste: ${songPath}`);
    songInfoDiv.textContent = `Laster ${availableSongs[selectedFilename]}...`;
    playButton.disabled = true;
    bpmInputElement.disabled = true;
    songSelector.disabled = true; // *** Deaktiver KUN under lasting ***
    console.log("handleSongSelect: Kaller fetch (songSelector disabled: true)");

    fetch(songPath)
        .then(response => {
             console.log("handleSongSelect: Fetch mottok respons. Status:", response.status, "OK:", response.ok);
             if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
             console.log("handleSongSelect: Parser JSON...");
             return response.json();
         })
        .then(data => {
             console.log("handleSongSelect: JSON parset vellykket.");
             currentSong = data;
             if (!currentSong.tempo || !currentSong.notes) throw new Error("Sangfil mangler 'tempo' eller 'notes'.");
             console.log("handleSongSelect: Sangdata validert OK.");
             songInfoDiv.textContent = `Klar: ${currentSong.title || availableSongs[selectedFilename]} (${currentSong.artist || 'Ukjent'})`;
             currentPlaybackBPM = currentSong.tempo;
             bpmInputElement.value = currentPlaybackBPM;
             originalBpmSpan.textContent = `(Original: ${currentSong.tempo} BPM)`;
             bpmInputElement.disabled = false;
             playButton.disabled = false;
             songSelector.disabled = false; // *** Aktiver igjen ***
             console.log("handleSongSelect: UI oppdatert, kaller resetPlayback (songSelector disabled: false).");
             resetPlayback(); // Nullstill avspillingstilstand
             console.log("handleSongSelect: Ferdig med vellykket last.");
         })
        .catch(error => {
             console.error("handleSongSelect: FEIL i fetch-kjeden:", error);
             songInfoDiv.textContent = `Feil: Kunne ikke laste sangen "${availableSongs[selectedFilename]}". ${error.message}`;
             currentSong = null;
             resetUI(); // Tilbakestill UI ved feil
             resetPlayback();
             drawPianos();
             songSelector.disabled = false; // *** Aktiver også ved feil ***
             console.log("handleSongSelect: FEIL (songSelector disabled: false)");
         });
    console.log("handleSongSelect: Fetch-kallet er startet (async).");
}

function handlePlaybackBpmChange(event) { /* ... som før ... */ }
function handleVolumeChange() { /* ... som før ... */ }
function handleMuteToggle() { /* ... som før ... */ }
// === 4: EVENT LISTENERS OG UI HÅNDTERING SLUTT ===


// === 5: PIANO TEGNING OG KEY MAPPING START ===
function buildKeyMappings() { /* ... som før ... */ }
function buildSpecificKeyMapping(canvasElement, pianoHeightPx, mappingObject) { /* ... som før ... */ }
function drawPianos() { /* ... som før ... */ }
function drawSpecificPiano(ctx, canvasElement, pianoHeightPx, mappingObject, activeHighlightKeys, highlightColor) { /* ... som før ... */ }
function drawRecordPiano() { /* ... som før ... */ }
// === 5: PIANO TEGNING OG KEY MAPPING SLUTT ===


// === 6: AVSPILLINGS KONTROLL START ===
function togglePlayback() { /* ... som før ... */ }
function playSong() {
    // ... (starten som før)
    songSelector.disabled = true; // *** Deaktiver ved start ***
    // ... (resten som før)
}
function pauseSongVisuals() {
    console.log("pauseSongVisuals: Kjører.");
    isPlaying = false;
    playButton.textContent = "Spill av";
    bpmInputElement.disabled = false;
    songSelector.disabled = false; // *** Aktiver ved stopp/pause ***
    console.log("pauseSongVisuals: Stopper animasjonsløkke. ID:", animationFrameId, "songSelector disabled:", songSelector.disabled);
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; console.log("pauseSongVisuals: animationFrameId nullstilt."); } else { console.log("pauseSongVisuals: Ingen animationFrameId å stoppe."); }
    activeKeys.clear();
    drawPianos();
    console.log("pauseSongVisuals: Visuell avspilling stoppet.");
}
// *** Forenklet resetPlayback ***
function resetPlayback() {
    console.log("resetPlayback: Kjører.");
    // Stopp lyd og visuelt (pauseSongVisuals håndterer det meste av UI)
    stopSoundPlayback();
    if (isPlaying || animationFrameId) { // Bare kall pause hvis noe faktisk kjører
        pauseSongVisuals();
    }

    playbackStartTime = 0; // Nullstill tid
    activeKeys.clear(); // Tøm aktive taster (gjort i pause, men for sikkerhets skyld)

    // Status på knapper etc. settes nå i pauseSongVisuals og resetUI
    // Sjekk kun om vi har en sang for å evt. justere play-knapp
     if (!currentSong) {
         playButton.disabled = true;
         bpmInputElement.disabled = true; // Også deaktiver bpm hvis ingen sang
         console.log("resetPlayback: Ingen sang lastet.");
     } else {
         playButton.disabled = false;
         bpmInputElement.disabled = false;
         console.log("resetPlayback: Sang lastet.");
     }
     songSelector.disabled = false; // *** ALLTID aktivert etter reset ***

    if (gameCtx) gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawPianos(); // Tegn pianoer i korrekt (ikke-spillende) tilstand
    console.log("resetPlayback: Avspilling nullstilt ferdig. songSelector disabled:", songSelector.disabled); // LOG status
}
// === 6: AVSPILLINGS KONTROLL SLUTT ===


// === 7: ANIMASJONSLØKKE (Avspilling) START ===
function gameLoop() { /* ... som før ... */ }
// === 7: ANIMASJONSLØKKE (Avspilling) SLUTT ===


// === 8: TEGNE FALLENDE NOTER START ===
function drawFallingNotes(currentBeat) { /* ... som før ... */ }
// === 8: TEGNE FALLENDE NOTER SLUTT ===


// === 9: START PROGRAMMET START ===
initialize();
// === 9: START PROGRAMMET SLUTT ===


// === 10: WEB AUDIO FUNKSJONER START ===
function initAudio() { /* ... som før ... */ }
function noteToFrequency(noteName) { /* ... som før ... */ }
function scheduleSongAudio() { /* ... som før ... */ }
function stopSoundPlayback() { /* ... som før ... */ }
function playFeedbackTone(noteName) { /* ... som før ... */ }
// === 10: WEB AUDIO FUNKSJONER SLUTT ===


// === 11: INNSPILINGSFUNKSJONER START ===
function handleRecordModeChange() { /* ... som før ... */ }
function getKeyAtRecordCoords(canvas, event) { /* ... som før ... */ }
function handleRecordPianoMouseDown(event) { /* ... som før ... */ }
function handleRecordPianoMouseUp(event) { /* ... som før ... */ }
function startRecording() { /* ... som før ... */ }
function stopRecording() { /* ... som før ... */ }
function clearRecording() { /* ... som før ... */ }
function quantizeRecordedNotes() { /* ... som før (plassholder) ... */ }
function addStepNote() { /* ... som før ... */ }
function addStepRest() { /* ... som før ... */ }
function generateJsonOutput() { /* ... som før ... */ }
function copyJsonToClipboard() { /* ... som før ... */ }
// === 11: INNSPILINGSFUNKSJONER SLUTT ===
