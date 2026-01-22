function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject(new Error('loadScript: url is empty'));
            return;
        }

        const parent = document.head || document.documentElement;
        if (!parent) {
            reject(new Error('loadScript: document not ready'));
            return;
        }

        const s = document.createElement('script');
        s.src = url;
        s.async = false;

        const cleanup = () => {
            s.onload = null;
            s.onerror = null;
            s.remove();
        };

        s.onload = () => {
            cleanup();
            resolve();
        };

        s.onerror = () => {
            cleanup();
            reject(new Error(`Failed to load script: ${url}`));
        };

        parent.appendChild(s);
    });
}

(async () => {
    try {
        if (!chrome?.runtime?.getURL) {
            throw new Error('Not in Chrome extension context');
        }

        await loadScript(chrome.runtime.getURL('core.js'));
        await loadScript(chrome.runtime.getURL('space_script.js'));
    } catch (e) {
        console.error(e);
    }
})();
