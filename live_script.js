(async function () {
    try {
        const core = window.EmojiEnhancerCore;
        core.setupInterceptor();
    }
    catch (err) { return; }


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

    const buildLiveData = (emos, mid, perm) => {
        if (!Array.isArray(emos) || emos.length === 0) return null;

        return {
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
    }

    const mid = window.__NEPTUNE_IS_MY_WAIFU__?.roomInfoRes?.data?.room_info?.uid;
    if (!mid) return;
    await core.loadAndCache(mid, (emos, mid, locked) => {
        window.preloadEmoji = buildLiveData(emos, mid, locked ? 0 : 1);
        return core.baseBuildData(emos, mid);
    });

    patchWebpack();
})();