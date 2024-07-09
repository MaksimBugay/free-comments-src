console.log('dom-search-queries.js running on', window.location.href);

let DomSearchQueries = {}

DomSearchQueries.commentsSpanText = [
    "Comments",
    "Most relevant",
    "Newest",
    "All comments",
    "Comment"
];

DomSearchQueries.originalEditorHints = [
    "Write an answer…",
    "Write a public comment…",
    "Submit your first comment…",
    "Write a comment…",
    "Write a replay…"
];

function getAllNotDiscoveredLinks(container) {
    const selector = 'a[role="link"]:not([data-already-discovered])';
    const links = container.querySelectorAll(selector);
    if (!links) {
        return [];
    }
    return Array.from(links);
}

function getAllLinksWithRedirectToNewTab(container) {
    const selector = 'a[target="_self"]:not([data-already-discovered])';
    const links = container.querySelectorAll(selector);
    if (!links) {
        return [];
    }
    return Array.from(links);
}

function getAllAvatarLinks(container) {
    const selector = 'a.AvatarRich:not([data-already-discovered])';
    const links = container.querySelectorAll(selector);
    if (!links) {
        return [];
    }
    return Array.from(links);
}

function getAllNotDiscoveredImages(container) {
    const selector = 'img[referrerpolicy="origin-when-cross-origin"]:not([data-already-discovered])';
    const images = container.querySelectorAll(selector);
    if (!images) {
        return [];
    }
    return Array.from(images);
}

function divHasRole(el0, role) {
    if (!el0) {
        return false;
    }
    if (el0.tagName !== 'DIV') {
        return false;
    }
    return el0.getAttribute('role') === role;
}

function getContainerWithRole(role) {
    let container;
    document.querySelectorAll('*').forEach(el0 => {
        if (divHasRole(el0, role)) {
            container = el0;
        }
    });
    if (container) {
        return container;
    }
    return null;
}

function getParentDiv(someElement) {
    if (!someElement) {
        return null;
    }
    try {
        if (someElement.tagName === 'DIV') {
            return someElement;
        } else {
            return someElement.closest('div');
        }
    } catch (error) {
        //console.log("Suitable container not found: " + error);
        return null;
    }
}

function getCloseButton(container) {
    return container.querySelector('div[aria-label="Close"][role="button"]');
}

function getParentContainerWithFeed() {
    const feed = getContainerWithRole('feed')
    return feed ? feed : getContainerWithRole('main');
}

function findDivWithSpecificH2Text(container, text) {
    const h2Elements = container.querySelectorAll('div h2');
    for (let h2 of h2Elements) {
        if (h2.textContent.includes(text)) {
            return h2.closest('div');
        }
    }
    return null;
}

function findDivWithClass(container, className) {
    const divs = document.querySelectorAll('div');
    if (isArrayNotEmpty(divs)) {
        const matchingDivs = Array.from(divs)
            .filter(div => div.classList.contains(className));
        if (isArrayNotEmpty(matchingDivs)) {
            return matchingDivs[0];
        }
    }
    return null;
}

function getEditableDiv(container) {
    const divSelector = 'div[contenteditable="true"][spellcheck="true"][data-lexical-editor="true"][role="textbox"]';
    return container.querySelector(divSelector);
}

function getSendCommentButton(container) {
    return container.querySelector('div[aria-label="Comment"][role="button"]');
}

function findSpanWithText(container, text) {
    const spans = container.querySelectorAll('span');
    if (!spans) {
        return null;
    }
    return Array.from(spans).find(span => span.textContent.trim() === text || span.textContent.trim().endsWith(text));
}

function findFirstParentWithUserComment(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0;
    while (parent0) {
        if (getUserCommentDiv(parent0)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstParentWithLikeButton(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0;
    while (parent0) {
        if (getLikeButtonDiv(parent0)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function getFreeCommentPostHint(container) {
    return container.querySelector('div.free-comments-post-hint')
}

function findFirstParentWithFreeCommentPostHint(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0;
    while (parent0) {
        if (getFreeCommentPostHint(parent0)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstParentWithCommentButtonDiv(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (getCommentButtonDiv(parent0)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstParentWithEditableDiv(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (getEditableDiv(parent0)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findTopParentWhenNextSiblingWithoutProvidedElement(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        const sibling = parent0.nextElementSibling;
        if ((!sibling) || (!sibling.contains(el0))) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findTopParentWhenPreviousSiblingWithoutProvidedElement(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        const sibling = parent0.previousElementSibling;
        if ((!sibling) || (!sibling.contains(el0))) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstParentBeforeHeightJump(el0, inDelta) {
    if (!el0) {
        return null;
    }
    const delta = inDelta ? inDelta : 100;
    let parent0 = el0.parentElement;
    while (parent0 && parent0.parentElement) {
        if ((parent0.parentElement.getBoundingClientRect().height - parent0.getBoundingClientRect().height) > delta) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function getAllButtons(container) {
    if (!container) {
        return null;
    }
    let querySelector = 'div[role="button"]';
    return container.querySelectorAll(querySelector);
}

function getLikeButtonDiv(container) {
    if (!container) {
        return null;
    }
    let querySelector = 'div[aria-label="Like"][role="button"]';
    return container.querySelector(querySelector);
}

function findLikeButtonFromLikeSharePanel(container) {
    if (!container) {
        return null;
    }
    const querySelector = 'div[aria-label="Like"][role="button"]';
    const buttons = container.querySelectorAll(querySelector);

    if (!buttons) {
        return null;
    }
    let buttonsArray = Array.from(buttons);
    if (!isArrayNotEmpty(buttonsArray)) {
        return null;
    }
    buttonsArray = buttonsArray.filter(btn => findSpanWithText(btn, "Like"));
    if (!isArrayNotEmpty(buttonsArray)) {
        return null;
    }
    return buttonsArray[0];
}

function getAllNotResolvedLikeButtons(container) {
    if (!container) {
        return null;
    }
    let querySelector = 'div[aria-label="Like"][role="button"]';
    const buttons = container.querySelectorAll(querySelector);

    if (!buttons) {
        return [];
    }
    const buttonsArray = Array.from(buttons);
    if (isArrayNotEmpty(buttonsArray)) {
        return buttonsArray.filter(btn => (!btn.dataset) || ('true' !== btn.dataset.alreadyResolved));
    }
}

function findButtons(container, ariaLabel, filterFunction) {
    if (!container) {
        return null;
    }
    let querySelector = 'div[role="button"]';
    if (ariaLabel) {
        querySelector = `div[aria-label="${ariaLabel}"][role="button"]`;
    }
    const buttons = container.querySelectorAll(querySelector);
    if (!buttons) {
        return [];
    }
    const buttonsArray = Array.from(buttons);
    if (filterFunction) {
        return buttonsArray.filter(btn => filterFunction(btn));
    } else {
        return buttonsArray;
    }
}

function getAllNotResolvedShareButtons(container) {
    if (!container) {
        return null;
    }
    let querySelector = 'div[aria-label="Send this to friends or post it on your profile."][role="button"]';
    const buttons = container.querySelectorAll(querySelector);

    if (!buttons) {
        return [];
    }
    const buttonsArray = Array.from(buttons);
    if (isArrayNotEmpty(buttonsArray)) {
        return buttonsArray.filter(btn => (!btn.dataset) || ('true' !== btn.dataset.alreadyResolved));
    }
}

function getCommentsDialogDiv(container) {
    if (!container) {
        return null;
    }
    let selector = 'div[role="dialog"]';
    const dialogs = container.querySelectorAll(selector);

    if (!dialogs) {
        return null;
    }

    const filteredDialogs = Array.from(dialogs).filter(dialog =>
        ('Notifications' !== dialog.getAttribute('aria-label')) && dialog.innerHTML);
    if (isArrayNotEmpty(filteredDialogs)) {
        return filteredDialogs[0];
    }
    return null;
}

function getSharButtonDiv(container) {
    if (!container) {
        return null;
    }
    let querySelector = 'div[aria-label="Send this to friends or post it on your profile."][role="button"]';
    return container.querySelector(querySelector);
}

function getCommentButtonDiv(container) {
    if (!container) {
        return null;
    }
    let querySelector = 'div[aria-label="Leave a comment"][role="button"]';
    return container.querySelector(querySelector);
}

function hasDirectParentWithRole(el0, role) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (parent0.role === role) {
            return true;
        }
        parent0 = parent0.parentElement;
    }
    return false;
}

function getUserCommentDiv(container) {
    if (!container) {
        return null;
    }
    const articles = container.querySelectorAll('div[role="article"]');

    if (!articles) {
        return null;
    }

    const filteredArticles = Array.from(articles).filter(article =>
        article.getAttribute('aria-label') &&
        article.getAttribute('aria-label').startsWith('Comment'));

    if (filteredArticles.length === 0) {
        return null;
    }
    return filteredArticles[0];
}

function getParentUserComment(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (isUserComment(parent0)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function isUserComment(el0) {
    return el0 && (el0.tagName === 'DIV') && (el0.role === "article") && (el0.ariaLabel) && (el0.ariaLabel.startsWith("Comment"));
}

function getParentButton(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (parent0.role === "button") {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstParentWithComplementaryPanel(el0) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (parent0.querySelector('div[role="complementary"]')) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstParentWithRole(el0, role) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (getContainerWithRole(role)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstParentWithClassName(el0, className) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (parent0.classList.contains(className)) {
            return parent0;
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findFirstCloseToPageSizeParent(el0) {
    let current = el0;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    while (current.parentNode != null && current !== document.body) {
        current = current.parentNode;

        // Calculate the size of the current element as a percentage of the viewport size
        const widthPercentage = (current.offsetWidth / viewportWidth) * 100;
        const heightPercentage = (current.offsetHeight / viewportHeight) * 100;

        // Check if either width or height of the current element occupies more than 80% of the viewport
        if (widthPercentage > 95 || heightPercentage > 95) {
            return current; // Return the first parent element meeting the criteria
        }
    }

    return null;
}

function getMarketplaceViewer() {
    return document.querySelector('div[aria-label="Marketplace Listing Viewer"][role="dialog"]');
}

function findFirstParentWithCommentButtonAndEditableDiv(el0, postId) {
    if (!el0) {
        return null;
    }
    let parent0 = el0.parentElement;
    while (parent0) {
        if (postId) {
            const commentDiv = getCommentButtonDiv(parent0);
            if (commentDiv && getEditableDiv(parent0)
                && commentDiv.dataset.postId && (commentDiv.dataset.postId === postId)) {
                return parent0;
            }
        } else {
            const commentDiv = getCommentButtonDiv(parent0, true);
            if (commentDiv && getEditableDiv(parent0)) {
                return parent0;
            }
        }
        parent0 = parent0.parentElement;
    }
    return null;
}

function findClosestDiv(referenceElement, candidatesSelector) {
    if (!referenceElement) {
        return null;
    }
    const candidates = document.querySelectorAll(candidatesSelector);
    if ((!candidates) || (candidates.length === 0)) {
        return null;
    }
    let closestDiv = null;
    let closestDistance = Infinity;

    const refRect = referenceElement.getBoundingClientRect();

    candidates.forEach(div => {
        const divRect = div.getBoundingClientRect();
        const distance = Math.sqrt(
            Math.pow(divRect.left - refRect.left, 2) +
            Math.pow(divRect.top - refRect.top, 2)
        );

        if (distance < closestDistance) {
            closestDistance = distance;
            closestDiv = div;
        }
    });

    return closestDiv;
}
