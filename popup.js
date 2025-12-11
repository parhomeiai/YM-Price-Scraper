const logBox = document.getElementById("log");
const statusBox = document.getElementById("status");

function appendLog(text) {
    logBox.value += text + "\n";
}

document.getElementById('start').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startScraping' });
});

document.getElementById('stop').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopScraping' });
});

document.getElementById('clearLog').addEventListener('click', () => {
    chrome.storage.local.remove("scraperLogs");
    logBox.value = "";
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'status') {
        statusBox.textContent = msg.text;
        appendLog("[STATUS] " + msg.text);
    }
  
    if (msg.action === "uiLog") {
        appendLog(msg.text);
    }
});

// Загрузка логов при открытии popup
chrome.storage.local.get("scraperLogs", (res) => {
    if (res.scraperLogs) {
        res.scraperLogs.forEach(l => appendLog(l));
    }
});
