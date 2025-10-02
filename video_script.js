const originalFetch = window.fetch;

window.fetch = async function (resource, options) {
    const response = await originalFetch(resource, options);
    let responseText;

    const clonedResponse = response.clone();
    responseText = await clonedResponse.text();
    if (resource.includes("api.bilibili.com/x/emote/user/panel/web")) {
        const active = document.activeElement;
        if (active.tagName === "BILI-COMMENTS") {
            window.injectVariable = document.querySelector("a.up-avatar").href.split('/')[3];
            let mid = window.injectVariable;
            const data = await loadExtraData(mid);
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

                let upEmo = buildData(emojis);
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

function buildData(emos) {
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

async function loadExtraData(mid) {
    let bili_jct = (document.cookie.match(/bili_jct=([^;]+)/) || [])[1] || "";
    if (!bili_jct) return;

    try {
        const resp = await originalFetch(
            "https://api.bilibili.com/x/upowerv2/gw/rights/guide?csrf=" + encodeURIComponent(bili_jct) + "&up_mid=" + mid,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const data = await resp.clone().json();

        return data;
    } catch (err) {
        console.error("加载额外数据失败:", err);
        return null;
    }
}