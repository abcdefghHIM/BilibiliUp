/*
https://api.bilibili.com/x/emote/user/panel/web?business=reply
 */


function loadScript(url) {
    return new Promise((resolve, reject) => {
        var s = document.createElement('script');
        s.src = url;
        s.onload = () => { s.remove(); resolve(); };
        s.onerror = reject;
        (document.head || document.documentElement).appendChild(s);
    });
}

(async () => {
    await loadScript(chrome.runtime.getURL('space_script.js'));
})();
