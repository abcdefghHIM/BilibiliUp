(async function () {
    const core = window.EmojiEnhancerCore;
    try {
        core.setupInterceptor();
    }
    catch (err) { return; }

    const mid = window.location.pathname.split('/')[1];
    if (!mid) return;
    await core.loadAndCache(mid, core.baseBuildData);
})();