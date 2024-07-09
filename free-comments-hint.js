console.log('free-comments-hint.js running on', window.location.href);

const PostType = Object.freeze({
    POST: "POST",
    IMAGE: "IMAGE",
    VIDEO: "VIDEO",
    USER_PROFILE: "USER_PROFILE",
    COMMENT: "COMMENT",
    EXTERNAL_RESOURCE: "EXTERNAL_RESOURCE",
    EXTERNAL_DYNAMIC_RESOURCE: "EXTERNAL_DYNAMIC_RESOURCE",
    PERMANENT_LINK: "PERMANENT_LINK"
});

let FreeCommentsHint = {}

FreeCommentsHint.isDynamicLinkResolvingEnabled = function () {
    return FreeCommentsHint.fcProperties.allowDynamicLinkResolving
}

FreeCommentsHint.setFreeCommentsProperties = function (fcProperties) {
    FreeCommentsHint.fcProperties = fcProperties;
}

function updateFcHintCounter(hintElement, fcCounter) {
    if (!hintElement) {
        return;
    }
    hintElement.innerHTML = '<div class="nice-hint nice-hint-font" data-already-discovered="true">' + fcCounter + '</div>';
}

function updateFcMainHintCounter(hintElement, fcCounter) {
    if (!hintElement) {
        return;
    }
    hintElement.innerHTML = `
            <a class="nice-hint-button" data-already-discovered="true"> ${fcCounter} free comments</div>
    `;
    const postContainer = hintElement.closest('div.free-comments-post-container');
    if (postContainer) {
        postContainer.dataset.totalCount = fcCounter;
    }
}

function getFreeCommentsPostHint(id) {
    let hintEl;
    document.querySelectorAll('.free-comments-post-hint').forEach(el0 => {
        if (id === el0.dataset.postId) {
            hintEl = el0;
        }
    });
    return hintEl;
}

function hasFcContentHintAmongChildren(parentElement) {
    const children = parentElement.children;
    if (!children) {
        return false;
    }
    for (let i = 0; i < children.length; i++) {
        if (children[i].classList.contains('free-comments-post-content-hint')) {
            return true;
        }
    }
    return false;
}

function getFreeCommentsPostContentHint(id, inContainer) {
    let hintEl;
    const container = inContainer ? inContainer : document;
    container.querySelectorAll('.free-comments-post-content-hint').forEach(el0 => {
        if (id === el0.dataset.postId) {
            hintEl = el0;
        }
    });
    return hintEl;
}

async function fetchFreeCommentsSingleChannelCounter(postId) {
    const channels = await fetchFreeCommentsChannelCounters([postId]);
    if (channels && isNotEmpty(channels[0])) {
        return channels[0].counter;
    }
    return 0;
}

async function fetchFreeCommentsChannelCounters(ids) {
    if (PushcaClient && PushcaClient.ws) {
        const channelsResponse = await PushcaClient.getChannelsPublicInfo(ids);
        if (channelsResponse && isArrayNotEmpty(channelsResponse.channels)) {
            return channelsResponse.channels;
        }
    }
    return null;
}

function reloadAllFeedHints() {
    const ids = [];

    document.querySelectorAll('.free-comments-post-content-hint').forEach(el0 => {
        if (el0.dataset && el0.dataset.postId) {
            ids.push(el0.dataset.postId);
        }
    });

    document.querySelectorAll('.free-comments-post-hint').forEach(el0 => {
        if (el0.dataset && el0.dataset.postId) {
            ids.push(el0.dataset.postId);
        }
    });

    if (!isArrayNotEmpty(ids)) {
        return;
    }

    fetchFreeCommentsChannelCounters(ids).then(channels => {
        if (channels) {
            channels.forEach(channelInfo => {
                const channelId = channelInfo.channel.id;
                const fcCounter = channelInfo.counter ? channelInfo.counter : 0;
                if (channelId) {
                    refreshChannelHints(channelId, fcCounter);
                }
            });
        }
    });
}

function hideAllFcHints() {
    document.querySelectorAll('div.free-comments-post-hint').forEach(el0 => {
        el0.style.visibility = 'hidden';
    });
    document.querySelectorAll('div.free-comments-post-content-hint').forEach(el0 => {
        el0.style.visibility = 'hidden';
    });
}

function showAllFcHints() {
    document.querySelectorAll('div.free-comments-post-hint').forEach(el0 => {
        el0.style.visibility = 'visible';
    });
    document.querySelectorAll('div.free-comments-post-content-hint').forEach(el0 => {
        el0.style.visibility = 'visible';
    });
}

function refreshAllHints(channelId, actorIsMe) {
    fetchFreeCommentsSingleChannelCounter(channelId).then(fcCounter => {
        if (fcCounter) {
            refreshChannelHints(channelId, fcCounter);
            if (typeof setPostPreviewTotalCounter === 'function') {
                setPostPreviewTotalCounter(channelId, fcCounter, actorIsMe);
            }
        }
    });
}

function refreshPostHint(postId) {
    const hintElement = getFreeCommentsPostHint(postId);
    if (hintElement) {
        fetchFreeCommentsSingleChannelCounter(postId).then(fcCounter => {
            if (fcCounter) {
                updateFcMainHintCounter(hintElement, fcCounter);
            }
        });
    }
}

function refreshChannelHints(channelId, fcCounter) {
    document.querySelectorAll('div.free-comments-post-hint').forEach(el0 => {
        if (channelId === el0.dataset.postId) {
            updateFcMainHintCounter(el0, fcCounter);
        }
    });
    document.querySelectorAll('div.free-comments-post-content-hint').forEach(el0 => {
        if (channelId === el0.dataset.postId) {
            updateFcHintCounter(el0, fcCounter);
        }
    });
}

//==================================main functions===============================
function injectHintElement(parentElement, urlWithExtractedData, additionalUrlCheck) {
    if (!urlWithExtractedData) {
        return;
    }
    if (additionalUrlCheck) {
        if (!additionalUrlCheck(urlWithExtractedData.url)) {
            return;
        }
    }
    if (hasFcContentHintAmongChildren(parentElement)) {
        return;
    }

    const postId = urlWithExtractedData.id;
    //const postContainer = parentElement.closest('div.free-comments-post-container');
    const postContainer = findFirstParentBeforeHeightJump(parentElement, 200);
    let hintElement = getFreeCommentsPostContentHint(postId, postContainer);
    if (hintElement) {
        return null;
    }
    //console.log(`Create hint element: ${JSON.stringify(urlWithExtractedData)}`);
    hintElement = document.createElement('div');
    hintElement.title = `[${postId} - ${urlWithExtractedData.type}]${urlWithExtractedData.url}`;
    hintElement.className = 'free-comments-hint free-comments-post-content-hint free-comments-link';
    hintElement.dataset.alreadyDiscovered = 'true';
    hintElement.dataset.postId = postId;
    hintElement.dataset.postUrl = urlWithExtractedData.url;
    hintElement.dataset.postType = urlWithExtractedData.type;
    if (urlWithExtractedData.type === PostType.USER_PROFILE) {
        hintElement.style.left = `5px`;
        hintElement.style.top = `35px`;
    } else {
        hintElement.style.right = '0px';
        hintElement.style.top = `0px`;
    }
    if (urlWithExtractedData.type === PostType.COMMENT) {
        hintElement.style.visibility = 'hidden';
        hintElement.style.opacity = '0';
    }

    hintElement.addEventListener('click', function (event) {
        event.stopPropagation();
        event.preventDefault();
        if (FreeCommentsToolbar.isDeletePressed) {
            hintElement.remove();
            return;
        }
        //console.log(urlWithExtractedData.url);
        chrome.runtime.sendMessage({
            action: "freeCommentsPreview",
            deviceId: FreeCommentsHint.fcProperties.deviceId,
            link: urlWithExtractedData.url,
            channelId: urlWithExtractedData.id,
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
    });
    parentElement.appendChild(hintElement);
    updateFcHintCounter(hintElement, 0);
    fetchFreeCommentsSingleChannelCounter(urlWithExtractedData.id)
        .then(fcCounter => {
            if (fcCounter) {
                updateFcHintCounter(hintElement, fcCounter);
            }
        });
    return hintElement;
}

function injectHintElementWithExternalUrl(externalUrl, anchorEl, additionalUrlCheck) {
    const url = removeQueryParametersFromUrl(externalUrl);
    calculateSHA256(url).then(id => {
        injectHintElement(
            anchorEl,
            new UrlWithExtractedData(url, PostType.EXTERNAL_RESOURCE, id),
            additionalUrlCheck
        );
    });
}

function injectHintElementWithDynamicLink(externalUrl, anchorEl, additionalUrlCheck) {
    const url = removeQueryParametersFromUrl(externalUrl);
    calculateSHA256(url).then(id => {
        injectHintElement(
            anchorEl,
            new UrlWithExtractedData(url, PostType.EXTERNAL_DYNAMIC_RESOURCE, id),
            additionalUrlCheck
        );
    });
}

function injectHintElementIntoPostContainer(postContainer, urlWithExtractedData, postIdBuilder,
                                            commentPanelSupplier, withFollowButton) {
    let postId = urlWithExtractedData.id;
    if (postIdBuilder) {
        postId = postIdBuilder(urlWithExtractedData);
    }
    if (!postId) {
        return;
    }
    if (!postContainer) {
        return;
    }
    if (!commentPanelSupplier) {
        return;
    }
    const postUrl = urlWithExtractedData.url;
    const postType = urlWithExtractedData.type;
    const likeCommentContainer = commentPanelSupplier(postContainer);
    if ((!likeCommentContainer) || (!likeCommentContainer.parentElement)) {
        //console.log("No parent div was found");
        return;
    }
    if (getFreeCommentPostHint(postContainer)) {
        return;
    }

    const fkContainer = document.createElement('div');
    fkContainer.className = "free-comments-panel";
    fkContainer.style.display = 'flex'; // Use flexbox to align divs in a row
    fkContainer.style.justifyContent = 'center'; // Center divs horizontally
    fkContainer.style.alignItems = 'center';
    fkContainer.style.padding = '10px';

    const hintElement = document.createElement('div');
    hintElement.className = 'free-comments-hint free-comments-link free-comments-post-hint';
    hintElement.style.position = "relative";
    hintElement.style.marginTop = '8px';
    hintElement.style.marginBottom = '5px';
    hintElement.style.marginLeft = '5px';
    hintElement.style.marginRight = '5px';
    hintElement.role = "button"
    hintElement.title = `[${postId}-${postType}]${postUrl}`;
    hintElement.dataset.postId = postId;
    hintElement.dataset.postUrl = postUrl;
    hintElement.dataset.postType = postType;
    fkContainer.appendChild(hintElement);

    if (withFollowButton) {
        const followButton = document.createElement('div');
        followButton.ariaLabel = "AddToFCFeed";
        followButton.style.position = "relative";
        followButton.style.marginTop = '8px';
        followButton.style.marginBottom = '5px';
        followButton.style.marginLeft = '5px';
        followButton.style.marginRight = '5px';
        followButton.role = "button"
        followButton.title = `Add to Free comments feed`;
        followButton.dataset.postId = postId;
        followButton.dataset.postUrl = postUrl;
        followButton.dataset.postType = postType;
        followButton.innerHTML = `
            <a class="nice-hint-button" data-already-discovered="true">Follow</div>
        `;
        fkContainer.appendChild(followButton);
        getPostPreview(postId, function (record) {
            followButton.style.visibility = 'hidden';
        });
    }
    insertElementBeforeNextSibling(likeCommentContainer, fkContainer, false);

    updateFcMainHintCounter(hintElement, 0);
    setCustomDataAttributeForElementAndChildren(postContainer, "alreadyDiscovered", 'true');
    fetchFreeCommentsSingleChannelCounter(postId).then(fcCounter => {
        if (fcCounter) {
            updateFcMainHintCounter(hintElement, fcCounter);
        }
    });

    postContainer.dataset.postId = postId;
    postContainer.dataset.postUrl = postUrl;
}
