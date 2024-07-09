if (!(document.getElementById('freeCommentsMainScript'))) {
    const loaded = document.createElement('div');
    loaded.id = 'freeCommentsMainScript';
    loaded.style.display = 'none';
    document.body.appendChild(loaded);
    console.log('free-comments.js running on', window.location.href);

    let FreeComments = {};

    FreeComments.resolveDynamicLink = async function (url, inTimeoutMs) {
        let timeoutMs = inTimeoutMs || 30000;
        let timeout = (ms) => new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Timeout after ' + ms + ' ms')), ms);
        });
        const sessionId = uuid.v4().toString();
        chrome.runtime.sendMessage({
            action: "resolveDynamicLinkSilently",
            sessionId: sessionId,
            link: url
        });
        const waitingHallId = sessionId;
        let result;
        try {
            result = await Promise.race([
                CallableFuture.addToWaitingHall(waitingHallId),
                timeout(timeoutMs)
            ]);
        } catch (error) {
            //console.log(`ResolveDynamicLink error: url = ${url}, error = ${error}`);
            CallableFuture.releaseWaiterIfExistsWithError(waitingHallId, error);
            result = new FCWaiterResponse(FCResponseType.ERROR, error);
        }
        return result;
    }

    FreeComments.resolveShareLink = async function (shareButton0, inTimeoutMs) {
        let timeoutMs = inTimeoutMs || 3000;
        let timeout = (ms) => new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Timeout after ' + ms + ' ms')), ms);
        });
        const resolveShareLinkId = uuid.v4().toString();
        shareButton0.dataset.resolveShareLinkId = resolveShareLinkId;
        navigator.clipboard.writeText('').then(() => {
            shareButton0.dispatchEvent(createMouseClickEvent(0, 0, false));
        });
        const waitingHallId = resolveShareLinkId;
        let result;
        try {
            result = await Promise.race([
                CallableFuture.addToWaitingHall(waitingHallId),
                timeout(timeoutMs)
            ]);
        } catch (error) {
            if (error && error.body) {
                console.error(`ResolveShareLink error: ${error.body}`);
            } else {
                console.error(`ResolveShareLink error: ${error}`);
            }
            CallableFuture.releaseWaiterIfExistsWithError(waitingHallId, error);
            result = new FCWaiterResponse(FCResponseType.ERROR, error);
        } finally {
            shareButton0.dataset.resolveShareLinkId = '';
        }
        return result;
    }

    function initFreeComments() {
        FreeComments.lastTime = 0;
        FreeComments.delay = 100; // milliseconds
        FreeComments.readyToShowCommentsDelay = 300; // milliseconds
        FreeComments.lastScrollPosition = window.scrollY || document.documentElement.scrollTop;
        FreeComments.discoveryTags = ['DIV', 'IMG', 'A', 'SPAN'];
        FreeComments.parentContainerWithFeed = getParentContainerWithFeed();
        FreeComments.documentMutationObserver = initObserver(document, null, newButtonWasAddedEventHandler);
        FreeComments.resolveShareLinkInterval = window.setInterval(function () {
            shareDialogWasShownHandler(null);
        }, 1000);
        FreeComments.resolvedLinks = new Map();
        createFreeCommentsToolbar(reloadAllFeedHints);

        if (isSingleFacebookPostPage()) {
            displayWidgetOnSinglePostPage();
        }
    }

    function displayWidgetOnSinglePostPage() {
        let visibleCommentButtons;
        if (isFacebookVideoWatchPage()) {
            visibleCommentButtons = findButtons(document, null,
                function (btn) {
                    return isTrulyVisible && findSpanWithText(btn, "Comments")
                });
        } else {
            visibleCommentButtons = findButtons(document, "Like", isTrulyVisible);
        }
        if (isArrayNotEmpty(visibleCommentButtons)) {
            attachFreeCommentsWidgetToButton(visibleCommentButtons[0]);
        }
    }

    function shareDialogWasShownHandler(newShareDialog) {
        let shareDialog = newShareDialog;
        if (!shareDialog) {
            shareDialog = document.querySelector('div[aria-label="Share options"][role="dialog"]');
        }
        if (!shareDialog) {
            return;
        }
        const shareButton = findClosestDiv(shareDialog, 'div[aria-label="Send this to friends or post it on your profile."][role="button"]');
        if (!shareButton) {
            return;
        }
        if ((!shareButton.dataset) || (!shareButton.dataset.resolveShareLinkId)) {
            return;
        }
        const resolveShareLinkId = shareButton.dataset.resolveShareLinkId;
        const copyLink = findSpanWithText(shareDialog, "Copy link");
        if (copyLink) {
            copyLink.dispatchEvent(createMouseClickEvent(0, 0, false));
            delay(1000).then(() => {
                navigator.clipboard.readText().then(copiedLink => {
                    if (copiedLink) {
                        CallableFuture.releaseWaiterIfExistsWithSuccess(
                            resolveShareLinkId,
                            copiedLink
                        );
                    }
                });
            });
        } else {
            CallableFuture.releaseWaiterIfExistsWithError(resolveShareLinkId, 'Copy link button is absent');
        }
    }

    function newButtonWasAddedEventHandler(newButtons) {
        //TODO new buttons
        if (!activeViewHasNoFeed()) {
            return;
        }
        newButtons.forEach(newButton => {
            attachFreeCommentsWidgetToButton(newButton);
        });
    }

    function attachFreeCommentsWidgetToButton(newButton) {
        initActivePost(newButton);
        newButton.dataset.postId = FreeComments.postId;
        newButton.dataset.postUrl = FreeComments.postUrl;
        if (isFacebookVideoReelPage()) {
            return;
        }
        if (findSpanWithText(newButton, "Comments")) {
            addFreeCommentsWidgetAfterDelay(newButton, 1000);
        }
        if (isFacebookVideoWatchPage()) {
            return;
        }
        if ((newButton.ariaLabel === "Leave a comment") && (!isFacebookVideoWatchPage())) {
            addFreeCommentsWidgetAfterDelay(newButton, 1000);
        }
        if ((newButton.ariaLabel === 'Like') && (findSpanWithText(newButton, 'Like'))) {
            addFreeCommentsWidgetAfterDelay(newButton, 1000);
        }
    }

    function addFreeCommentsWidgetAfterDelay(anchorEl, d) {
        delay(d).then(() => {
            if (activeViewHasNoFeed()) {
                addFreeCommentsWidget(anchorEl);
            }
        });
    }

    function initActivePost(el0) {
        if (isSingleFacebookPostPage()) {
            const urlWithExtractedData = extractDataFromUrl(window.location.href);
            if (urlWithExtractedData && urlWithExtractedData.id) {
                setFreeCommentsPost(urlWithExtractedData.id, window.location.href);
            }
        } else {
            if (!el0) {
                return;
            }
            const postContainer = el0.closest('div.free-comments-post-container');
            if (!postContainer) {
                return;
            }
            if (postContainer.dataset && postContainer.dataset.postId) {
                setFreeCommentsPost(postContainer.dataset.postId, postContainer.dataset.postUrl);
            }
        }
    }

    function setFreeCommentsPost(postId, postUrl) {
        FreeComments.postId = postId;
        FreeComments.postUrl = postUrl;
    }

    function resetFreeCommentsPost() {
        FreeComments.postId = null;
        FreeComments.postUrl = null;
    }

    function getCommentPanel(el0) {
        if (!el0) {
            return null;
        }
        if ("Comments" === el0.textContent) {
            const parentButton = getParentButton(el0);
            return findTopParentWhenNextSiblingWithoutProvidedElement(parentButton);
        }
        //========try to find like button ==========================
        let parent0;
        parent0 = findFirstParentWithLikeButton(el0);
        if (parent0) {
            const likeButtonDiv = getLikeButtonDiv(parent0);
            if (!hasDirectParentWithRole(likeButtonDiv, "article")) {
                return findTopParentWhenNextSiblingWithoutProvidedElement(likeButtonDiv);
            }
        }
        //========try to find comment button ==========================
        parent0 = findFirstParentWithCommentButtonDiv(el0);
        if (parent0) {
            const commentButtonDiv = getCommentButtonDiv(parent0);
            return findTopParentWhenPreviousSiblingWithoutProvidedElement(commentButtonDiv);
        }
        //-------------------------------------------------------------

        return null;
    }

    function getCommentPanelSimple(postContainer) {
        const likeButton = findLikeButtonFromLikeSharePanel(postContainer);
        if (!likeButton) {
            return null;
        }
        return findFirstParentBeforeHeightJump(likeButton, 50)
        //return likeButton.parentElement;
    }

    function injectPostHintElement(postContainer, urlWithExtractedData) {
        injectHintElementIntoPostContainer(
            postContainer,
            urlWithExtractedData,
            buildPostId,
            getCommentPanelSimple,
            true
        );
    }

    function discoverFreeComments() {
        //TODO discovery
        if (activeViewHasNoFeed()) {
            return;
        }
        //const n0 = resolveMultipleLinks(getAllNotDiscoveredLinks(feedContainer));
        //console.log(`${n0} links were resolved`);

        //const n1 = resolveMultipleLinks(getAllNotDiscoveredImages(feedContainer));
        //console.log(`${n1} images were resolved`);

        const spans = document.querySelectorAll(
            'span.html-span:not([data-already-discovered])'
        );
        if (spans.length > 0) {
            //console.log(`${spans.length} spans were resolved`)
            spans.forEach(span => {
                resolveSpan(span);
            });
        }

        batchPostDiscovery();
    }

    function resolveSpan(spanEl) {
        if (!spanEl) {
            return;
        }
        if (spanEl.tagName !== 'SPAN') {
            return;
        }
        if (!spanEl.classList.contains("html-span")) {
            return;
        }
        const closestLink = spanEl.closest('a');
        if (closestLink && (!closestLink.href.endsWith("#")) && (!closestLink.href.includes('/messages/t/'))) {
            closestLink.dataset.htmlText = spanEl.innerHTML;
            closestLink.dispatchEvent(createMouseClickEvent(0, 0, true));
            spanEl.dataset.alreadyDiscovered = 'true';
        }
    }

    function extractUrlClosestToAnchor(anchorEl) {
        if (anchorEl.tagName === 'A') {
            return anchorEl.href;
        }
        if (anchorEl.tagName === 'IMG') {
            if (!isFbContentDynamicLink(anchorEl.src)) {
                return anchorEl.src;
            }
        }
        const closestLink = anchorEl.closest('a');
        if (closestLink) {
            return closestLink.href;
        }
        const closestImage = anchorEl.closest('img');
        if (closestImage) {
            return closestImage.src;
        }
        return null;
    }

    function resolveSingleLink(el0) {
        if (!el0) {
            return;
        }

        if (el0.dataset && ('true' === el0.dataset.alreadyResolved)) {
            return;
        }

        if (el0.querySelector('div.free-comments-post-content-hint')) {
            return;
        }

        const parentLink = el0.closest('a');
        if (parentLink && parentLink.querySelector('div.free-comments-post-content-hint')) {
            return;
        }
        if (!parentLink) {
            const parentImage = el0.closest('img');
            if (parentImage && parentImage.querySelector('div.free-comments-post-content-hint')) {
                return;
            }
        }

        const url = extractUrlClosestToAnchor(el0);
        if (!url) {
            return;
        }
        injectHintElementWithLink(url, el0);
        el0.dataset.alreadyDiscovered = 'true';
        el0.dataset.alreadyResolved = 'true';
    }

    function resolveMultipleLinks(anchorElArray) {
        if (!isArrayNotEmpty(anchorElArray)) {
            return 0;
        }
        for (let i = 0; i < anchorElArray.length; i++) {
            const anchorEl = anchorElArray[i];
            const url = extractUrlClosestToAnchor(anchorEl);
            if (url) {
                injectHintElementWithLink(url, anchorEl);
            }
            anchorEl.dataset.alreadyDiscovered = 'true';
        }
        return anchorElArray.length;
    }

    function injectHintElementWithLink(url, anchorEl) {
        if (!url) {
            return;
        }
        if (!anchorEl) {
            return;
        }
        if (isFbContentDynamicLink(url)) {
            return;
        }
        if (FreeComments.resolvedLinks.get(url)) {
            return;
        }
        let added = false;
        if (isExternalLink(url)) {
            injectHintElementWithExternalUrl(url, anchorEl);
            added = true;
        }
        if (!added) {
            const urlWithExtractedData = extractDataFromUrl(url);
            if (urlWithExtractedData) {
                if (PostType.USER_PROFILE === urlWithExtractedData.type) {
                    if (!anchorEl.querySelector('image')) {
                        return;
                    }
                }
                if (PostType.POST === urlWithExtractedData.type) {
                    const postContainer = anchorEl.closest('div.free-comments-post-container');
                    if (postContainer) {
                        injectHintElement(postContainer, new UrlWithExtractedData(
                            removeQueryParametersFromUrl(urlWithExtractedData.url),
                            urlWithExtractedData.type,
                            urlWithExtractedData.id
                        ));
                        added = true;
                    }
                } else {
                    injectHintElement(anchorEl, urlWithExtractedData);
                    added = true;
                }
            }
        }
        if (!added) {
            const url0 = extractParamValueFromUrl(url, 'u');
            if (url0 && isExternalLink(url0)) {
                injectHintElementWithExternalUrl(url0, anchorEl);
                added = true;
            }
        }
        if (!added) {
            const url1 = extractParamValueFromUrl(url, 'url');
            if (url1 && isExternalLink(url1)) {
                injectHintElementWithExternalUrl(url1, anchorEl);
                added = true;
            }
        }
        if (added) {
            //console.log(`Hint was successfully added: url = ${url}`);
            return;
        }

        if (!isDynamicLink(url)) {
            return;
        }

        anchorEl.dataset.dynamicLink = url;
        if (!FreeCommentsHint.isDynamicLinkResolvingEnabled()) {
            return;
        }

        if (FreeComments.resolvedLinks.get(url)) {
            return;
        }
        FreeComments.resolveDynamicLink(url).then(result => {
            if (result) {
                let resolvedUrl = '';
                let error = '';
                if (FCResponseType.SUCCESS === result.type) {
                    resolvedUrl = result.body;
                    if (resolvedUrl && isExternalLink(resolvedUrl)) {
                        const postContainer = anchorEl.closest('div.free-comments-post-container');
                        if (postContainer) {
                            injectHintElementWithDynamicLink(
                                resolvedUrl, postContainer
                            );
                        }
                        //console.log(`Hint was successfully added: url = ${resolvedUrl}`);
                    }
                } else {
                    error = result.body;
                    console.error(`Cannot resolve dynamic link: ${url}`);
                }
                FreeComments.resolvedLinks.set(url, {
                    result: result.type,
                    resolvedUrl: resolvedUrl,
                    error: error
                });
            }
        });
    }

    function batchPostDiscovery() {
        const allDivsWithPosinset = document.querySelectorAll('div[aria-posinset]:not([data-already-discovered])');
        if ((!allDivsWithPosinset) || (allDivsWithPosinset.length === 0)) {
            //console.log('0 new posts were discovered');
            return;
        }

        const newPosts = Array.from(allDivsWithPosinset)
            .filter(div => isNumber(div.getAttribute('aria-posinset')));

        //console.log(`${newPosts.length} new posts were discovered`);
        if (newPosts.length === 0) {
            return;
        }

        for (let i = 0; i < newPosts.length; i++) {
            //console.log(newPosts[i].getAttribute('aria-posinset'));
            //dispatchMouseMoveEventOnAllChildren(newPosts[i]);
            let postContainer = newPosts[i].querySelector('div.free-comments-post-container');
            if (!postContainer) {
                postContainer = document.createElement('div');
                postContainer.id = uuid.v4().toString();
                postContainer.className = 'free-comments-post-container';
                postContainer.dataset.orderIndex = newPosts[i].getAttribute('aria-posinset');
                while (newPosts[i].firstChild) {
                    postContainer.appendChild(newPosts[i].firstChild);
                }
                newPosts[i].appendChild(postContainer);
                postContainer.addEventListener('click', function (event) {
                    if (event.shiftKey) {
                        event.stopPropagation();
                        event.preventDefault();
                        const postHint = postContainer.querySelector('div.free-comments-post-hint');
                        if (postHint) {
                            postHint.remove();
                        }
                        advancedSinglePostDiscovery(postContainer);
                    }
                });
                const n0 = resolveMultipleLinks(getAllNotDiscoveredLinks(newPosts[i]));
                //console.log(`${n0} links were resolved`);
                const n1 = resolveMultipleLinks(getAllNotDiscoveredImages(newPosts[i]));
                //console.log(`${n1} images were resolved`);
            }
            newPosts[i].dataset.alreadyDiscovered = 'true';
            delay(2000).then(() => {
                singlePostDiscovery(postContainer);
            });
        }
    }

    function isPostWithAds(container) {
        let withAds = false;
        container.querySelectorAll('a').forEach(link => {
            if (link.href.includes('/ads/')) {
                withAds = true;
            }
        });
        if (withAds) {
            return true;
        }

        const fcPostHint = container.querySelector('div.free-comments-post-hint');
        if (fcPostHint) {
            if (PostType.EXTERNAL_DYNAMIC_RESOURCE === fcPostHint.dataset.postType) {
                return true;
            }
            const postUrl = fcPostHint.dataset.postUrl;
            return postUrl.includes("/commerce/");
        }
        if (container.querySelector('a[role="link"][target="_blank"]')) {
            return true;
        }
        return false;
    }

    function singlePostDiscovery(postContainer) {
        if (!postContainer) {
            return false;
        }
        if (postContainer.querySelector('div.free-comments-post-hint')) {
            return true;
        }
        const hints = postContainer.querySelectorAll('div.free-comments-post-content-hint');
        if ((!hints) || (hints.length === 0)) {
            return false;
        }

        const externalLinks = Array.from(hints)
            .filter(hint => (PostType.EXTERNAL_RESOURCE === hint.dataset.postType) || (PostType.EXTERNAL_DYNAMIC_RESOURCE === hint.dataset.postType))
            .filter(hint => !hasDirectParentWithRole(hint, "article"))
            .map(hint => new UrlWithExtractedData(
                hint.dataset.postUrl,
                hint.dataset.postType,
                hint.dataset.postId
            ));
        if (externalLinks.length > 0) {
            injectPostHintElement(postContainer, externalLinks[0]);
            return true;
        }

        const urls = Array.from(hints)
            .filter(hint => {
                return !hint.closest('div[role="article"]:not([aria-posinset])');
            })
            .map(hint => new UrlWithExtractedData(
                hint.dataset.postUrl,
                hint.dataset.postType,
                hint.dataset.postId
            ));

        const videoUrls = urls
            .filter(url => PostType.VIDEO === url.type);
        const imageUrls = urls
            .filter(url => PostType.IMAGE === url.type);
        if ((videoUrls.length === 1) && (imageUrls.length === 0)) {
            injectPostHintElement(postContainer, videoUrls[0]);
            return true;
        }

        if (imageUrls.length > 0) {
            injectPostHintElement(postContainer, imageUrls[0]);
            return true;
        }

        const postCaption = Array.from(hints)
            .filter(hint => PostType.POST === hint.dataset.postType)
            .map(hint => new UrlWithExtractedData(
                hint.dataset.postUrl,
                hint.dataset.postType,
                hint.dataset.postId
            ));

        if (postCaption.length > 0) {
            injectPostHintElement(postContainer, postCaption[0]);
            return true;
        }

        const comments = Array.from(hints)
            .filter(hint => PostType.COMMENT === hint.dataset.postType)
            .map(hint => new UrlWithExtractedData(
                hint.dataset.postUrl,
                hint.dataset.postType,
                hint.dataset.postId
            ));

        if (comments.length > 0) {
            injectPostHintElement(postContainer, comments[0]);
            return true;
        }
        return false;
    }

    function advancedSinglePostDiscovery(postContainer) {
        let success = singlePostDiscovery(postContainer)
        if (success) {
            return;
        }
        const shareButton = getSharButtonDiv(postContainer);
        if (shareButton) {
            FreeComments.resolveShareLink(shareButton).then(result => {
                if (result && (FCResponseType.SUCCESS === result.type)) {
                    //console.log(`Share button ${postContainer.dataset.orderIndex} was resolved: post link = ${result.body}`);
                    const url = result.body;
                    const id = extractPostIdFromPermalink(url);
                    if (url && id) {
                        const urlWithExtractedData = new UrlWithExtractedData(
                            url,
                            PostType.PERMANENT_LINK,
                            id
                        );
                        injectPostHintElement(postContainer, urlWithExtractedData);
                    }
                } else {
                    shareButton.dispatchEvent(createMouseClickEvent(0, 0, false));
                }
            });
        }
    }

    initFreeComments();

    setupConnectionToPushca();

    delay(3000).then(() => {
        if (typeof FreeCommentsWidget !== 'undefined') {
            FreeCommentsWidget.loadPosts();
        }
        discoverFreeComments();
    });

    document.addEventListener('DOMContentLoaded', () => {
        discoverFreeComments();
    });

    window.addEventListener('beforeunload', function () {
        window.clearInterval(FreeComments.resolveShareLinkInterval);
        FreeComments.documentMutationObserver.disconnect();
    });


    window.addEventListener('scroll', () => {
        if (isSingleFacebookPostPage()) {
            return;
        }
        const now = new Date().getTime();
        let delta = now - FreeComments.lastTime;
        if (delta < FreeComments.delay) {
            return;
        }
        FreeComments.lastTime = now;
        const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        const scrollDelta = currentScrollPosition - FreeComments.lastScrollPosition;
        if (Math.abs(scrollDelta) > 700) {
            delay(1000).then(() => discoverFreeComments());
            FreeComments.lastScrollPosition = currentScrollPosition;
        }
    });

    function activeViewHasNoFeed() {
        let dialogDiv = getCommentsDialogDiv(document);
        if (dialogDiv) {
            return true;
        }
        return isSingleFacebookPostPage();
    }

    function isLikeCommentPanelExists(el0, minWidth) {
        const likeCommentPanel = getCommentPanel(el0);
        if (likeCommentPanel) {
            const parent0 = findFirstParentBeforeHeightJump(likeCommentPanel, 30);
            if (parent0 && (parent0.getBoundingClientRect().width) > minWidth) {
                return true;
            }
        }
        return false;
    }

    function findMostSuitableAnchorElementForFcWidget(el0, minWidth) {
        const postContainer = el0.closest('div.free-comments-post-container');
        if (postContainer) {
            const fkContainer = postContainer.querySelector("div.free-comments-panel");
            if (fkContainer) {
                return fkContainer;
            }
        }

        const likeCommentPanel = getCommentPanel(el0);
        if (likeCommentPanel) {
            const parent0 = findFirstParentBeforeHeightJump(likeCommentPanel, 30);
            if (parent0 && (parent0.getBoundingClientRect().width) > minWidth) {
                return parent0;
            }
        }

        let container = findFirstParentWithEditableDiv(el0);
        if (container) {
            const editableDiv = getEditableDiv(container);
            container = findFirstParentBeforeHeightJump(editableDiv, 100);
            if (container) {
                return findTopParentWhenPreviousSiblingWithoutProvidedElement(container);
            }
        }
        return null;
    }

    function addFreeCommentsWidget(el0) {
        if (!FreeComments.postId) {
            return;
        }
        const postId = FreeComments.postId;
        const postUrl = FreeComments.postUrl;
        const minWidth = 150;
        const commentsSection = findMostSuitableAnchorElementForFcWidget(el0, minWidth);
        if (!commentsSection) {
            return;
        }
        if (getFreeCommentsWidget(commentsSection, null)) {
            return;
        }
        const editableDiv = getEditableDiv(document);
        const fcWidget = createFreeCommentsWidget(
            commentsSection,
            postId,
            postUrl,
            editableDiv ? window.getComputedStyle(editableDiv) : null,
            !isLikeCommentPanelExists(el0, minWidth),
            null
        );
        delay(1000).then(() => {
            if (fcWidget) {
                focusToWidget(fcWidget);
                refreshTotalNumberOfUnreadComments();
            }
        });
    }

    document.addEventListener('click', event => {
        if (event.target === document) {
            return;
        }
        if (event.target.dataset && event.target.dataset.htmlText) {
            //console.log(`Span click: ${event.target.dataset.htmlText}`);
        }
        const target = event.target.closest('a[target="_blank"]');
        if (target && target.href) {
            injectHintElementWithLink(target.href, event.target)
        }
        if (event.ctrlKey || event.shiftKey) {
            event.stopPropagation();
            event.preventDefault();
        }
    });

    document.addEventListener('click', function (event) {
        //ignore free comments discovery events
        if (event.ctrlKey) {
            return;
        }
        const postContainer = event.target.closest('div.free-comments-post-container');
        if (postContainer) {
            postContainer.querySelectorAll('a').forEach(link => {
                if (link.href.includes('/ads/')) {
                    //this post contains ads
                }
            });
        }
        initActivePost(event.target);
        //TODO show free comments widget logic is here
        const parentButton = getParentButton(event.target);
        if (!parentButton) {
            return;
        }
        if ((parentButton.ariaLabel === 'AddToFCFeed') && postContainer) {
            parentButton.style.visibility = 'hidden';
            delay(100).then(() => {
                FreeCommentsToolbar.setActivePostContainer(postContainer);
                addActivePostToFcFeed();
            });
            return;
        }
        if (parentButton.ariaLabel === "Close") {
            //console.log(`Button was clicked: type = "close"`);
            resetFreeCommentsPost();
            return;
        }
        if (parentButton.ariaLabel === "See All") {
            //console.log(`Button was clicked: type = "See All"`);
            addFreeCommentsWidget(event.target);
            return;
        }
        if (parentButton.ariaLabel === "Hide") {
            //console.log(`Button was clicked: type = "Hide"`);
            removeFreeCommentsWidget(FreeComments.postId);
            return;
        }
        //comment button
        if (parentButton.ariaLabel === "Leave a comment") {
            if (isFacebookVideoWatchPage()) {
                return;
            } else {
                delay(100).then(() => {
                    addFreeCommentsWidget(parentButton);
                });
            }
        }
        if (parentButton.classList.contains("free-comments-post-hint")) {
            addFreeCommentsWidget(event.target);
            return;
        }
        //reels
        if (parentButton.ariaLabel === "Comment") {
            delay(1000).then(() => {
                addFreeCommentsWidget(parentButton);
            });
        }
        if (event.target.tagName !== 'SPAN') {
            return;
        }
        const text = event.target.textContent;
        if ((!text) || (!text.toUpperCase().includes('COMMENT'))) {
            return;
        }
        //watch
        if ("Comments" === text) {
            addFreeCommentsWidget(event.target);
        }
    });
    document.addEventListener('mousemove', function (event) {
        const now = new Date().getTime();
        let delta = now - FreeComments.lastTime;
        if (delta < FreeComments.delay) {
            return;
        }
        FreeComments.lastTime = now;
        if (delta > FreeComments.readyToShowCommentsDelay) {
            if (event.ctrlKey) {
                console.log(event.target);
                printAllParents(event.target, 30);
                return;
            }
            if (event.shiftKey) {
                console.log(event.target);
                event.target.dispatchEvent(createMouseClickEvent(0, 0, true));
                return;
            }
            if (!event.target.querySelector('canvas')) {
                resolveSingleLink(event.target);
            }
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === 'tab-url-was-changed') {
            //console.log(`Tab url was changed: old = ${request.oldUrl}, new = ${request.url}`);
            FreeComments.parentContainerWithFeed = getParentContainerWithFeed();
            if (!isSingleFacebookPostPage()) {
                resetFreeCommentsPost();
                discoverFreeComments();
            }
        }
        if (request.message === 'dynamic-link-was-resolved') {
            CallableFuture.releaseWaiterIfExistsWithSuccess(request.sessionId, request.url);
        }
        if (request.message === "is-content-script-loaded") {
            sendResponse({loaded: true});
            return true;
        }
    });

    (function (history) {
        const pushState = history.pushState;
        const replaceState = history.replaceState;

        history.pushState = function (state) {
            if (typeof history.onpushstate == "function") {
                history.onpushstate({state: state});
            }
            // Call the original function
            return pushState.apply(history, arguments);
        };

        history.replaceState = function (state) {
            if (typeof history.onreplacestate == "function") {
                history.onreplacestate({state: state});
            }
            // Call the original function
            return replaceState.apply(history, arguments);
        };

        // Example usage
        history.onpushstate = function () {
            console.log('URL changed via pushState!', window.location.href);
            // Perform actions based on the new URL
        };
        history.onreplacestate = function () {
            console.log('URL changed via replaceState!', window.location.href);
            // Perform actions based on the new URL
        };
    })(window.history);

    window.addEventListener('popstate', function () {
        //console.log('URL changed!', window.location.href);
        resetFreeCommentsPost();
        discoverFreeComments();
    });
} else {
    reloadFreeCommentsProperties();
}