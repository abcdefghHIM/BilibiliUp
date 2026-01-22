window.EmojiEnhancerCore = (function () {
    'use strict';

    let cachedPreloadEmoji = null;
    const EMOTE_API_PATH = "api.bilibili.com/x/emote/user/panel/web";
    const TARGET_RIGHT_API = "api.bilibili.com/x/upowerv2/gw/rights/guide";

    const originalFetch = window.fetch;

    const getUrlString = (resource) => {
        if (typeof resource === 'string') return resource;
        if (resource instanceof Request) return resource.url;
        if (resource instanceof URL) return resource.href;
        return String(resource);
    };

    const setupInterceptor = () => {
        if (typeof originalFetch !== 'function') return;

        window.fetch = async function (...args) {
            const [resource, options] = args;

            const url = getUrlString(resource);

            if (!url.includes(EMOTE_API_PATH)) {
                return originalFetch.apply(this, args);
            }

            try {
                const response = await originalFetch.apply(this, arguments);
                const ct = response.headers.get("content-type") || "";
                if (!cachedPreloadEmoji || !response.ok || !ct.includes("application/json")) {
                    return response;
                }

                const active = document.activeElement;
                const isCommentBox = !!(
                    active &&
                    (active.tagName?.includes("BILI-COMMENT") || active.closest?.("bili-comments"))
                );

                if (!isCommentBox) return response;

                const clonedResponse = response.clone();
                let json;
                try {
                    json = await clonedResponse.json();
                } catch {
                    return response;
                }

                if (json?.data?.packages) {
                    const hasAlready = json.data.packages.some(p => p.text === cachedPreloadEmoji.text);
                    if (!hasAlready) {
                        const insertIndex = Math.min(4, json.data.packages.length);
                        json.data.packages.splice(insertIndex, 0, cachedPreloadEmoji);
                    }
                }

                const modifiedText = JSON.stringify(json);
                const headers = new Headers(response.headers);
                headers.delete("content-length");

                return new Response(modifiedText, {
                    status: response.status,
                    statusText: response.statusText,
                    headers
                });
            } catch (err) {
                return originalFetch.apply(this, args);
            }
        };
    };

    const getCsrf = () => document.cookie.match(/bili_jct=([^;]+)/)?.[1] || "";

    const loadAndCache = async (mid, buildDataFn) => {
        const csrf = getCsrf();
        if (!csrf || !mid) return null;

        try {
            const params = new URLSearchParams({
                csrf: csrf,
                up_mid: mid
            });

            const url = `https://${TARGET_RIGHT_API}?${params}`;
            const resp = await originalFetch(url, {
                method: "GET",
                credentials: "include",
                signal: AbortSignal.timeout?.(10000)
            });
            if (!resp.ok) return null;
            const res = await resp.json();

            if (res?.data?.rights) {
                let isLocked = true;
                let rawEmojis = [];

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
                    cachedPreloadEmoji = buildDataFn(rawEmojis, mid, isLocked);
                    return { rawEmojis, mid, isLocked };
                }
            }
        } catch (err) {
        }
    };

    const baseBuildData = (emos, mid) => {
        if (!Array.isArray(emos) || emos.length === 0) return null;

        const timestamp = Math.floor(Date.now() / 1000);

        return {
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
                flags: { unlocked: true },
                id: item.id,
                meta: { size: 2, alias: item.name },
                mtime: timestamp,
                package_id: 0,
                text: `[UPOWER_${mid}_${item.name}]`,
                type: 3,
                url: item.icon
            }))
        };
    };

    return { setupInterceptor, loadAndCache, baseBuildData, originalFetch };
})();