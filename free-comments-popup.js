if (!(document.getElementById('freeCommentsPopupScript'))) {
    const loaded = document.createElement('div');
    loaded.id = 'freeCommentsPopupScript';
    loaded.style.display = 'none';
    document.body.appendChild(loaded);
    console.log('free-comments-popup.js running on', window.location.href);

    const FcBrowserTabType = Object.freeze({
        NORMAL: "NORMAL",
        MODAL: "MODAL",
        HINT_ONLY: "HINT_ONLY"
    });

    let FcResourceParameters = {};

    FcResourceParameters.lastTime = 0;
    FcResourceParameters.delay = 100;
    FcResourceParameters.readyToShowCommentsDelay = 300;

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === 'set-resource-parameters') {
            FcResourceParameters.channelId = request.channelId;
            FcResourceParameters.browserTabType = request.browserTabType;
            FcResourceParameters.wsUrl = request.wsUrl;
            buildPostIdForArbitraryPage(request.link).then(channel => {
                FcResourceParameters.link = channel.name;
                if (!FcResourceParameters.channelId) {
                    FcResourceParameters.channelId = channel.id;
                }
                FcResourceParameters.clientObj = new ClientFilter(
                    "workSpaceMain",
                    request.nickName,
                    request.deviceId,
                    "FREE_COMMENTS",
                    request.avatar,
                    true,
                    request.signatureHash,
                    request.webSite
                );
                //console.log(`Resource parameters were set: url = ${FcResourceParameters.link}, id = ${FcResourceParameters.channelId}`);
                console.log(`Browser tab type = ${FcResourceParameters.browserTabType}`);
                if (FcBrowserTabType.HINT_ONLY !== FcResourceParameters.browserTabType) {
                    buildFreeCommentsViewer(FcResourceParameters.wsUrl, FcResourceParameters.channelId,
                        FcResourceParameters.link, FcResourceParameters.clientObj);
                }
                if (FcBrowserTabType.MODAL !== FcResourceParameters.browserTabType) {
                    const hintElement = createFreeCommentsHint(FcResourceParameters.channelId, FcResourceParameters.link);
                    if (FcBrowserTabType.HINT_ONLY === FcResourceParameters.browserTabType) {
                        getFreeCommentsChannelCounter(FcResourceParameters.channelId, hintElement);
                    } else {
                        hintElement.style.visibility = 'hidden';
                    }
                }
            });
        }
    });

    function buildFreeCommentsViewer(wsUrl, channelId, url, clientObj) {
        if (!PushcaClient.isOpen()) {
            PushcaClient.openWsConnection(
                wsUrl,
                clientObj, function () {
                    openDataBase(PushcaClient.ClientObj.accountId);
                    updateAccountIsActiveStateAndRefreshIndicators(PushcaClient.ClientObj.accountId, 'active');
                    delay(3000).then(() => {
                        if (document.getElementById("freeCommentsWidgetContainer")) {
                            reloadAllComments(channelId);
                        } else {
                            addFreeCommentsWidget(channelId, url);
                        }
                        changeFcWidgetBackgroundColor('honeydew');
                    });
                    FcResourceParameters.pingIntervalId = window.setInterval(function () {
                        PushcaClient.sendPing();
                    }, 30000);
                },
                function (ws, event) {
                    closeDataBase(PushcaClient.ClientObj.accountId);
                    changeFcWidgetBackgroundColor('#f2f2f2');
                    window.clearInterval(FcResourceParameters.pingIntervalId);
                    if (!event.wasClean) {
                        console.error("Your connection died, refresh the page please");
                    }
                },
                function (ws, messageText) {
                    if (messageText !== "PONG") {
                        //console.log(messageText);
                    }
                },
                function (channelEvent) {
                    //console.log(channelEvent);
                    const vAccountId = channelEvent.actor.accountId;
                    if (channelEvent.type === 'MEMBER_ACTIVE') {
                        updateAccountIsActiveStateAndRefreshIndicators(vAccountId, 'active');
                    }
                    if (channelEvent.type === 'MEMBER_NOT_ACTIVE') {
                        updateAccountIsActiveStateAndRefreshIndicators(vAccountId, 'not active');
                    }
                },
                function (channelMessage) {
                    //console.log(channelMessage);
                    if (FcResourceParameters.channelId !== channelMessage.channelId) {
                        return;
                    }
                    updateAccountIsActiveStateAndRefreshIndicators(channelMessage.sender.accountId, 'active');
                    addFreeCommentIntoWidgetWithBlockedCheck(channelMessage.channelId, null, channelMessage);
                }
            );
        }
    }

    function createFreeCommentsHint(postId, postUrl) {
        const postType = PostType.EXTERNAL_RESOURCE;
        const hintElement = document.createElement('div');
        hintElement.className = 'free-comments-hint free-comments-link free-comments-post-hint';
        hintElement.style.position = "absolute";
        hintElement.style.marginTop = '10px';
        hintElement.style.marginBottom = '5px';
        hintElement.style.marginLeft = '5px';
        hintElement.style.marginRight = '5px';
        hintElement.style.top = '10px';
        hintElement.style.left = '40%';
        hintElement.role = "button"
        hintElement.title = `[${postId}-${postType}]${postUrl}`;
        hintElement.dataset.postId = postId;
        hintElement.dataset.postUrl = postUrl;
        hintElement.dataset.postType = postType;
        document.body.appendChild(hintElement);

        updateFcMainHintCounter(hintElement, 0);
        hintElement.addEventListener("click", function () {
            hintElement.style.visibility = 'hidden';
            buildFreeCommentsViewer(FcResourceParameters.wsUrl, FcResourceParameters.channelId,
                FcResourceParameters.link, FcResourceParameters.clientObj);
        });

        return hintElement;
    }

    function getFreeCommentsChannelCounter(postId, hintElement) {
        if (!PushcaClient.isOpen()) {
            chrome.runtime.sendMessage({
                action: "fetch-channel-counter",
                postId: postId
            }, function (response) {
                if (response && response.counter) {
                    updateFcMainHintCounter(hintElement, response.counter);
                }
            });
        } else {
            fetchFreeCommentsSingleChannelCounter(postId).then(fcCounter => {
                if (fcCounter) {
                    updateFcMainHintCounter(hintElement, fcCounter);
                }
            });
        }
    }

    function changeFcWidgetBackgroundColor(color) {
        const fcWidget = document.getElementById("freeCommentsWidgetContainer");
        if (fcWidget) {
            fcWidget.style.backgroundColor = color;
        }
    }

    function addFreeCommentsWidget(channelId, url) {
        const fcWidgetContainer = document.createElement('div');
        fcWidgetContainer.id = "freeCommentsWidgetContainer";
        fcWidgetContainer.className = "vertical-panel";
        fcWidgetContainer.style.overflowY = 'hidden';
        document.body.insertBefore(fcWidgetContainer, document.body.firstChild);

        const anchorEl = document.createElement('div');
        fcWidgetContainer.appendChild(anchorEl);

        document.body.style.paddingLeft = '30vw';

        const editableDiv = getEditableDiv(document);
        const fcWidget = createFreeCommentsWidget(
            anchorEl,
            channelId,
            url,
            editableDiv ? window.getComputedStyle(editableDiv) : null,
            false,
            null
        );
        delay(500).then(() => {
            if (fcWidget) {
                showAsPanel(fcWidget);
                focusToWidget(fcWidget);
                FreeCommentsWidget.afterRemoveListener = function () {
                    delay(500).then(() => {
                        const hintElement = document.querySelector('div.free-comments-post-hint');
                        if (hintElement) {
                            getFreeCommentsChannelCounter(FcResourceParameters.channelId, hintElement);
                            hintElement.style.visibility = 'visible';
                        }
                        const fcWidget = document.getElementById("freeCommentsWidgetContainer");
                        if (fcWidget) {
                            fcWidget.remove();
                            document.body.style.paddingLeft = '0vw';
                            if (isNotEmpty(PushcaClient.ws)) {
                                delay(1000).then(() => {
                                    PushcaClient.ws.close(1000, "leave");
                                });
                            }
                            cleanRefreshBrokenConnectionInterval();
                        }
                        if (FcBrowserTabType.MODAL === FcResourceParameters.browserTabType) {
                            chrome.runtime.sendMessage({
                                action: "closeTab"
                            });
                        }
                    });
                }
            }
        });
    }

    document.addEventListener('click', function () {
        //printAllParents(event.target, 30);
        const fcContextMenu = document.getElementById("freeCommentsContextMenu");
        if (fcContextMenu && (fcContextMenu.style.display === 'block')) {
            return;
        }
        reloadAllComments(FcResourceParameters.channelId);
    });

    document.addEventListener('mousemove', function () {
        const now = new Date().getTime();
        let delta = now - FcResourceParameters.lastTime;
        if (delta < FcResourceParameters.delay) {
            return;
        }
        FcResourceParameters.lastTime = now;
        if (delta > FcResourceParameters.readyToShowCommentsDelay) {
            if (FcBrowserTabType.MODAL === FcResourceParameters.browserTabType) {
                if (!document.getElementById("freeCommentsWidgetContainer")) {
                    addFreeCommentsWidget(FcResourceParameters.channelId, FcResourceParameters.link);
                }
            }
        }
    });
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === "is-content-script-loaded") {
            sendResponse({loaded: true});
            return true;
        }
    });

    function setClientObject(clientObj) {
        FcResourceParameters.clientObj = clientObj;
    }
} else {
    reloadFreeCommentsProperties(null, setClientObject);
}
