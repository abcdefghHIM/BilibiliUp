window.injectVariable = window.__NEPTUNE_IS_MY_WAIFU__.roomInfoRes.data.room_info.uid;

const originalFetch = window.fetch;

window.fetch = async function (resource, options) {
    const response = await originalFetch(resource, options);
    let responseText;

    const clonedResponse = response.clone();
    responseText = await clonedResponse.text();
    if (resource.includes("api.bilibili.com/x/emote/user/panel/web")) {
        const active = document.activeElement;
        if (active.tagName === "BILI-COMMENTS") {
            let mid = window.injectVariable;
            const data = window.preloadJson;
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
                const json1 = JSON.parse(responseText);
                let upEmo = buildCommData(emojis);
                json1.data.packages.splice(4, 0, upEmo);

                responseText = JSON.stringify(json1);
            }
        }
    }

    return new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    });
};

(function () {
    let extraDataCache = null;

    function preloadExtraData() {
        let bili_jct = (document.cookie.match(/bili_jct=([^;]+)/) || [])[1] || "";
        if (!bili_jct) return;

        return fetch("https://api.bilibili.com/x/upowerv2/gw/rights/guide?csrf=" + encodeURIComponent(bili_jct) + "&up_mid=" + window.injectVariable, {
            method: "GET",
            credentials: "include"
        }).then(resp => resp.clone().json())
            .then(data => {
                window.preloadJson = data;
            });
    }

    window.preloadPromise = preloadExtraData();
})();

function buildData(emos, perm) {
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
        e.perm = perm;
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


ah.proxy({
    onResponse: (response, handler) => {
        if (response.config.url.includes("api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons")) {
            let json1 = JSON.parse(response.response);
            if (window.preloadJson.data != null) {
                //遍历所有权利
                let locked = true;
                let emojis = [];
                for (const right of window.preloadJson.data.rights) {
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
                if (emojis) {
                    let upEmo = buildData(emojis, locked ? 0 : 1);
                    json1.data.data.splice(3, 0, upEmo);
                }
            }

            response.response = JSON.stringify(json1);
            handler.next(response)
        } else {
            handler.next(response)
        }
    }
})

