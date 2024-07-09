if (!(document.getElementById('freeCommentsVkScript'))) {
    const loaded = document.createElement('div');
    loaded.id = 'freeCommentsVkScript';
    loaded.style.display = 'none';
    document.body.appendChild(loaded);
    console.log('free-comments-vk.js running on', window.location.href);

    let FreeCommentsVk = {};
    FreeCommentsVk.postId = null;
    FreeCommentsVk.lastTime = 0;
    FreeCommentsVk.delay = 100; // milliseconds
    FreeCommentsVk.readyToShowCommentsDelay = 300; // milliseconds
    FreeCommentsVk.lastScrollPosition = window.scrollY || document.documentElement.scrollTop;

    function injectFreeCommentsIntoSinglePostPage() {
        const wlPost = document.getElementById('wl_post');
        if (!wlPost) {
            showAllFcHints();
            return;
        }
        const postUrl = window.location.href;
        const postId = extractIdFromVkPostUrl(postUrl);
        if (!postId) {
            showAllFcHints();
            return;
        }

        const shareButton = wlPost
            .querySelector('div[role="button"][data-like-button-type="share"]');
        if (!shareButton) {
            showAllFcHints();
            return;
        }
        const likePanel = findFirstParentBeforeHeightJump(shareButton, 100);
        if (!likePanel) {
            showAllFcHints();
            return;
        }
        likePanel.dataset.postId = postId;
        likePanel.dataset.postUrl = postUrl;
        FreeCommentsVk.postId = postId;
        addFreeCommentsWidget(likePanel);
    }

    delay(2000).then(() => {
        injectFreeCommentsIntoSinglePostPage();
    });
    createFreeCommentsToolbar(reloadAllFeedHints);

    window.addEventListener('click', function (event) {
        //console.log(event.target);
        if (event.target.tagName === 'BODY') {
            showAllFcHints();
            refreshPostHint(FreeCommentsVk.postId);
        }
    });

    window.addEventListener('popstate', function () {
        //console.log('URL changed', window.location.href);
        showAllFcHints();
        refreshPostHint(FreeCommentsVk.postId);
    });

    window.addEventListener('scroll', () => {
        const now = new Date().getTime();
        let delta = now - FreeCommentsHint.lastTime;
        if (delta < FreeCommentsHint.delay) {
            return;
        }
        FreeCommentsVk.lastTime = now;
        const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        const scrollDelta = currentScrollPosition - FreeCommentsVk.lastScrollPosition;
        if (Math.abs(scrollDelta) > 700) {
            delay(1000).then(() => discoverFreeComments());
            FreeCommentsVk.lastScrollPosition = currentScrollPosition;
        }
    });

    document.addEventListener('click', function (event) {
        const postContainer = event.target.closest('div.free-comments-post-container');
        const parentButton = getParentButton(event.target);
        if (!parentButton) {
            return;
        }
        if ((parentButton.ariaLabel === 'AddToFCFeed') && postContainer) {
            parentButton.style.visibility = 'hidden';
            delay(500).then(() => {
                FreeCommentsToolbar.setActivePostContainer(postContainer);
                addActivePostToFcFeed();
            });
            return;
        }
        if (parentButton && parentButton.classList.contains("free-comments-post-hint")) {
            addFreeCommentsWidget(parentButton);
        }
    });

    document.addEventListener('mousemove', function (event) {
        const now = new Date().getTime();
        let delta = now - FreeCommentsVk.lastTime;
        if (delta < FreeCommentsVk.delay) {
            return;
        }
        FreeCommentsVk.lastTime = now;
        if (delta > FreeCommentsVk.readyToShowCommentsDelay) {
            if (event.ctrlKey) {
                //console.log(event.target);
                //printAllParents(event.target, 30);
                return;
            }
            if (event.shiftKey) {
                //console.log(event.target);
                //event.target.dispatchEvent(createMouseClickEvent(0, 0, true));
                return;
            }
            const closestLink = event.target.closest('a[target="_self"]');
            if (closestLink && (!closestLink.querySelector('div.free-comments-post-content-hint'))) {
                resolveSingleLink(closestLink);
            }
            /*if (!event.target.querySelector('canvas')) {
                resolveSingleLink(event.target);
            }*/
        }
    });

    function addFreeCommentsWidget(el0) {
        const postId = el0.dataset.postId;
        const postUrl = el0.dataset.postUrl;
        if (getFreeCommentsWidget(el0, null)) {
            return;
        }
        const editableDiv = document.querySelector('div[aria-label="Написать комментарий"]');
        const fcWidget = createFreeCommentsWidget(
            el0.parentElement,
            postId,
            postUrl,
            editableDiv ? window.getComputedStyle(editableDiv) : null,
            false,
            null
        );
        delay(1000).then(() => {
            if (fcWidget) {
                focusToWidget(fcWidget);
            }
        });
    }

    function discoverFreeComments() {
        if (extractIdFromVkPostUrl()) {
            return;
        }
        showAllFcHints();
        const n0 = resolveMultipleLinks(getAllAvatarLinks(document));
        //console.log(`${n0} links were resolved`);

        const vkPosts =
            document.querySelectorAll('div.post:not([data-already-discovered])');
        if ((!vkPosts) || (vkPosts.length === 0)) {
            //console.log('0 new posts were discovered');
            return;
        }
        const newPosts = Array.from(vkPosts).filter(div => getVkPostId(div));

        //console.log(`${newPosts.length} new posts were discovered`);
        if (newPosts.length === 0) {
            return;
        }

        for (let i = 0; i < newPosts.length; i++) {
            const vkPostId = getVkPostId(newPosts[i]);
            const vkPostUrl = getVkPostUrl(vkPostId);
            //console.log(vkPostId);
            //console.log(vkPostUrl);
            let postContainer = newPosts[i].querySelector('div.free-comments-post-container');
            if (!postContainer) {
                postContainer = document.createElement('div');
                postContainer.className = 'free-comments-post-container';
                postContainer.dataset.vkPostId = vkPostId;
                while (newPosts[i].firstChild) {
                    postContainer.appendChild(newPosts[i].firstChild);
                }
                newPosts[i].appendChild(postContainer);

                postContainer.addEventListener('click', function () {
                    hideAllFcHints();
                    delay(1000).then(() => {
                        injectFreeCommentsIntoSinglePostPage();
                    });
                });

                injectHintElementIntoPostContainer(
                    postContainer,
                    new UrlWithExtractedData(vkPostUrl, PostType.POST, vkPostId),
                    null,
                    function (container) {
                        const shareButton = container
                            .querySelector('div[role="button"][data-like-button-type="share"]');
                        if (!shareButton) {
                            return null;
                        } else {
                            return findFirstParentBeforeHeightJump(shareButton, 100);
                        }
                    },
                    true
                );
            }
            newPosts[i].dataset.alreadyDiscovered = 'true';
        }
    }

    function resolveSingleLink(anchorEl) {
        const urlWithData = validateAndPrepareVkUserLink(anchorEl.href);
        if (urlWithData) {
            delay(1000).then(() => {
                injectHintElement(
                    anchorEl,
                    urlWithData,
                    null
                );
            });
        }
        anchorEl.dataset.alreadyDiscovered = 'true';
    }

    function resolveMultipleLinks(anchorElArray) {
        if (!isArrayNotEmpty(anchorElArray)) {
            return 0;
        }
        for (let i = 0; i < anchorElArray.length; i++) {
            const anchorEl = anchorElArray[i];
            resolveSingleLink(anchorEl);
        }
        return anchorElArray.length;
    }

    setupConnectionToPushca();
    delay(2000).then(() => {
        discoverFreeComments();
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === "is-content-script-loaded") {
            sendResponse({loaded: true});
            return true;
        }
    });
} else {
    reloadFreeCommentsProperties(function () {
        injectFreeCommentsIntoSinglePostPage();
    });
}