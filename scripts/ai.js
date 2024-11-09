// Funkcja do przechwycenia klatki z playera wideo
function captureFrame(videoElement) {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    return canvas;
}

function recognizeDispatchData(canvas) {
    return Tesseract.recognize(
        canvas,
        'eng',
        {
            logger: m => console.log(m) // Informacje o przetwarzaniu (opcjonalnie)
        }
    ).then(({ data: { text } }) => {
        console.log("Rozpoznany tekst:", text);
        return text;
    });
}

function parseDispatchText(text) {
    const eventTypeMatch = text.match(/ST[AĄ]RZ[AĄ]ŁY|PO[ŻZ]AR|WYPAD[AĄ]K|NAPAD/); // dopasowanie do różnych zdarzeń
    const streetMatch = text.match(/(?:ulica|street|st)\s*([^\n]+)/i);
    const distanceMatch = text.match(/(\d+\.\d+)\s*km/i);
    const timeMatch = text.match(/(\d+)\s*minut/i);

    return {
        eventType: eventTypeMatch ? eventTypeMatch[0] : null,
        street: streetMatch ? streetMatch[1].trim() : null,
        distance: distanceMatch ? parseFloat(distanceMatch[1]) : null,
        time: timeMatch ? parseInt(timeMatch[1]) : null,
    };
}

// Zmienna do przechowywania historii dispatch dla różnych streamerów
let dispatchHistory = {};

// Funkcja do zapisywania zdarzeń do historii dla każdego streamera z filtrowaniem
function saveToHistory(streamerId, dispatchData) {
    if (!dispatchHistory[streamerId]) {
        dispatchHistory[streamerId] = [];
    }
    const lastEvent = dispatchHistory[streamerId][dispatchHistory[streamerId].length - 1];
    
    // Filtrowanie - jeśli nowe zdarzenie jest takie samo jak ostatnie, pomiń zapis
    if (
        lastEvent &&
        lastEvent.eventType === dispatchData.eventType &&
        lastEvent.street === dispatchData.street &&
        lastEvent.distance === dispatchData.distance &&
        lastEvent.time === dispatchData.time
    ) {
        console.log("Zdarzenie duplikowane, pominięto zapis.");
        return;
    }

    dispatchHistory[streamerId].push(dispatchData);
    console.log(`Zapisano zdarzenie dla ${streamerId}:`, dispatchData);
    updateHistoryUI(streamerId, dispatchData);
}

// Aktualizacja interfejsu
function updateHistoryUI(streamerId, dispatchData) {
    const historyList = document.getElementById("history-list");
    const listItem = document.createElement("li");
    listItem.className = "history-item";
    listItem.innerHTML = `
        <strong>Typ zdarzenia:</strong> ${dispatchData.eventType} <br>
        <strong>Ulica:</strong> ${dispatchData.street} <br>
        <strong>Odległość:</strong> ${dispatchData.distance} km <br>
        <strong>Czas:</strong> ${dispatchData.time} minut
    `;
    historyList.appendChild(listItem);
}

// Główna funkcja do przechwytywania danych z dispatch
async function captureDispatch(videoElement, streamerId) {
    const canvas = captureFrame(videoElement);
    const text = await recognizeDispatchData(canvas);
    const dispatchData = parseDispatchText(text);

    if (dispatchData.eventType && dispatchData.street) {
        saveToHistory(streamerId, dispatchData);
    } else {
        console.log("Nie znaleziono danych dispatch do zapisania.");
    }
}

// Przykład cyklicznego zczytywania klatek co kilka sekund
const videoElement = document.querySelector('video');
const streamerId = 'streamer_unique_id';

setInterval(() => {
    captureDispatch(videoElement, streamerId);
}, 5000); // co 5 sekund
