window.injectVariable = window.__NEPTUNE_IS_MY_WAIFU__.roomInfoRes.data.room_info.uid;

const originalFetch = window.fetch;

window.fetch = async function (resource, options) {
    const response = await originalFetch(resource, options);

    const url = resource instanceof Request ? resource.url : resource.toString();

    if (url.includes("api.bilibili.com/x/emote/user/panel/web")) {
        try {
            const clonedResponse = response.clone();
            let responseText = await clonedResponse.text();

            const active = document.activeElement;
            if (active && active.tagName === "BILI-COMMENTS") {
                if (window.preloadCommEmoji) {
                    const json1 = JSON.parse(responseText);
                    if (json1.data && json1.data.packages) {
                        json1.data.packages.splice(4, 0, window.preloadCommEmoji);
                    }
                    responseText = JSON.stringify(json1);
                }
            }

            return new Response(responseText, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        } catch (e) {
            return response;
        }
    }
    return response;
};

(function () {

    function preloadExtraData() {
        let bili_jct = (document.cookie.match(/bili_jct=([^;]+)/) || [])[1] || "";
        if (!bili_jct) return;

        return fetch("https://api.bilibili.com/x/upowerv2/gw/rights/guide?csrf=" + encodeURIComponent(bili_jct) + "&up_mid=" + window.injectVariable, {
            method: "GET",
            credentials: "include"
        }).then(resp => resp.clone().json())
            .then(data => {
                window.preloadJson = data;

                if (data.data != null) {
                    let locked = true;
                    let emojis = [];
                    for (const right of data.data.rights) {
                        //遍历权利列表
                        for (const right1 of right.right_list) {
                            //检查有没有解锁
                            if (right1.right_type == "medal") {
                                if (locked) {
                                    locked = right1.locked;
                                }
                            }
                            //表情
                            else if (right1.right_type == "emote") {
                                emojis = right1.list;
                            }
                        }
                    }
                    if (!locked) {
                        window.preloadEmoji = buildData(emojis);
                        window.preloadCommEmoji = buildCommData(emojis);
                    }
                }
            });
    }

    preloadExtraData();
})();

function buildData(emos) {
    let emo = {};
    emo.current_cover = emos[0].icon;
    emo.pkg_descript = "充电表情";
    emo.pkg_name = "充电表情";
    emo.pkg_perm = 1;
    emo.pkg_type = 5;
    emo.emoticons = [];
    emo.recently_used_emoticons = [];
    emo.top_show = {};

    emo.top_show.top_left = {};
    emo.top_show.top_left.image = "";
    emo.top_show.top_left.text = "";

    emo.top_show.top_right = {};
    emo.top_show.top_right.image = "";
    emo.top_show.top_right.text = "";

    emo.pkg_id = 1;
    emo.unlock_identity = 0;
    emo.unlock_need_gift = 0;
    for (const item of emos) {
        let e = {};
        e.bulge_display = 1;
        e.descript = item.name;
        e.emoji = item.name;
        e.emoticon_unique = "upower_[UPOWER_" + window.injectVariable + "_" + item.name + "]";
        e.emoticon_value_type = 1;
        e.identity = 99;
        e.in_player_area = 1;
        e.perm = 1;
        e.url = item.icon;
        e.is_dynamic = 0;
        e.height = 162;
        e.width = 162;
        e.unlock_need_gift = 0;
        e.unlock_need_level = 0;
        e.unlock_show_color = "";
        e.unlock_show_image = "";
        e.unlock_show_text = "";
        e.emoticon_id = item.id;


        emo.emoticons.push(e);
    }

    return emo;
}

function buildCommData(emos) {
    let emo = {};
    emo.attr = 2;
    emo.flags = {};
    emo.flags.added = true;
    emo.flags.preview = true;
    emo.id = 1;
    emo.label = null;
    emo.meta = {};
    emo.meta.size = 1;
    emo.meta.item_id = 0;
    emo.mtime = 1756886863;
    emo.package_sub_title = "";
    emo.ref_mid = 0;
    emo.resource_type = 0;
    emo.text = "充电表情";
    emo.type = 1;
    emo.url = emos[0].icon;

    emo.emote = [];
    for (const item of emos) {
        let e = {};
        e.activity = null;
        e.attr = 0;
        e.flags = {};
        e.flags.unlocked = false;
        e.id = item.id;
        e.meta = {};
        e.meta.size = 2;
        e.meta.alias = item.name;
        e.mtime = 1756886863;
        e.package_id = 0;
        e.text = "[UPOWER_" + window.injectVariable + "_" + item.name + "]";
        e.type = 3;
        e.url = item.icon;

        emo.emote.push(e);
    }

    return emo;
}

const oldPush = self.webpackChunklive_room.push;

self.webpackChunklive_room.push = function (chunk) {
    const modules = chunk[1];

    for (const id in modules) {
        if (!modules.hasOwnProperty(id)) continue;

        if (id == 1649) {
            const orig = modules[id];

            modules[id] = function (t, e, r) {
                let source = orig.toString();
                const targetStr = "this.emoticonsList=n.data||[]";
                const newStr = '(function(data){if(window.preloadEmoji){const protoPkg=data[0];const myPkg=Object.assign(Object.create(Object.getPrototypeOf(protoPkg)),protoPkg);myPkg.current_cover=window.preloadEmoji.current_cover;myPkg.pkg_descript="充电表情";myPkg.pkg_id=1;myPkg.pkg_name="充电表情";myPkg.pkg_perm=1;myPkg.pkg_type=5;myPkg.recently_used_emoticons=[];const protoEmoji=myPkg.emoticons[0];myPkg.emoticons=[];for(const emoji of window.preloadEmoji.emoticons){const myEmoji=Object.assign(Object.create(Object.getPrototypeOf(protoEmoji)),protoEmoji);myEmoji.bulge_display=1;myEmoji.descript=emoji.descript;myEmoji.emoji=emoji.emoji;myEmoji.emoticon_id=emoji.emoticon_id;myEmoji.emoticon_unique=emoji.emoticon_unique;myEmoji.emoticon_value_type=emoji.emoticon_value_type;myEmoji.height=emoji.height;myEmoji.identity=emoji.identity;myEmoji.in_player_area=emoji.in_player_area;myEmoji.is_dynamic=emoji.is_dynamic;myEmoji.url=emoji.url;myEmoji.width=emoji.width;myPkg.emoticons.push(myEmoji)}data.splice(3,0,myPkg)}})(n.data),';
                if (source.includes(targetStr)) {
                    source = source.replace(targetStr, newStr + targetStr);
                }
                const patchedFunc = new Function('t', 'e', 'r', `(${source})(t, e, r)`);
                return patchedFunc(t, e, r);
            };
        }
    }
    return oldPush.apply(this, arguments);
};
