// ==UserScript==
// @name         embyLaunchPotplayer
// @name:en      embyLaunchPotplayer
// @name:zh      embyLaunchPotplayer
// @name:zh-CN   embyLaunchPotplayer
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  try to take over the world!
// @description:zh-cn emby调用外部播放器
// @author       @bpking
// @include       *emby*
// @include       *:8*
// ==/UserScript==
 
//修改此处api_key为你自己的
const api_key = "fcd7485a81a24aee95460d69e8bc451c";
 
//以下两项不使用不需要修改
//改为你的emby服务器视频挂载目录前缀
const embyVideoPathPrefix = "/mnt/movie";
//改为你的直链网盘地址前缀
const cloudUrl = "https://pan.baidu.com/movie";
 
const reg = /\/[a-z]{2,}\/\S*?id=/;
 
let timer = setInterval(function() {
    let potplayer = document.querySelectorAll("div[is='emby-scroller']:not(.hide) .potplayer")[0];
    if(!potplayer){
        let mainDetailButtons = document.querySelectorAll("div[is='emby-scroller']:not(.hide) .mainDetailButtons")[0];
        if(mainDetailButtons){
            let buttonhtml = `<div class ="flex">
                  <button id="embyPot" type="button" class="detailButton  emby-button potplayer" title="Potplayer"> <div class="detailButton-content"> <i class="md-icon detailButton-icon"></i>  <div class="detailButton-text">PotPlayer</div> </div> </button>
                  <button id="embyPotAdd" type="button" class="detailButton  emby-button playNext" title="稍后播放"> <div class="detailButton-content"> <i class="md-icon detailButton-icon"></i>  <div class="detailButton-text">稍后播放</div> </div> </button>
                  <button id="cloudPot" type="button" class="detailButton  emby-button iina" title="Cloud"> <div class="detailButton-content"> <i class="md-icon detailButton-icon"></i>  <div class="detailButton-text">Cloud</div> </div> </button>
                  <button id="cloudPotAdd" type="button" class="detailButton  emby-button iina" title="CloudAdd"> <div class="detailButton-content"> <i class="md-icon detailButton-icon"></i>  <div class="detailButton-text">CloudAdd</div> </div> </button>
                  <button id="embyIINA" type="button" class="detailButton  emby-button iina" title="IINA"> <div class="detailButton-content"> <i class="md-icon detailButton-icon"></i>  <div class="detailButton-text">IINA</div> </div> </button>
 
                 </div>`
            mainDetailButtons.insertAdjacentHTML('afterend', buttonhtml)
            document.querySelector("div[is='emby-scroller']:not(.hide) #embyPot").onclick = embyPot;
            document.querySelector("div[is='emby-scroller']:not(.hide) #embyPotAdd").onclick = embyPotAdd;
            document.querySelector("div[is='emby-scroller']:not(.hide) #cloudPot").onclick = cloudPot;
            document.querySelector("div[is='emby-scroller']:not(.hide) #cloudPotAdd").onclick = cloudPotAdd;
            document.querySelector("div[is='emby-scroller']:not(.hide) #embyIINA").onclick = embyIINA;
        }
    }
}, 1000)
 
async function getItemInfo(){
    let itemInfoUrl = window.location.href.replace(reg, "/emby/Items/").split('&')[0] + "/PlaybackInfo?api_key=" + api_key;
    console.log("itemInfo：" + itemInfoUrl);
    let response = await fetch(itemInfoUrl);
    if(response.ok)
    {
        return await response.json();
    }else{
        alert("获取视频信息失败,检查api_key是否设置正确  "+response.status+" "+response.statusText);
        throw new Error(response.statusText);
    }
}
 
function getSeek(){
    let resumeButton = document.querySelector("div[is='emby-scroller']:not(.hide) div.resumeButtonText");
    let seek = '';
    if (resumeButton) {
        if (resumeButton.innerText.includes('恢复播放')) {
            seek = resumeButton.innerText.replace('从 ', '').replace(' 恢复播放', '');
        }
    }
    return seek;
}
 
function getSubUrl(itemInfo, MediaSourceIndex){
    let selectSubtitles = document.querySelector("div[is='emby-scroller']:not(.hide) select.selectSubtitles");
    let subTitleUrl = '';
    if (selectSubtitles) {
        if (selectSubtitles.value > 0) {
            if (itemInfo.MediaSources[MediaSourceIndex].MediaStreams[selectSubtitles.value].IsExternal) {
                let subtitleCodec = itemInfo.MediaSources[MediaSourceIndex].MediaStreams[selectSubtitles.value].Codec;
                let MediaSourceId = itemInfo.MediaSources[MediaSourceIndex].Id;
                let domain = window.location.href.replace(reg, "/emby/videos/").split('&')[0];
                subTitleUrl = `${domain}/${MediaSourceId}/Subtitles/${selectSubtitles.value}/${MediaSourceIndex}/Stream.${subtitleCodec}?api_key=${api_key}`;
                console.log(subTitleUrl);
            }
        }
    }
    return subTitleUrl;
}
 
 
async function getEmbyMediaUrl() {
    let selectSource = document.querySelector("div[is='emby-scroller']:not(.hide) select.selectSource");
    //let selectAudio = document.querySelector("div[is='emby-scroller']:not(.hide) select.selectAudio");
    let itemInfo = await getItemInfo();
    let MediaSourceIndex = 0;
    for(let i = 0; i< itemInfo.MediaSources.length; i++){
        if(itemInfo.MediaSources[i].Id == selectSource.value){
            MediaSourceIndex = i;
        };
    }
    let container = itemInfo.MediaSources[MediaSourceIndex].Container;
    let MediaSourceId = selectSource.value;
    let PlaySessionId = itemInfo.PlaySessionId;
    let subUrl = await getSubUrl(itemInfo, MediaSourceIndex);
    let domain = window.location.href.replace(reg, "/emby/videos/").split('&')[0];
    let streamUrl = `${domain}/stream.${container}?api_key=${api_key}&Static=true&MediaSourceId=${MediaSourceId}&PlaySessionId=${PlaySessionId}`;
    console.log(streamUrl,subUrl)
    return Array(streamUrl, subUrl);
}
 
async function getCloudMediaUrl(){
    let selectSource = document.querySelector("div[is='emby-scroller']:not(.hide) select.selectSource");
    //let selectAudio = document.querySelector("div[is='emby-scroller']:not(.hide) select.selectAudio");
    let itemInfo = await getItemInfo();
    let MediaSourceIndex = 0;
    for(let i = 0; i< itemInfo.MediaSources.length; i++){
        if(itemInfo.MediaSources[i].Id == selectSource.value){
            MediaSourceIndex = i;
        };
    }
    let cloudVideoUrl = itemInfo.MediaSources[MediaSourceIndex].Path.replace(embyVideoPathPrefix, cloudUrl);
    let subUrl = await getSubUrl(itemInfo, MediaSourceIndex);
    console.log(cloudVideoUrl, subUrl);
    return Array(cloudVideoUrl,subUrl);
}
async function cloudPot(){
    let CloudMediaUrl = await getCloudMediaUrl();
    let poturl = `potplayer://${encodeURI(CloudMediaUrl[0])} /sub=${encodeURI(CloudMediaUrl[1])} /current /seek=${getSeek()}`;
    console.log(poturl);
    window.open(poturl, "_blank");
}
async function cloudPotAdd(){
    let CloudMediaUrl = await getCloudMediaUrl();
    let poturl = `potplayer://${encodeURI(CloudMediaUrl[0])} /sub=${encodeURI(CloudMediaUrl[1])} /current /add /seek=${getSeek()}`;
    console.log(poturl);
    window.open(poturl, "_blank");
}
async function embyPot() {
    let mediaUrl = await getEmbyMediaUrl();
    let poturl = `potplayer://${encodeURI(mediaUrl[0])} /sub=${encodeURI(mediaUrl[1])} /current /seek=${getSeek()}`;
    console.log(poturl);
    window.open(poturl, "_blank");
}
//稍后播放，添加至potPlayer播放列表
async function embyPotAdd(){
    let mediaUrl = await getEmbyMediaUrl();
    let poturl = `potplayer://${encodeURI(mediaUrl[0])} /sub=${encodeURI(mediaUrl[1])} /current /add /seek=${getSeek()}`;
    console.log(poturl);
    window.open(poturl, "_blank");
}
async function embyIINA(){
    let mediaUrl = await getEmbyMediaUrl();
    let iinaUrl = `iina://weblink?url=${escape(mediaUrl[0])}&new_window=1`;
    console.log(`iinaUrl= ${iinaUrl}`);
    window.open(iinaUrl, "_blank");
}
