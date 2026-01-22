(function () {
    'use strict';

    let cachedPreloadEmoji = null;

    const originalFetch = window.fetch;
    if (typeof originalFetch !== 'function') return;

    window.fetch = async function (resource, options) {
        const url = typeof resource === 'string' ? resource : (resource.url || "");

        if (!url.includes("api.bilibili.com/x/emote/user/panel/web")) {
            return originalFetch.apply(this, arguments);
        }

        try {
            const response = await originalFetch.apply(this, arguments);
            if (!cachedPreloadEmoji || !response.ok) return response;

            const clonedResponse = response.clone();
            let responseText = await clonedResponse.text();

            const active = document.activeElement;
            const isCommentBox = active && (active.tagName === "BILI-COMMENTS" || active.closest('bili-comments'));

            if (isCommentBox) {
                try {
                    const json = JSON.parse(responseText);
                    if (json?.data?.packages) {
                        const insertIndex = Math.min(4, json.data.packages.length);
                        json.data.packages.splice(insertIndex, 0, cachedPreloadEmoji);
                        responseText = JSON.stringify(json);
                    }
                } catch (e) { }
            }

            return new Response(responseText, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });

        } catch (err) {
            return originalFetch.apply(this, arguments);
        }
    };

    const getUid = () => {
        try {
            const upAvatar = document.querySelector("a.up-avatar");
            const midMatch = upAvatar?.href?.match(/\/(\d+)(\/|$)/);
            const mid = midMatch ? midMatch[1] : null;
            return mid;
        } catch (e) {
            return null;
        }
    };

    const getCsrf = () => {
        const match = document.cookie.match(/bili_jct=([^;]+)/);
        return match ? match[1] : "";
    };

    const buildData = (emos, mid, isLocked) => {
        if (!Array.isArray(emos) || emos.length === 0) return null;

        const timestamp = Math.floor(Date.now() / 1000);

        const emo = {
            attr: 2,
            flags: { added: true, preview: true },
            id: 1,
            label: null,
            meta: { size: 1, item_id: 0 },
            mtime: timestamp,
            package_sub_title: "",
            ref_mid: 0,
            resource_type: 0,
            text: "充电表情",
            type: 1,
            url: emos[0].icon,
            emote: emos.map(item => ({
                activity: null,
                attr: 0,
                flags: { unlocked: isLocked },
                id: item.id,
                meta: { size: 2, alias: item.name },
                mtime: timestamp,
                package_id: 0,
                text: `[UPOWER_${mid}_${item.name}]`,
                type: 3,
                url: item.icon
            }))
        };

        return emo;
    }

    const loadExtraData = async (mid) => {
        const csrf = getCsrf();
        if (!csrf || !mid) return null;

        try {
            const url = `https://api.bilibili.com/x/upowerv2/gw/rights/guide?csrf=${encodeURIComponent(csrf)}&up_mid=${mid}`;
            const resp = await originalFetch(url, {
                method: "GET",
                credentials: "include"
            });
            if (!resp.ok) return null;
            return await resp.json();
        } catch (err) {
            console.error("[EmojiEnhancer] 加载额外数据失败:", err);
            return null;
        }
    }

    const init = async () => {
        try {
            const mid = getUid();

            if (!mid) return;

            const res = await loadExtraData(mid);
            if (res?.data?.rights) {
                let isLocked = true;
                let rawEmojis = [];

                // 遍历权限列表
                for (const right of res.data.rights) {
                    for (const item of (right.right_list || [])) {
                        if (item.right_type === "medal") {
                            if (isLocked) {
                                isLocked = !!item.locked;
                            }
                        } else if (item.right_type === "emote") {
                            rawEmojis = item.list || [];
                        }
                    }
                }

                if (rawEmojis.length > 0) {
                    cachedPreloadEmoji = buildData(rawEmojis, mid, isLocked);
                }
            }
        } catch (err) {
            console.error("[EmojiEnhancer] 初始化失败:", err);
        }
    };

    init();
})();