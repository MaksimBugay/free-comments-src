let FreeCommentsModalView = {}

FreeCommentsModalView.modal = null;
FreeCommentsModalView.span = null;
FreeCommentsModalView.loadSpan = null;


// Function to open the modal
function showModal(leftX) {
    const editableDiv = getEditableDiv(document);
    FreeCommentsModalView.editableDivStyle = editableDiv ? window.getComputedStyle(editableDiv) : null;
    if (!FreeCommentsModalView.modal) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="freeCommentsModalView" class="modal">
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <div class="post-feed"></div>
                </div>
            </div>
        `);
        FreeCommentsModalView.modal = document.getElementById("freeCommentsModalView");
        FreeCommentsModalView.feedContainer = FreeCommentsModalView.modal.querySelector('div.post-feed');
        FreeCommentsModalView.span = document.getElementsByClassName("close")[0];
        FreeCommentsModalView.span.addEventListener('click', function () {
            if (FreeCommentsModalView.feedContainer) {
                removeAllChildren(FreeCommentsModalView.feedContainer);
            }
            FreeCommentsModalView.modal.style.display = "none";
        });
    }
    FreeCommentsModalView.modal.style.marginLeft = `${leftX + 45}px`;
    FreeCommentsModalView.modal.style.display = "flex";
    if (!FreeCommentsModalView.feedContainer) {
        return;
    }
    reloadPosts(FreeCommentsModalView.feedContainer);
}

function modalPanelIsShown() {
    if ((!FreeCommentsModalView) || (!FreeCommentsModalView.modal)) {
        return false;
    }
    return FreeCommentsModalView.modal.style.display !== "none";
}

function updatePostPreviewCounter(postId, className, updateFunction) {
    const postInfoSection = document.getElementById(`fc-post-preview-${postId}`);
    if (!postInfoSection) {
        return;
    }
    const counter = postInfoSection.querySelector('span.' + className);
    if (counter) {
        const oldValue = parseInt(counter.textContent, 10);
        counter.textContent = `${updateFunction(oldValue)}`;
    }
}

function saveTotalCounterToDb(postId) {
    const postInfoSection = document.getElementById(`fc-post-preview-${postId}`);
    if (!postInfoSection) {
        return;
    }
    const counter = postInfoSection.querySelector('span.count');
    if (counter) {
        const newValue = parseInt(counter.textContent, 10);
        updatePostPreviewTotal(postId, newValue);
    }
}

function setPostPreviewTotalCounter(postId, newValue, actorIsMe) {
    updatePostPreviewCounter(
        postId,
        "count",
        function () {
            return newValue;
        }
    );
    //reset unread counter to zero
    if (actorIsMe) {
        updatePostPreviewCounter(
            postId,
            "unread-count",
            function () {
                return 0;
            }
        );
        updatePostPreviewTotal(postId, newValue);
        return;
    }
    //update Db if widget is displayed
    const postInfoSection = document.getElementById(`fc-post-preview-${postId}`);
    if (!postInfoSection) {
        return;
    }
    if (getFreeCommentsWidget(postInfoSection.parent, postId)) {
        updatePostPreviewTotal(postId, newValue);
    }
}

function incrementPostPreviewUnreadCounter(postId) {
    const postInfoSection = document.getElementById(`fc-post-preview-${postId}`);
    if (!postInfoSection) {
        return;
    }
    if (getFreeCommentsWidget(postInfoSection.parent, postId)) {
        updatePostPreviewCounter(
            postId,
            "unread-count",
            function () {
                return 0;
            }
        );
        return;
    }
    updatePostPreviewCounter(
        postId,
        "unread-count",
        function (oldValue) {
            return oldValue + 1;
        }
    );
}

function createPostPreview(channel, feedContainer, objectUrl, totalOld, totalNew, postUrl) {
    const postContainer = document.createElement('div');
    const postInfoSectionId = `fc-post-preview-${channel.id}`;
    let unreadCounter = totalNew - totalOld;
    if (unreadCounter < 0) {
        unreadCounter = 0;
    }
    postContainer.className = 'post';
    postContainer.innerHTML = `
            <img alt="Post Image" class="post-image">
            <div id="${postInfoSectionId}" class="post-info">
                <!--<div class="counter">
                    <span class="icon like-icon">👍</span>
                    <span class="count">150</span>
                </div>-->
                <div class="total-counter">
                    <span class="icon comment-icon">💬</span>
                    <span class="count" title="total number of comments">${totalNew}</span>
                </div>
                <div class="unread-counter">
                    <span class="icon comment-icon">💬</span>
                    <span class="unread-count" title="number of unread comments">${unreadCounter}</span>
                </div>
            </div>
        `;
    const postInfoSection = postContainer.querySelector('div.post-info');
    if (postInfoSection) {
        postInfoSection.addEventListener('click', function () {
            const fcWidget = createFreeCommentsWidget(
                postInfoSection,
                channel.id,
                channel.name,
                FreeCommentsModalView.editableDivStyle,
                false,
                null
            );
            fcWidget.style.textAlign = 'left';
            delay(1000).then(() => {
                if (fcWidget) {
                    focusToWidget(fcWidget);
                    updatePostPreviewCounter(
                        channel.id,
                        "unread-count",
                        function () {
                            return 0;
                        }
                    );
                }
            });
        });
    }
    const img = postContainer.querySelector('img.post-image');
    if (img) {
        img.src = objectUrl;
        img.addEventListener('click', function () {
            //console.log(channel.name);
            chrome.runtime.sendMessage({
                action: "freeCommentsPreview",
                deviceId: FreeCommentsHint.fcProperties.deviceId,
                link: postUrl,
                channelId: channel.id,
                screenWidth: screen.availWidth,
                screenHeight: screen.availHeight,
                nickName: FreeCommentsHint.fcProperties.nickName,
                signature: FreeCommentsHint.fcProperties.signature,
                signatureHash: FreeCommentsHint.fcProperties.signatureHash,
                avatar: FreeCommentsHint.fcProperties.avatar,
                webSite: FreeCommentsHint.fcProperties.webSite,
                blockAds: FreeCommentsHint.fcProperties.blockAds,
                allowDynamicLinkResolving: FreeCommentsHint.fcProperties.allowDynamicLinkResolving
            });
            //reset unread counter
            updatePostPreviewCounter(
                channel.id,
                "unread-count",
                function () {
                    return 0;
                }
            );
            saveTotalCounterToDb(channel.id);
        });
    }
    feedContainer.appendChild(postContainer);
}


function reloadPosts(feedContainer) {
    removeAllChildren(feedContainer);
    PushcaClient.getChannels(PushcaClient.ClientObj.cloneWithoutDeviceId()).then(channelsResponse => {
        if (channelsResponse && isArrayNotEmpty(channelsResponse.channels)) {
            loadAllPostPreviews(channelsResponse.channels, feedContainer);
        }
    });
}

async function getTotalNumberOfUnreadComments() {
    const channelsResponse = await PushcaClient.getChannels(
        PushcaClient.ClientObj.cloneWithoutDeviceId()
    );
    const response = await calculateTotalNumberOfUnreadCounters(channelsResponse);
    if (!response) {
        return 0;
    }
    if (response.type !== FCResponseType.SUCCESS) {
        return 0;
    }
    return response.body;
}

function cleanFreeCommentsFeed() {
    getAllPostPreviews(function (postPreviews) {
        for (const [postId, postPreviewInfo] of postPreviews.entries()) {
            PushcaClient.removeMeFromChannel(new PChannel(postId, postPreviewInfo.postUrl))
                .then(result => {
                    if (result && (result.type === ResponseType.SUCCESS)) {
                        FreeCommentsWidget.posts.delete(postId);
                    }
                });
        }
    });
    clearAllPostPreviews();
    if (FreeCommentsModalView.feedContainer) {
        reloadPosts(FreeCommentsModalView.feedContainer);
    }
    delay(2000).then(() => {
        location.replace(location.href);
    });
}

async function calculateTotalNumberOfUnreadCounters(channelsResponse) {
    if (!channelsResponse) {
        return new FCWaiterResponse(FCResponseType.SUCCESS, 0);
    }
    const channelsArray = channelsResponse.channels;
    if (!isArrayNotEmpty(channelsArray)) {
        return new FCWaiterResponse(FCResponseType.SUCCESS, 0);
    }
    let timeoutMs = 5000;
    let timeout = (ms) => new Promise((resolve, reject) => {
        setTimeout(() => reject(new Error('Timeout after ' + ms + ' ms')), ms);
    });
    const waitingHallId = uuid.v4().toString();
    getAllPostPreviews(function (postPreviews) {
        let unreadCounter = 0;
        const notSavedChannels = [];
        const numberOfSavedChannels = postPreviews.size;
        for (let i = 0; i < channelsArray.length; i++) {
            const postId = channelsArray[i].channel.id;
            const postPreviewInfo = postPreviews.get(postId);
            if (postPreviewInfo) {
                let totalOld = postPreviewInfo.totalCount;
                unreadCounter = unreadCounter + (channelsArray[i].counter - totalOld);
            } else {
                notSavedChannels.push(channelsArray[i].channel);
            }
        }
        const channelsLimit = 100 - numberOfSavedChannels;
        if (notSavedChannels.length > channelsLimit) {
            for (let i = 0; i < notSavedChannels.length; i++) {
                if ((i + 1) > channelsLimit) {
                    PushcaClient.removeMeFromChannel(notSavedChannels[i]);
                }
            }
        }
        CallableFuture.releaseWaiterIfExistsWithSuccess(waitingHallId, unreadCounter);
    });
    let result;
    try {
        result = await Promise.race([
            CallableFuture.addToWaitingHall(waitingHallId),
            timeout(timeoutMs)
        ]);
    } catch (error) {
        CallableFuture.releaseWaiterIfExistsWithError(waitingHallId, error);
    }
    return result;
}

function loadAllPostPreviews(channelsArray, feedContainer) {
    if (!isArrayNotEmpty(channelsArray)) {
        return;
    }
    getAllPostPreviews(function (postPreviews) {
        for (let i = 0; i < channelsArray.length; i++) {
            const postId = channelsArray[i].channel.id;
            const postPreviewInfo = postPreviews.get(postId);
            if (postPreviewInfo) {
                let totalOld = postPreviewInfo.totalCount;
                if (getFreeCommentsWidget(null, postId)) {
                    updatePostPreviewTotal(postId, channelsArray[i].counter);
                    totalOld = channelsArray[i].counter;
                }
                createPostPreview(
                    channelsArray[i].channel,
                    feedContainer,
                    postPreviewInfo.objectUrl,
                    totalOld,
                    channelsArray[i].counter,
                    postPreviewInfo.postUrl
                );
            }
        }
    });
}

window.addEventListener('click', function (event) {
    if (event.target === FreeCommentsModalView.modal) {
        FreeCommentsModalView.modal.style.display = "none";
    }
});
