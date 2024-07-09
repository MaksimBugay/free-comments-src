if (!(document.getElementById('freeCommentsMainScript'))) {
    const loaded = document.createElement('div');
    loaded.id = 'freeCommentsMainScript';
    loaded.style.display = 'none';
    document.body.appendChild(loaded);
    console.log('free-comments-main.js running on', window.location.href);

    let FreeCommentsMain = {};
    FreeCommentsMain.lastTime = 0;
    FreeCommentsMain.delay = 100; // milliseconds
    FreeCommentsMain.readyToShowCommentsDelay = 300; // milliseconds
    FreeCommentsMain.lastScrollPosition = window.scrollY || document.documentElement.scrollTop;
    createFreeCommentsToolbar(reloadAllFeedHints);

    setupConnectionToPushca();

    document.addEventListener('mousemove', function (event) {
        const now = new Date().getTime();
        let delta = now - FreeCommentsMain.lastTime;
        if (delta < FreeCommentsMain.delay) {
            return;
        }
        FreeCommentsMain.lastTime = now;
        if (delta > FreeCommentsMain.readyToShowCommentsDelay) {
            if (event.ctrlKey) {
                //console.log(event.target);
                //printAllParents(event.target, 30);
            }
        }
    });

    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
        // listen for messages sent from background.js
        if (request.message === "is-content-script-loaded") {
            sendResponse({loaded: true});
            return true;
        }
        if (request.message === "get-channel-counter") {
            fetchFreeCommentsSingleChannelCounter(request.postId).then(fcCounter => {
                if (fcCounter) {
                    sendResponse({counter: fcCounter});
                }
            });
            return true;
        }
    });
} else {
    reloadFreeCommentsProperties();
}