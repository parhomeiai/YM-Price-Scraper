let CONFIG = null;

async function loadConfig() {
    const url = chrome.runtime.getURL("config.json");
    const r = await fetch(url);
    return await r.json();
}

async function init() {
    CONFIG = await loadConfig();
    log("Config loaded");
}

init();

async function waitConfig() {
    while (!CONFIG) {
        await new Promise(res => setTimeout(res, 10));
    }
}

let isRunning = false;

async function ensureOffscreen() {
    const exists = await chrome.offscreen.hasDocument();
    if (!exists) {
        log("Создаём offscreen.html");
        
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['DOM_PARSER'],
            justification: 'Требуется парсинг HTML'
        });
    }
}

// --- Получение списка моделей ---
async function fetchModels() {
    await waitConfig();
    const url = CONFIG.api.baseUrl + CONFIG.api.listEndpoint;
    
    log("Запрос списка моделей...");
    
    const r = await fetch(url);
    const data = await r.json();
    
    log("Получено моделей: " + Object.keys(data).length);

    return Object.values(data).map(v => ({
        ...v,
        url: `https://market.yandex.ru/product/${v.modelId}?sku=${v.sku}&uniqueId=${v.uniqueId}`
    }));
}

// --- Быстрый fetch() HTML + извлечение embedded JSON ---
async function fetchPriceFromHTML(url) {
    await waitConfig();
    
    await log("Загрузка HTML: " + url);

    const html = await fetch(url, {
        headers: {
            "User-Agent": CONFIG.market.userAgent,
            ...CONFIG.market.headers
        }
    }).then(r => r.text());

    await ensureOffscreen();

    return new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { 
                action: "parsePrice", 
                html,
                selectors: CONFIG.market.priceSelectors
            },
            (response) => {
                log("Цена получена: " + (response?.price || "NULL"));
                resolve(response?.price || null);
            }
        );
    });
}

// --- Отправка цены в API ---
async function sendPriceToAPI(sku, price) {
    await waitConfig();
    const url = CONFIG.api.baseUrl + CONFIG.api.priceEndpoint;
    
    await log(`Отправка в API: SKU=${sku}, price=${price}`);
    
    return fetch(url, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ sku, cardPrice: price }])
    }).then(x => x.json());
}

// --- Основной цикл парсинга ---
async function runScraper() {
    await waitConfig();
    if (!isRunning) {
        log("runScraper: остановлено");
        return;
    }

    sendStatus("Получаем список товаров…");

    const models = await fetchModels();

    sendStatus(`Товаров: ${models.length}`);

    for (const model of models) {
        if (!isRunning) break;

        try {
            sendStatus(`Парсим SKU ${model.sku}…`);
            const price = await fetchPriceFromHTML(model.url);

            if (!price) {
                log("Цена не найдена для SKU " + model.sku);
                continue;
            }

            await sendPriceToAPI(model.sku, price);

        } catch (e) {
            console.log("Ошибка:", e);
        }
    }

    sendStatus("Готово. Новый цикл через " + CONFIG.scraper.cycleDelay + " мс.");
    setTimeout(runScraper, CONFIG.scraper.cycleDelay);
}

// --- Сообщение в popup ---
function sendStatus(text) {
    chrome.runtime.sendMessage({ action: 'status', text });
}

// --- Команды из popup ---
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'startScraping') {
        if (!isRunning) {
            isRunning = true;
            runScraper();
            sendStatus("Стартуем…");
        }
    }

    if (msg.action === 'stopScraping') {
        isRunning = false;
        sendStatus("Остановлено.");
    }
});


// ---------------- ЛОГИ ----------------
let LOGS = [];
const MAX_LOGS = 5000;

async function log(text) {
    await waitConfig();
    if (!CONFIG.scraper.logEnabled) return;
    
    const line = `[${new Date().toISOString()}] ${text}`;
    console.log(line);

    if (CONFIG.scraper.saveLogs) {
        LOGS.push(line);
        if (LOGS.length > MAX_LOGS) LOGS.shift();

        chrome.storage.local.set({ scraperLogs: LOGS });
    }

    chrome.runtime.sendMessage({ action: "uiLog", text: line }).catch(() => {});
}

function status(text) {
    log("STATUS → " + text);
    chrome.runtime.sendMessage({ action: "status", text }).catch(() => {});
}