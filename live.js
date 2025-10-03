/*
请求充电表情
https://api.bilibili.com/x/upowerv2/gw/rights/guide?build=0&csrf=你的bilibili_tick&up_mid=目标up_uid
请求表情
https://api.live.bilibili.com/xlive/web-ucenter/v2/emoticon/GetEmoticons?platform=pc&room_id=直播间id
房间数据
window.__NEPTUNE_IS_MY_WAIFU__
*/

//alert(window.__NEPTUNE_IS_MY_WAIFU__.roomInfoRes.data.room_info.uid);


function loadScript(url) {
    return new Promise((resolve, reject) => {
        var s = document.createElement('script');
        s.src = url;
        s.onload = () => { s.remove(); resolve(); };
        s.onerror = reject;
        (document.head || document.documentElement).appendChild(s);
    });
}

(async () => {
    await loadScript(chrome.runtime.getURL('ajaxhook.min.js'));
    await loadScript(chrome.runtime.getURL('live_script.js'));
})();
