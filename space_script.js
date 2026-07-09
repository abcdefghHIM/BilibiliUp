(async function () {
    const core = window.EmojiEnhancerCore;
    try {
        core.setupInterceptor();
    }
    catch (err) { return; }

    const host = window.location.hostname;
    let mid;

    if (host === 'space.bilibili.com') {
        mid = window.location.pathname.split('/')[1];
    } else if (host === 'www.bilibili.com' && window.location.pathname.startsWith('/opus/')) {
        mid = window.__INITIAL_STATE__?.detail?.basic?.uid;
    }

    if (!mid) return;
    await core.loadAndCache(mid, core.baseBuildData);
})();