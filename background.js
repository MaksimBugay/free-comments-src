const FcBrowserTabType = Object.freeze({
    NORMAL: "NORMAL",
    MODAL: "MODAL",
    HINT_ONLY: "HINT_ONLY"
});

const SocialNetwork = Object.freeze({
    UNKNOWN: "free-comments-popup.js",
    FREE_COMMENTS: "free-comments-main.js",
    FACEBOOK: "free-comments.js",
    LINKEDIN: "free-comments-linkedin.js",
    VK: "free-comments-vk.js"
});

const WsUrl = 'wss://vasilii.prodpushca.com:30085/';
const DefaultFcPropertiesKey = "DEFAULT";
const FreeCommentsUrl = 'https://free-comments.life';
let FreeCommentsTabAlreadyExists = false;

class SocialNetworkEngine {
    constructor(url) {
        this.socialNetwork = SocialNetwork.UNKNOWN;
        if (url.startsWith(FreeCommentsUrl)) {
            this.socialNetwork = SocialNetwork.FREE_COMMENTS;
        }
        if (url.startsWith('https://www.facebook.com')) {
            this.socialNetwork = SocialNetwork.FACEBOOK;
        }
        if (url.startsWith('https://www.linkedin.com')) {
            this.socialNetwork = SocialNetwork.LINKEDIN;
        }
        if (url.startsWith('https://vk.com')) {
            this.socialNetwork = SocialNetwork.VK;
        }
    }

    getContentScript() {
        return this.socialNetwork;
    }
}

class TabInfo {
    constructor(url, fcProperties) {
        this.url = url;
        this.fcProperties = fcProperties;
    }
}

class FreeCommentsProperties {
    constructor(deviceId, tabId, nickName, signature, signatureHash, avatar,
                blockAds, allowDynamicLinkResolving, wsUrl, webSite) {
        this.deviceId = deviceId;
        this.tabId = tabId;
        this.nickName = nickName;
        this.signature = signature;
        this.signatureHash = signatureHash;
        this.avatar = avatar;
        this.blockAds = blockAds;
        this.allowDynamicLinkResolving = allowDynamicLinkResolving;
        this.wsUrl = wsUrl;
        this.webSite = webSite;
    }

    equals(otherObject) {
        if (!otherObject || !(otherObject instanceof FreeCommentsProperties)) {
            return false;
        }

        // Compare each field
        return this.deviceId === otherObject.deviceId &&
            this.tabId === otherObject.tabId &&
            this.nickName === otherObject.nickName &&
            this.signatureHash === otherObject.signatureHash &&
            this.webSite === otherObject.webSite &&
            this.avatar === otherObject.avatar &&
            this.blockAds === otherObject.blockAds &&
            this.allowDynamicLinkResolving === otherObject.allowDynamicLinkResolving;
    }
}

//================browser context menu extension =====================================
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "addToFreeCommentsFeedContextMenuItem",  // An identifier for this item
        title: "add to Free Comments feed",       // Text to be displayed
        contexts: ["all"],        // Show in all contexts (page, selection, link, etc.)
        documentUrlPatterns: ["http://*/*", "https://*/*"]  // Optional: Pattern to restrict where the menu appears
    });
    chrome.contextMenus.create({
        id: "cleanFreeCommentsFeedAndDataContextMenuItem",
        title: "clean Free Comments feed and data",
        contexts: ["all"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
    });
    chrome.contextMenus.create({
        id: "cleanFreeCommentsUserBlackListContextMenuItem",
        title: "clean Free comments user black list",
        contexts: ["all"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
    });

    chrome.contextMenus.create({
        id: "removeFreeCommentsFromActiveTabContextMenuItem",
        title: "remove Free comments integration",
        contexts: ["all"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
    });

    chrome.contextMenus.create({
        id: "freeCommentsDocumentationContextMenuItem",
        title: "open documentation",
        contexts: ["all"],
        documentUrlPatterns: ["http://*/*", "https://*/*"]
    });
});

function runAddActivePostToFcFeedScript(tab) {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: () => {
            addActivePostToFcFeed();
        }
    });
}

chrome.windows.onCreated.addListener((window) => {
    console.log('New window created:', window);
    if (FreeCommentsTabAlreadyExists) {
        return;
    }
    FreeCommentsTabAlreadyExists = true;
    if (window.type !== 'popup') {
        findFreeCommentsTabId(null, window.id);
    }
    delay(10000).then(() => FreeCommentsTabAlreadyExists = false);
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addToFreeCommentsFeedContextMenuItem") {
        const engine = new SocialNetworkEngine(tab.url);
        if (SocialNetwork.UNKNOWN === engine.socialNetwork) {
            findFreeCommentsTabId(
                function () {
                    runAddActivePostToFcFeedScript(tab);
                }
            )
        } else {
            runAddActivePostToFcFeedScript(tab);
        }
    }
    if (info.menuItemId === "cleanFreeCommentsFeedAndDataContextMenuItem") {
        chrome.tabs.sendMessage(tab.id, {
            message: 'clean-free-comments-feed-and-data'
        });
    }
    if (info.menuItemId === "cleanFreeCommentsUserBlackListContextMenuItem") {
        removeFromLocalStorage("userBlackList");
    }
    if (info.menuItemId === "removeFreeCommentsFromActiveTabContextMenuItem") {
        try {
            removeFromLocalStorage(String(tab.id));
            removeFromLocalStorage(DefaultFcPropertiesKey);
        } catch (error) {
            console.error(`Unexpected error during remove Free comments integration attempt: ${error}`);
        }
        //removeFromLocalStorage('fcProperties');
        //removeFromLocalStorage('userBlackList');
        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: () => {
                delay(100).then(() => {
                    location.replace(location.href);
                });
            }
        });
    }
    if (info.menuItemId === "freeCommentsDocumentationContextMenuItem") {
        chrome.windows.create({
            url: 'documentation/Freecommentsdocumentation.html',
            type: "popup"
        }, function (newWindow) {
            // Update the window to the calculated size and position
            chrome.windows.update(newWindow.id, {
                width: 800,
                height: 600,
                left: 50,
                top: 50,
            });
        });
    }
});

//===================================================================================
function saveToLocalStorage(storageKey, data) {
    let storageObject = {};
    storageObject[storageKey] = data;
    chrome.storage.local.set(storageObject, function () {
        if (chrome.runtime.lastError) {
            console.error(`Cannot save data into local storage under id ${storageKey}: ${chrome.runtime.lastError.message}`);
        } else {
            //console.log(`Data stored successfully into local storage under id ${storageKey}`);
        }
    });
}

function getFromLocalStorage(storageKey, dataConsumer, emptyResultHandler) {
    if (typeof dataConsumer !== 'function') {
        console.error('dataConsumer must be a function');
        return;
    }
    chrome.storage.local.get([storageKey], function (result) {
        if (result.hasOwnProperty(storageKey)) {
            dataConsumer(result[storageKey]);
        } else {
            if (typeof emptyResultHandler === 'function') {
                emptyResultHandler();
            }
        }
    });
}

function removeFromLocalStorage(storageKey) {
    chrome.storage.local.remove(storageKey, function () {
        if (chrome.runtime.lastError) {
            console.error(`Failed to remove data from local storage under id ${storageKey}:`, chrome.runtime.lastError);
        } else {
            //console.log(`Data under id ${storageKey} was successfully removed from local storage`);
        }
    });
}

//====================================================================================
chrome.tabs.onRemoved.addListener(tabId => {
    removeFromLocalStorage(String(tabId));
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete') {
        if ((!tab.url) || (tab.url === 'chrome://newtab/')) {
            return;
        }
        //console.log(`new tab was open: id = ${tab.id}, url = ${tab.url}`);
    }
});

chrome.webNavigation.onDOMContentLoaded.addListener(function (details) {
    if (details.frameId !== 0) {
        return;
    }
    const tabId = details.tabId;
    chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
        }
        chrome.windows.get(tab.windowId, function (window) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }
            if (window.type === 'popup') {
                //console.log("this is popup window");
                return;
            }
            getFromLocalStorage(String(tabId),
                function (tabInfo) {
                    storeFcPropertiesAndInjectFreeCommentsScripts(tabInfo.fcProperties, FcBrowserTabType.NORMAL);
                },
                function () {
                    getFromLocalStorage(
                        DefaultFcPropertiesKey,
                        function (tabInfo) {
                            //console.log(tabInfo.fcProperties);
                            chrome.tabs.get(tabId, (tab) => {
                                if (chrome.runtime.lastError) {
                                    console.error(chrome.runtime.lastError);
                                } else {
                                    const engine = new SocialNetworkEngine(tab.url);
                                    tabInfo.fcProperties.tabId = tabId;
                                    if (SocialNetwork.FREE_COMMENTS === engine.socialNetwork) {
                                        storeFcPropertiesAndInjectFreeCommentsScripts(
                                            tabInfo.fcProperties,
                                            FcBrowserTabType.NORMAL
                                        );
                                    }
                                    if (SocialNetwork.UNKNOWN === engine.socialNetwork) {
                                        findFreeCommentsTabId(
                                            function () {
                                                storeFcPropertiesAndInjectFreeCommentsScripts(
                                                    tabInfo.fcProperties,
                                                    FcBrowserTabType.HINT_ONLY
                                                );
                                            }
                                        )
                                    }
                                }
                            });
                        }
                    );
                }
            );
        });
    });
}, {
    url: [{urlMatches: 'https://*/*'}] // Adjust the pattern to match URLs you're interested in
});

function storeFcPropertiesAndInjectFreeCommentsScripts(fcProperties, browserTabType) {
    chrome.storage.local.set({fcProperties: fcProperties}, function () {
        checkAndInjectFreeCommentsIntoTab(fcProperties.tabId, fcProperties, browserTabType);
    });
}

function checkAndInjectFreeCommentsIntoTab(tabId, fcProperties, browserTabType) {
    chrome.tabs.sendMessage(fcProperties.tabId, {message: "is-content-script-loaded"}, response => {
        if (chrome.runtime.lastError) {
            //console.log('Inject Free comments into active tab');
            injectFreeCommentsIntoTab(fcProperties.tabId, fcProperties, browserTabType);
        } else if (response && response.loaded) {
            //console.log('Free comments already injected');
            getTab(fcProperties.tabId, function (tab) {
                if (FcBrowserTabType.HINT_ONLY !== browserTabType) {
                    saveToLocalStorage(fcProperties.tabId, new TabInfo(tab.url, fcProperties));
                }
                const engine = new SocialNetworkEngine(tab.url);
                chrome.scripting.executeScript({
                    target: {tabId: fcProperties.tabId},
                    files: [engine.getContentScript()]
                });
            });
        }
    });
}

function captureVisibleTabAndShareScreenshot(tabId, postId, postUrl, socialNetwork, followActivePost) {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, function (dataUrl) {
        // Send the dataUrl back to the content script
        chrome.tabs.sendMessage(tabId, {
            message: "processImage",
            dataUrl: dataUrl,
            postId: postId,
            postUrl: postUrl,
            socialNetwork: socialNetwork,
            followActivePost: followActivePost
        });
        //show all fc hints back
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            function: () => {
                showAllFcHints();
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'fetch-channel-counter') {
        findFreeCommentsTabId(function (fcTabId) {
            chrome.tabs.sendMessage(fcTabId, {
                message: "get-channel-counter",
                postId: message.postId
            }, response => {
                if (chrome.runtime.lastError) {
                    //console.error(`Free comments tab is not activated: ${chrome.runtime.lastError}`);
                } else if (response && response.counter) {
                    sendResponse({counter: response.counter});
                }
            });
        });
        return true;
    }
    if (message.action === "closeTab") {
        const tabId = sender.tab.id;
        chrome.tabs.get(tabId, (tab) => {
            chrome.windows.get(tab.windowId, (window) => {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    return;
                }

                // Check if the window type is 'popup'
                if (window.type === 'popup') {
                    chrome.windows.remove(window.id, () => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                        } else {
                            //console.log(`Window ${window.id} closed.`);
                        }
                    });
                } else {
                    chrome.tabs.remove(tabId, function () {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                        } else {
                            //console.log(`Tab ${tabId} closed.`);
                        }
                    });
                }
            });
        });
    }
    if (message.action === "capture") {
        if (SocialNetwork.UNKNOWN === message.socialNetwork) {
            findFreeCommentsTabId(function (fcTabId) {
                captureVisibleTabAndShareScreenshot(
                    fcTabId,
                    message.postId,
                    message.postUrl,
                    message.socialNetwork,
                    message.followActivePost
                );
            });
            return;
        }
        captureVisibleTabAndShareScreenshot(
            sender.tab.id,
            message.postId,
            message.postUrl,
            message.socialNetwork,
            false
        );
    }
    if (message.action === 'injectFreeCommentsIntoActiveTab') {
        const fcProperties = new FreeCommentsProperties(
            message.deviceId,
            message.tabId,
            message.nickName,
            message.signature,
            message.signatureHash,
            message.avatar,
            message.blockAds,
            message.allowDynamicLinkResolving,
            WsUrl,
            message.webSite
        );
        //console.log(fcProperties);
        saveToLocalStorage(DefaultFcPropertiesKey, new TabInfo("ANY", fcProperties));
        storeFcPropertiesAndInjectFreeCommentsScripts(fcProperties, FcBrowserTabType.NORMAL);
    }
    if (message.action === 'freeCommentsPreview') {
        const link = message.link;
        const channelId = message.channelId;
        const screenWidth = message.screenWidth;
        const screenHeight = message.screenHeight;
        const fcProperties = new FreeCommentsProperties(
            message.deviceId,
            sender.tab.id,
            message.nickName,
            message.signature,
            message.signatureHash,
            message.avatar,
            message.blockAds,
            message.allowDynamicLinkResolving,
            WsUrl,
            message.webSite
        );
        if (!fcProperties) {
            return;
        }
        chrome.windows.create({
            url: link,
            type: "popup"
        }, function (newWindow) {
            // Calculate the dimensions and position for 80% size and centered
            const width = Math.floor(screenWidth * 0.8);
            const height = Math.floor(screenHeight * 0.8);
            const left = Math.floor((screenWidth - width) / 2);
            const top = Math.floor((screenHeight - height) / 2);
            // Update the window to the calculated size and position
            chrome.windows.update(newWindow.id, {
                width: width,
                height: height,
                left: left,
                top: top,
            });

            if (newWindow.tabs && newWindow.tabs.length > 0) {
                const tabId = newWindow.tabs[0].id;

                function onPageLoadedHandler(details) {
                    if (details.tabId === tabId && details.frameId === 0) {  // frameId 0 is for the main frame
                        // Remove the listener to avoid injecting the script multiple times
                        chrome.webNavigation.onDOMContentLoaded.removeListener(onPageLoadedHandler);

                        // Your function to inject scripts
                        injectFreeCommentsPreviewScripts(details.tabId, link, channelId, fcProperties, FcBrowserTabType.MODAL);
                    }
                }

                chrome.webNavigation.onDOMContentLoaded.addListener(onPageLoadedHandler, {
                    url: [{urlMatches: 'https://*/*'}] // Adjust the pattern to match URLs you're interested in
                });
            }
        });
    }
    if (message.action === "resolveDynamicLinkSilently") {
        const linkUrl = message.link;
        const sessionId = message.sessionId;
        const actorTabId = sender.tab.id;
        chrome.windows.create({
            url: linkUrl,
            type: "popup",
            width: 5,
            height: 5,
            top: 80,
            left: 1024
        }, function (newWindow) {
            // Assuming there is at least one tab in the new window
            if (newWindow.tabs && newWindow.tabs.length > 0) {
                const tabId = newWindow.tabs[0].id;
                //console.log(`Resolve dynamic link: session id = ${sessionId}, url = ${linkUrl}`);
                resolveUrlAfterLoad(actorTabId, tabId, sessionId);
            }
        });
    }
});

function getTab(tabId, callback) {
    chrome.tabs.get(tabId, function (tab) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            chrome.tabs.remove(tabId);
            return;
        }
        callback(tab);
    });
}

function findFreeCommentsTabId(freeCommentsTabIdConsumer, windowId) {
    chrome.tabs.query({}, function (tabs) {
        for (let tab of tabs) {
            if (tab.url && tab.url.includes(FreeCommentsUrl)) {
                if (typeof freeCommentsTabIdConsumer === 'function') {
                    freeCommentsTabIdConsumer(tab.id);
                }
                return;
            }
        }
        //create if was not found
        const fcDocumentationUrl = 'https://free-comments.life/docs.html';
        let openTabRequest = {url: fcDocumentationUrl, active: false, index: 0};
        if (windowId) {
            openTabRequest = {windowId: windowId, url: fcDocumentationUrl, active: true, index: 0};
        }
        chrome.tabs.create(openTabRequest, (tab) => {
            console.log('Free comments tab was open:', tab);
            delay(3000).then(() => {
                if (typeof freeCommentsTabIdConsumer === 'function') {
                    freeCommentsTabIdConsumer(tab.id);
                }
            });
        });
    });
}

function resolveUrlAfterLoad(actorTabId, tabId, sessionId) {
    const onPageLoadHandler1 = function (details) {
        if (details.tabId === tabId && details.frameId === 0) {
            chrome.webNavigation.onDOMContentLoaded.removeListener(onPageLoadHandler1);
            if (sessionId) {
                getTab(tabId, function (tab) {
                    //console.log(`Dynamic link was resolved: session id = ${sessionId}, url = ${tab.url}`);
                    if (actorTabId) {
                        chrome.tabs.sendMessage(actorTabId, {
                            message: 'dynamic-link-was-resolved',
                            sessionId: sessionId,
                            url: tab.url
                        });
                    }
                    chrome.tabs.remove(tab.id);
                });
            }
        }
    }
    chrome.webNavigation.onDOMContentLoaded.addListener(onPageLoadHandler1, {
        url: [{urlMatches: 'https://*/*'}] // Adjust the pattern to match URLs you're interested in
    });
}

function injectFreeCommentsPreviewScripts(tabId, link, channelId, fcProperties, browserTabType) {
    getTab(tabId, function (tab) {
        //console.log(`Inject into free comments preview tab: url = ${tab.url}`);
        chrome.scripting.insertCSS({
            target: {tabId: tab.id},
            files: ["css/free-comments-hint.css", "css/fc-main-hint-button.css", "css/free-comments-popup.css", "css/free-comments-widget.css"]
        }).then(() => {
            chrome.scripting.executeScript({
                target: {tabId: tabId},
                files: ['js/uuid.min.js', 'common-utils.js', 'free-comments-setup.js', 'pnotifications.js', "js/free-comments-signature.js"]
            }).then(() => {
                chrome.scripting.executeScript({
                    target: {tabId: tabId},
                    files: ['dom-search-queries.js', 'free-comments-hint.js', 'free-comments-widget.js',
                        'free-comments-toolbar.js', 'free-comments-popup.js']
                }).then(() => {
                    chrome.tabs.sendMessage(tabId, {
                        message: 'set-resource-parameters',
                        link: link,
                        channelId: channelId,
                        nickName: fcProperties.nickName,
                        signature: fcProperties.signature,
                        signatureHash: fcProperties.signatureHash,
                        deviceId: fcProperties.deviceId,
                        avatar: fcProperties.avatar,
                        webSite: fcProperties.webSite,
                        wsUrl: fcProperties.wsUrl,
                        browserTabType: browserTabType
                    });
                });
            })
        }).catch(error => console.error(error));
    });
}

function injectFreeCommentsIntoTab(tabId, fcProperties, browserTabType) {
    getTab(tabId, function (tab) {
            if (FcBrowserTabType.HINT_ONLY !== browserTabType) {
                saveToLocalStorage(fcProperties.tabId, new TabInfo(tab.url, fcProperties));
            }
            const engine = new SocialNetworkEngine(tab.url);
            if (SocialNetwork.UNKNOWN === engine.socialNetwork) {
                const url = tab.url;
                injectFreeCommentsPreviewScripts(tab.id, url, null, fcProperties, browserTabType);
                return;
            }

            chrome.scripting.insertCSS({
                target: {tabId: tab.id},
                files: [
                    "css/free-comments-toolbar.css",
                    "css/free-comments.css",
                    "css/free-comments-hint.css",
                    "css/free-comments-widget.css",
                    "css/neon10.css",
                    "css/fc-main-hint-button.css",
                    "css/modal-view.css"
                ]
            });
            chrome.scripting.executeScript({
                target: {tabId: tab.id},
                files: [
                    'js/html2canvas.min.js',
                    'js/uuid.min.js',
                    'common-utils.js',
                    'free-comments-setup.js',
                    'pnotifications.js',
                    'js/free-comments-signature.js'
                ]
            }).then(() => {
                chrome.scripting.executeScript({
                    target: {tabId: tab.id},
                    files: [
                        'dom-search-queries.js',
                        'free-comments-hint.js',
                        'free-comments-widget.js',
                        'callable-future.js',
                        'facebook-url-parser.js',
                        'free-comments-toolbar.js',
                        'modal-view.js',
                        engine.getContentScript()
                    ]
                });
            });
        }
    );
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
