(function () {
    'use strict';

    let cachedPreloadEmoji = null;

    const originalFetch = window.fetch;
    if (typeof originalFetch !== 'function') return;

    window.fetch = async function (resource, options) {
        let url = "";
        try {
            if (typeof resource === "string") url = resource;
            else if (resource instanceof Request) url = resource.url;
        } catch { }

        // 仅拦截表情包面板接口
        if (!url.includes("api.bilibili.com/x/emote/user/panel/web")) {
            return originalFetch.apply(this, arguments);
        }

        try {
            const response = await originalFetch(resource, options);
            if (!cachedPreloadEmoji || !response.ok) return response;

            const ct = response.headers.get("content-type") || "";
            if (!ct.includes("application/json")) return response;

            const clonedResponse = response.clone();
            let responseText = await clonedResponse.text();

            const active = document.activeElement;
            let isCommentBox = false;
            try {
                isCommentBox = !!(
                    active &&
                    (active.tagName?.toUpperCase() === "BILI-COMMENTS" ||
                        active.closest?.("bili-comments"))
                );
            } catch { }

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

            const headers = new Headers(response.headers);
            headers.delete("content-length");

            return new Response(responseText, {
                status: response.status,
                statusText: response.statusText,
                headers
            });

        } catch (err) {
            return originalFetch.apply(this, arguments);
        }
    };

    const getUid = () => {
        try {
            return window.__NEPTUNE_IS_MY_WAIFU__?.roomInfoRes?.data?.room_info?.uid || null;
        } catch (e) {
            return null;
        }
    };

    const getCsrf = () => {
        const match = document.cookie.match(/bili_jct=([^;]+)/);
        return match ? match[1] : "";
    };

    const buildData = (emos, mid, perm) => {
        if (!Array.isArray(emos) || emos.length === 0) return null;

        const emo = {
            current_cover: emos[0].icon,
            pkg_descript: "充电表情",
            pkg_name: "充电表情",
            pkg_perm: 1,
            pkg_type: 5,
            pkg_id: 1,
            unlock_identity: 0,
            unlock_need_gift: 0,
            top_show: {
                top_left: {
                    image: "",
                    text: ""
                },
                top_right: {
                    image: "",
                    text: ""
                }
            },
            emoticons: emos.map(item => ({
                bulge_display: 1,
                descript: item.name,
                emoji: item.name,
                emoticon_unique: `upower_[UPOWER_${mid}_${item.name}]`,
                emoticon_value_type: 1,
                identity: 99,
                in_player_area: 1,
                perm: perm,
                url: item.icon,
                is_dynamic: 0,
                width: 162,
                height: 162,
                unlock_need_gift: 0,
                unlock_need_level: 0,
                unlock_show_color: "",
                unlock_show_image: "",
                unlock_show_text: "",
                emoticon_id: item.id
            })),

            recently_used_emoticons: []
        };
        return emo;
    }

    const buildCommData = (emos, mid) => {
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

    const patchWebpack = () => {
        if (!self.webpackChunklive_room) return;

        const oldPush = self.webpackChunklive_room.push;

        self.webpackChunklive_room.push = function (chunk) {
            const modules = chunk[1];
            for (const id in modules) {
                if (!modules.hasOwnProperty(id)) continue;

                const originalModule = modules[id];
                const source = originalModule.toString();

                const match = source.match(/this\.emoticonsList\s*=\s*([a-zA-Z0-9_$]+)\.data\s*\|\|\s*\[\]/);
                if (match) {
                    modules[id] = function (t, e, r) {
                        let source = originalModule.toString();
                        const targetStr = match[0];

                        const injectLogic = `(function (data) {
    if (window.preloadEmoji) {
        try {
            const protoPkg = data[0];
            const myPkg = Object.assign(Object.create(Object.getPrototypeOf(protoPkg)), protoPkg);

            myPkg.current_cover = window.preloadEmoji.current_cover;
            myPkg.pkg_descript = "充电表情";
            myPkg.pkg_id = 1;
            myPkg.pkg_name = "充电表情";
            myPkg.pkg_perm = 1;
            myPkg.pkg_type = 5;
            myPkg.recently_used_emoticons = [];

            const protoEmoji = myPkg.emoticons[0];

            myPkg.emoticons = [];

            for (const emoji of window.preloadEmoji.emoticons) {
                const myEmoji = Object.assign(Object.create(Object.getPrototypeOf(protoEmoji)), protoEmoji);
                myEmoji.bulge_display = 1;
                myEmoji.descript = emoji.descript;
                myEmoji.emoji = emoji.emoji;
                myEmoji.emoticon_id = emoji.emoticon_id;
                myEmoji.emoticon_unique = emoji.emoticon_unique;
                myEmoji.emoticon_value_type = emoji.emoticon_value_type;
                myEmoji.height = emoji.height;
                myEmoji.identity = emoji.identity;
                myEmoji.in_player_area = emoji.in_player_area;
                myEmoji.is_dynamic = emoji.is_dynamic;
                myEmoji.perm = emoji.perm;
                myEmoji.url = emoji.url;
                myEmoji.width = emoji.width;
                myPkg.emoticons.push(myEmoji);
            }

            data.splice(Math.min(data.length, 3), 0, myPkg);
        }
        catch (err) {

        }

    }
})(n.data),`;

                        source = source.replace(targetStr, injectLogic + targetStr);

                        return new Function('t', 'e', 'r', `(${source})(t, e, r)`)(t, e, r);
                    };
                }
            }
            return oldPush.apply(this, arguments);
        };
    };

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
                    window.preloadEmoji = buildData(rawEmojis, mid, isLocked ? 0 : 1);
                    if (!isLocked) {
                        cachedPreloadEmoji = buildCommData(rawEmojis, mid);
                    }
                }
            }
        } catch (err) { }
    }

    patchWebpack();
    init();

})();