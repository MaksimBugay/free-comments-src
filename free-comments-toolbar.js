console.log('free-comments-toolbar.js running on', window.location.href);

const SocialNetwork = Object.freeze({
    UNKNOWN: "free-comments-popup.js",
    FREE_COMMENTS: "free-comments-main.js",
    FACEBOOK: "free-comments.js",
    LINKEDIN: "free-comments-linkedin.js",
    VK: "free-comments-vk.js"
});

class SocialNetworkEngine {
    constructor(url) {
        this.socialNetwork = SocialNetwork.UNKNOWN;
        if (url.startsWith('https://free-comments.life')) {
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

const VendettaUrl = chrome.runtime.getURL('images/vendetta0.png');

let FreeCommentsToolbar = {};

FreeCommentsToolbar.setActivePostContainer = function (postContainer) {
    FreeCommentsToolbar.activePostContainer = postContainer;
}

document.addEventListener('contextmenu', function (event) {
    let fcUserHint = event.target.closest("div.free-comments-post-content-hint");
    if (!fcUserHint) {
        if (event.target.tagName.toLowerCase() === 'image') {
            const userProfileLink = event.target.closest('a[role="link"][aria-hidden="true"]');
            if (userProfileLink) {
                fcUserHint = userProfileLink.querySelector('div.free-comments-post-content-hint');
            }
        }
    }
    if (fcUserHint && (PostType.USER_PROFILE === fcUserHint.dataset.postType)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        //NOTE: we can handle click on fb user avatar action here
        return false;
    }
    const postContainer = event.target.closest('div.free-comments-post-container');
    if (postContainer) {
        //console.log(`Post container was detected: post id = ${postContainer.dataset.postId}`);
        FreeCommentsToolbar.setActivePostContainer(postContainer);
        return true;
    }
});

function createFreeCommentsToolbar(onClickHandler) {
    const fcToolbar = document.createElement('div');
    fcToolbar.id = 'free-comments-toolbar';
    fcToolbar.className = 'top-left-corner-panel';
    document.body.appendChild(fcToolbar);

    const fcButton = document.createElement('button');
    fcButton.className = 'image-button';
    fcButton.style.backgroundImage = `url(${VendettaUrl})`;
    fcButton.ariaLabel = 'refresh-all-hints';

    if (typeof onClickHandler === 'function') {
        fcToolbar.addEventListener('click', function (event) {
            if (event.ctrlKey) {
                onClickHandler();
            }
        });
    }

    const fireSignal = document.createElement('div');
    fireSignal.className = "fire-div";
    fireSignal.innerHTML = `
            <button class="fire-button">
                <span class="flames">🔥</span>
            </button>
        `;
    fireSignal.style.display = "none";
    const counterDiv = document.createElement('div');
    counterDiv.className = "fire-text";
    counterDiv.style.display = "none";
    fcButton.appendChild(fireSignal);
    fcButton.appendChild(counterDiv);

    fcToolbar.appendChild(fcButton);

    fcToolbar.dataset.isMoving = 'false';
    fcToolbar.addEventListener('mousedown', function (event) {
        if (event.ctrlKey) {
            return;
        }
        if (!event.shiftKey) {
            hideFireSignal();
            showModal(event.pageX);
            return;
        }
        fcToolbar.dataset.isMoving = 'true';
        // Get computed styles to read margins
        let computedStyle = window.getComputedStyle(fcToolbar);
        let marginLeft = parseInt(computedStyle.marginLeft, 10);
        let marginTop = parseInt(computedStyle.marginTop, 10);
        fcToolbar.style.left = event.clientX - marginLeft + 'px';
        fcToolbar.style.top = event.clientY - marginTop + 'px';

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        function onMouseMove(event) {
            if ('true' !== fcToolbar.dataset.isMoving) {
                return;
            }
            document.body.classList.add('no-select');
            fcToolbar.style.left = event.clientX - marginLeft + 'px';
            fcToolbar.style.top = event.clientY + 'px';
        }

        function onMouseUp() {
            fcToolbar.dataset.isMoving = 'false';
            document.body.classList.remove('no-select');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    });
}

function hideFireSignal() {
    const fireSignal = document.querySelector('div.fire-div');
    if (!fireSignal) {
        return;
    }
    fireSignal.style.display = "none";
    const fireText = document.querySelector('div.fire-text');
    if (!fireText) {
        return;
    }
    fireText.style.display = "none";
}

function showFireSignal(counter) {
    const fireSignal = document.querySelector('div.fire-div');
    if (!fireSignal) {
        return;
    }
    fireSignal.style.display = "flex";
    const fireText = document.querySelector('div.fire-text');
    if (!fireText) {
        return;
    }
    fireText.textContent = `${counter}`;
    fireText.style.display = "block";
}

function setToolbarActiveState(isActive, accountId) {
    const fcToolbar = document.getElementById('free-comments-toolbar');
    if (fcToolbar) {
        const fcButton = fcToolbar.querySelector('button.image-button');
        if (fcButton) {
            fcButton.title = `Refresh all hints for ${accountId}`;
        }
        if (isActive) {
            fcToolbar.style.backgroundColor = 'honeydew';
        } else {
            fcToolbar.style.backgroundColor = '#f2f2f2';
        }
    }
}

function reloadFreeCommentsProperties(externalHandler, newClientObjectConsumer) {
    getFreeCommentsProperties(false, function (fcProperties) {
        const clientObj = new ClientFilter(
            fcProperties.clientObj.workSpaceId,
            fcProperties.clientObj.accountId,
            fcProperties.clientObj.deviceId,
            fcProperties.clientObj.applicationId
        );
        if (typeof newClientObjectConsumer === 'function') {
            newClientObjectConsumer(clientObj);
        }
        if (typeof FreeCommentsHint !== 'undefined') {
            FreeCommentsHint.setFreeCommentsProperties(fcProperties);
        }
        if (typeof PushcaClient !== 'undefined') {
            const oldClientObj = PushcaClient.changeClientObject(clientObj);
            if (oldClientObj) {
                updateAccountIsActiveStateAndRefreshIndicators(oldClientObj.accountId, 'not active');
            }
        }
        if (typeof FreeCommentsWidget !== 'undefined') {
            FreeCommentsWidget.loadPosts();
            FreeCommentsWidget.removeAllOpenWidgets();
        }

        if (typeof externalHandler === 'function') {
            externalHandler(fcProperties);
        }
    });
}

async function followActivePost() {
    let postId;
    let postUrl;
    if (FreeCommentsToolbar.activePostContainer) {
        const postContainer = FreeCommentsToolbar.activePostContainer;
        postId = postContainer.dataset.postId;
        postUrl = postContainer.dataset.postUrl;
    }
    if (typeof isSingleFacebookPostPage === 'function') {
        if (!postId && isSingleFacebookPostPage()) {
            const urlWithData = extractDataFromUrl(window.location.href);
            postId = urlWithData.id;
            postUrl = urlWithData.url;
        }
    }
    if (typeof extractIdFromVkPostUrl === 'function') {
        if (!postId) {
            postId = extractIdFromVkPostUrl(window.location.href);
            postUrl = window.location.href;
        }
    }
    if (!postId) {
        const engine = new SocialNetworkEngine(window.location.href);
        if (SocialNetwork.UNKNOWN === engine.socialNetwork) {
            const channel = await buildPostIdForArbitraryPage(window.location.href);
            postUrl = channel.name;
            postId = channel.id;
        }
    }
    if (!postId) {
        return false;
    }
    return await addMeToChannel(postId, postUrl);
}

function addActivePostToFcFeed(link) {
    if (!PushcaClient.isOpen()) {
        addActivePostToFcFeed0(link, true);
        return;
    }
    followActivePost().then(result => {
        if (result) {
            addActivePostToFcFeed0(link);
        }
    });
}

function addActivePostToFcFeed0(link, followActivePost) {
    hideAllFcHints();
    delay(100).then(() => {
        const engine = new SocialNetworkEngine(window.location.href);
        if (SocialNetwork.UNKNOWN === engine.socialNetwork) {
            buildPostIdForArbitraryPage(window.location.href).then(channel => {
                chrome.runtime.sendMessage({
                    action: "capture",
                    postId: channel.id,
                    postUrl: channel.name,
                    socialNetwork: engine.socialNetwork,
                    followActivePost: followActivePost
                });
                delay(1000).then(() => {
                    showAllFcHints();
                });
            });
        } else {
            chrome.runtime.sendMessage({
                action: "capture",
                postUrl: link,
                socialNetwork: engine.socialNetwork
            });
        }
    });
}

function setupConnectionToPushca(fcPropertiesConsumer) {
    getFreeCommentsProperties(false, function (fcProperties) {
        FreeCommentsHint.setFreeCommentsProperties(fcProperties);
        if (typeof fcPropertiesConsumer === 'function') {
            fcPropertiesConsumer(fcProperties);
        }
        //console.log(fcProperties.clientObj);
        PushcaClient.openWsConnection(
            fcProperties.wsUrl,
            fcProperties.clientObj,
            function () {
                openDataBase(PushcaClient.ClientObj.accountId);
                PushcaClient.PingIntervalId = window.setInterval(function () {
                    PushcaClient.sendPing();
                }, 30000);
                updateAccountIsActiveStateAndRefreshIndicators(PushcaClient.ClientObj.accountId, 'active');
                delay(2000).then(() => {
                    FreeCommentsWidget.reloadAllOpenWidgets();
                    reloadAllFeedHints();
                    setToolbarActiveState(true, PushcaClient.ClientObj.accountId);
                    refreshTotalNumberOfUnreadComments();
                });
            },
            function (ws, event) {
                closeDataBase(PushcaClient.ClientObj.accountId);
                window.clearInterval(PushcaClient.PingIntervalId);
                setToolbarActiveState(false, PushcaClient.ClientObj.accountId);
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
                updateAccountIsActiveStateAndRefreshIndicators(channelMessage.sender.accountId, 'active');
                const actorIsMe = channelMessage.sender.accountId === PushcaClient.ClientObj.accountId;
                refreshAllHints(channelMessage.channelId, actorIsMe);
                refreshTotalNumberOfUnreadComments();
                if (!actorIsMe) {
                    incrementPostPreviewUnreadCounter(channelMessage.channelId);
                }
                addFreeCommentIntoWidgetWithBlockedCheck(channelMessage.channelId, null, channelMessage);
            }
        );
    });
}

function refreshTotalNumberOfUnreadComments() {
    if (modalPanelIsShown()) {
        return;
    }
    getTotalNumberOfUnreadComments().then(counter => {
        if (counter > 0) {
            //console.log(`${counter} new comments`);
            showFireSignal(counter);
        } else {
            //console.log('no new comments');
            hideFireSignal();
        }
    });
}

FreeCommentsToolbar.isDeletePressed = false;
document.addEventListener('keydown', function (event) {
    if (event.key === "Delete") {
        FreeCommentsToolbar.isDeletePressed = true;
    }
});
document.addEventListener('keyup', function (event) {
    if (event.key === "Delete") {
        FreeCommentsToolbar.isDeletePressed = false;
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // listen for messages sent from background.js
    if (request.message === 'clean-free-comments-feed-and-data') {
        cleanFreeCommentsFeed();
    }
    if (request.message === "processImage") {
        let socialNetwork = new SocialNetworkEngine(window.location.href).socialNetwork;
        if (SocialNetwork.FREE_COMMENTS === socialNetwork) {
            socialNetwork = SocialNetwork.UNKNOWN;
        }
        if (socialNetwork !== request.socialNetwork) {
            return;
        }
        showAllFcHints();
        let postId;
        let postUrl;
        let totalCount;
        let postContainerRect;
        if (socialNetwork === SocialNetwork.UNKNOWN) {
            postContainerRect = null;
            postId = request.postId;
            postUrl = request.postUrl;
            totalCount = -1;
        }
        if ((!postId) && FreeCommentsToolbar.activePostContainer) {
            const postContainer = FreeCommentsToolbar.activePostContainer;
            postContainerRect = getElementScreenPositionAndDimensions(
                postContainer
            );
            postId = postContainer.dataset.postId;
            totalCount = parseInt(postContainer.dataset.totalCount, 10);
            postUrl = request.postUrl ? request.postUrl : postContainer.dataset.postUrl;
        }
        if (typeof isSingleFacebookPostPage === 'function') {
            if ((!postId) && isSingleFacebookPostPage()) {
                const urlWithData = extractDataFromUrl(window.location.href);
                postContainerRect = null;
                postId = urlWithData.id;
                postUrl = urlWithData.url;
                totalCount = -1;
            }
        }
        if (typeof extractIdFromVkPostUrl === 'function') {
            if (!postId) {
                postContainerRect = null;
                postId = extractIdFromVkPostUrl(window.location.href);
                postUrl = window.location.href;
                totalCount = -1;
            }
        }
        if (!postId) {
            return;
        }
        if (request.followActivePost) {
            addMeToChannel(postId, postUrl);
        }
        const img = new Image();
        img.onload = function () {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            const width = postContainerRect ? Math.min(img.width, postContainerRect.width) : img.width;
            const height = postContainerRect ? Math.min(img.height, postContainerRect.height) : img.height;

            // Set canvas size
            canvas.width = width;
            canvas.height = height;

            // Draw and crop the image on the canvas
            const left = postContainerRect ? postContainerRect.left : 250;
            const top = postContainerRect ? postContainerRect.top : 0;
            ctx.drawImage(img, left, top, width, height, 0, 0, width, height);

            canvas.toBlob(function (blob) {
                if (totalCount < 0) {
                    fetchFreeCommentsSingleChannelCounter(postId).then(fcCounter => {
                        addPostPreview(postId, postUrl, blob, fcCounter);
                    });
                } else {
                    addPostPreview(postId, postUrl, blob, totalCount);
                }
            }, 'image/png');
        };
        img.src = request.dataUrl;
    }
});