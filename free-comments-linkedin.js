if (!(document.getElementById('freeCommentsLinkedinScript'))) {
    const loaded = document.createElement('div');
    loaded.id = 'freeCommentsLinkedinScript';
    loaded.style.display = 'none';
    document.body.appendChild(loaded);
    console.log('free-comments-linkedin.js running on', window.location.href);

    let FreeCommentsLinkedin = {};
    FreeCommentsLinkedin.lastTime = 0;
    FreeCommentsLinkedin.delay = 100; // milliseconds
    FreeCommentsLinkedin.readyToShowCommentsDelay = 300; // milliseconds
    FreeCommentsLinkedin.lastScrollPosition = window.scrollY || document.documentElement.scrollTop;
    createFreeCommentsToolbar(reloadAllFeedHints);

    window.addEventListener('scroll', () => {
        const now = new Date().getTime();
        let delta = now - FreeCommentsHint.lastTime;
        if (delta < FreeCommentsHint.delay) {
            return;
        }
        FreeCommentsLinkedin.lastTime = now;
        const currentScrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        const scrollDelta = currentScrollPosition - FreeCommentsLinkedin.lastScrollPosition;
        if (Math.abs(scrollDelta) > 700) {
            delay(1000).then(() => discoverFreeComments());
            FreeCommentsLinkedin.lastScrollPosition = currentScrollPosition;
        }
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('div[aria-label="Control Menu Options"]')
            && (event.target.textContent.trim() === 'Copy link to post')) {
            FreeCommentsToolbar.setActivePostContainer(
                findClosestDiv(
                    event.target,
                    'div.free-comments-post-container'
                )
            );
            delay(1000).then(() => {
                navigator.clipboard.readText().then(copiedLink => {
                    if (copiedLink) {
                        //console.log(`Post link was acquired ${copiedLink}`);
                        addActivePostToFcFeed(copiedLink);
                    }
                });
            });
            return;
        }

        const parentButton = getParentButton(event.target);
        if (parentButton && parentButton.classList.contains("free-comments-post-hint")) {
            addFreeCommentsWidget(parentButton);
        }
    });

    document.addEventListener('mousemove', function (event) {
        const now = new Date().getTime();
        let delta = now - FreeCommentsLinkedin.lastTime;
        if (delta < FreeCommentsLinkedin.delay) {
            return;
        }
        FreeCommentsLinkedin.lastTime = now;
        if (delta > FreeCommentsLinkedin.readyToShowCommentsDelay) {
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
        const postContainer = el0.closest('div.free-comments-post-container');
        if (!postContainer) {
            return;
        }
        if (getFreeCommentsWidget(el0, null)) {
            return;
        }
        const editableDiv = document.querySelector('div[aria-label="Text editor for creating content"]');
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

    function removeIdentityPresenceFromPage() {
        document.querySelectorAll('iframe[data-ad-banner].ad-banner').forEach(adBanner => {
            adBanner.remove();
        });
        document.querySelectorAll('div.presence-entity').forEach(adBanner => {
            adBanner.remove();
        });
        document.querySelectorAll('div.feed-identity-module').forEach(adBanner => {
            adBanner.remove();
        });
        document.querySelectorAll('div.share-box-feed-entry__top-bar').forEach(adBanner => {
            adBanner.remove();
        });
    }

    //removeIdentityPresenceFromPage();

    function discoverFreeComments() {
        const n0 = resolveMultipleLinks(getAllLinksWithRedirectToNewTab(document));
        //console.log(`${n0} links were resolved`);

        const sharedUpdates =
            document.querySelectorAll('div.feed-shared-update-v2:not([data-already-discovered])');
        if ((!sharedUpdates) || (sharedUpdates.length === 0)) {
            //console.log('0 new posts were discovered');
            return;
        }

        let newPosts = Array.from(sharedUpdates)
            .filter(div => extractActivityId(div.getAttribute('data-urn')));

        //console.log(`${newPosts.length} new posts were discovered`);
        if (newPosts.length === 0) {
            return;
        }

        for (let i = 0; i < newPosts.length; i++) {
            let dataUrn = newPosts[i].getAttribute('data-urn');
            const activityId = extractActivityId(dataUrn);
            //console.log(activityId);
            let postContainer = newPosts[i].querySelector('div.free-comments-post-container');
            if (!postContainer) {
                postContainer = document.createElement('div');
                postContainer.className = 'free-comments-post-container';
                postContainer.dataset.activityId = activityId;
                while (newPosts[i].firstChild) {
                    postContainer.appendChild(newPosts[i].firstChild);
                }
                newPosts[i].appendChild(postContainer);

                injectHintElementIntoPostContainer(
                    postContainer,
                    new UrlWithExtractedData(dataUrn, PostType.POST, activityId),
                    null,
                    function (container) {
                        return container.querySelector('div.feed-shared-social-action-bar');
                    }
                );
            }
            newPosts[i].dataset.alreadyDiscovered = 'true';
        }
    }

    function resolveSingleLink(anchorEl) {
        const urlWithData = validateAndPrepareCommunityMemberLink(anchorEl.href);
        if (urlWithData) {
            delay(1000).then(() => {
                injectHintElement(
                    anchorEl,
                    urlWithData,
                    function (url) {
                        return countUpperCaseLetters(decodeURIComponent(url)) < 7;
                    }
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
    reloadFreeCommentsProperties();
}