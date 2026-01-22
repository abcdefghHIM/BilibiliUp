(async function () {
    try {
        const core = window.EmojiEnhancerCore;
        core.setupInterceptor();
    }
    catch (err) { return; }

    const mid = window.__INITIAL_STATE__?.upData?.mid;
    if (!mid) return;
    await core.loadAndCache(mid, core.baseBuildData);
})();