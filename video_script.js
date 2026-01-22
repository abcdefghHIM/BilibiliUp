(async function () {
    const core = window.EmojiEnhancerCore;
    try {
        core.setupInterceptor();
    }
    catch (err) { return; }

    const mid = window.__INITIAL_STATE__?.upData?.mid;
    if (!mid) return;
    await core.loadAndCache(mid, core.baseBuildData);
})();