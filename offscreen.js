function log(text) {
    chrome.runtime.sendMessage({
        action: "uiLog",
        text: `[offscreen] ${text}`
    }).catch(()=>{});
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if (msg.action === "parsePrice") {
        log("Парсим HTML (" + msg.html.length + " bytes)");

        const parser = new DOMParser();
        const doc = parser.parseFromString(msg.html, "text/html");

        const selectors = msg.selectors;

        let price = null;

        for (const selector of selectors) {            
            const nodes = doc.querySelectorAll(selector);
            if (!nodes.length) continue;

            for (const el of nodes) {
                const text = el.textContent.trim().replace(/\s+/g, ' ');
                if (/\d/.test(text)) {
                    price = text;
                    break;
                }
            }
            if (price) break;
        }

        log("Парсинг завершён, цена: " + price);
        sendResponse({ price });
    }

    return true; // async response
});