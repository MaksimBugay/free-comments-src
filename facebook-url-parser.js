console.log('facebook-url-parser.js running on', window.location.href);

const importantQueryParams = [
    "fbid",
    "v",
    "comment_id",
    "set",
    "w"
];

class UrlWithExtractedData {
    constructor(url, type, id) {
        this.url = filterQueryParams(url);
        this.type = type;
        this.id = id;
    }
}

function filterQueryParams(url) {
    // Convert paramsToKeep to lowercase for case-insensitive comparison
    const paramsToKeepLower = importantQueryParams.map(param => param.toLowerCase());

    // Create a URL object
    const urlObj = toUrlObject(url);
    if (!urlObj) {
        return url;
    }

    const searchParams = new URLSearchParams(urlObj.search);

    const keptParams = new URLSearchParams();

    for (const [key, value] of searchParams) {
        if (paramsToKeepLower.includes(key.toLowerCase())) {
            keptParams.append(key, value);
        }
    }

    urlObj.search = keptParams.toString();

    return urlObj.toString();
}

function extractUrlFromTargetWithImage(targetElement) {
    let imageUrl = "";
    if (targetElement.tagName === 'IMG') {
        imageUrl = targetElement.getAttribute('src');
    }
    if (imageUrl) {
        return imageUrl;
    }
    let linkElement = targetElement;
    while (linkElement && linkElement.nodeName !== 'A') {
        linkElement = linkElement.parentNode;
    }
    if (linkElement && linkElement.nodeName === 'A') {
        imageUrl = linkElement.getAttribute('href') || linkElement.href;
    }
    return imageUrl;
}

function extractUrlFromTargetWithVideo(targetElement) {
    let target = targetElement;
    let videoElement;
    if (target.tagName === 'video') {
        videoElement = target;
    } else {
        videoElement = target.querySelector('video');
    }
    while ((!videoElement) && target.nextElementSibling) {
        target = target.nextElementSibling;
        if (target.tagName === 'video') {
            videoElement = target;
        } else {
            videoElement = target.querySelector('video');
        }
    }
    let videoUrl = "";
    if (videoElement) {
        videoUrl = videoElement.src;
        if (!videoUrl) {
            const sourceElement = videoElement.querySelector('source');
            if (sourceElement) {
                videoUrl = sourceElement.src;
            }
        }
    }
    if (isNotEmpty(videoUrl)) {
        return videoUrl;
    }
    const iframeElement = targetElement.querySelector('iframe');
    if (iframeElement) {
        videoUrl = iframeElement.src;
    }
    return videoUrl;
}

function isPostUrl(url) {
    const regex = /^https:\/\/www\.facebook\.com\/.*(photo|videos|posts|groups|commerce|reel|watch).*$/;
    return regex.test(url);
}

function extractFacebookPostPcb(url) {
    const videoRegex = /\/videos\/pcb\.(\d+\/\d+)/;
    const photoRegex = /[?&]set=pcb\.(\d+)/;

    let match = url.match(videoRegex);
    if (match) {
        return match[1];
    }

    match = url.match(photoRegex);
    if (match) {
        return match[1];
    }

    return null;
}

function extractIdFromUserLink(url) {
    const regex = /\/groups\/(\d+)\/user\/(\d+)\//;
    const match = url.match(regex);

    if (match) {
        const groupId = match[1];
        const userId = match[2];
        if (userId) {
            return `${groupId}_${userId}`;
        }
    }
    return null;
}

function extractIdFromVideo(url) {
    let id = null;

    const regex0 = /\/videos\/(\d+)/;
    const match0 = url.match(regex0);
    if (match0) {
        id = match0[1];
    }

    if (!id) {
        const regex1 = /facebook\.com\/(\d+)\/videos/;
        const match1 = url.match(regex1);
        if (match1) {
            id = match1[1];
        }
    }

    if (!id) {
        const regex2 = /(?:watch\/?\?v=|reel\/)([^\/\?&]+)/;
        const match2 = url.match(regex2);
        if (match2) {
            id = match2[1];
        }
    }

    return id;
}

function extractPostIdFromPermalink(url) {
    if (!url) {
        return null;
    }
    const regex = /\/permalink\/(\d+)\/?/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function extractIdFromComment(url) {
    const regex = /\/posts\/(\d+).*?comment_id=(\d+)/;
    const match = url.match(regex);

    if (match) {
        const postId = match[1];
        const commentId = match[2];
        if (commentId) {
            return `${postId}_${commentId}`;
        } else {
            return postId;
        }
    }
    return null;
}

function extractIdFromPost(url) {
    const regex = /\/posts\/(\d+)\/?/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function extractDataFromUrl(sourceUrl) {
    let url = sourceUrl;
    let postType = null;
    if (!url.startsWith('http')) {
        url = 'https://www.facebook.com' + url;
    }
    if (!isPostUrl(url)) {
        return null;
    }
    const urlObj = new URL(url);
    let fcHintId = urlObj.searchParams.get('fbid');
    if (fcHintId) {
        postType = PostType.IMAGE;
    }

    if (!fcHintId) {
        fcHintId = extractIdFromVideo(url);
        if (fcHintId) {
            postType = PostType.VIDEO;
        }
    }
    if (!fcHintId) {
        const regex3 = /\/listing\/(\d+)\//;
        const match3 = url.match(regex3);
        if (match3) {
            fcHintId = match3[1];
            if (fcHintId) {
                postType = PostType.IMAGE;
            }
        }
    }

    if (!fcHintId) {
        fcHintId = extractIdFromComment(url);
        if (fcHintId) {
            postType = PostType.COMMENT;
        }
    }

    if (!fcHintId) {
        fcHintId = extractIdFromPost(url);
        if (fcHintId) {
            postType = PostType.POST;
        }
    }

    if (!fcHintId) {
        fcHintId = extractIdFromUserLink(url);
        if (fcHintId) {
            postType = PostType.USER_PROFILE;
        }
    }

    const pcb = extractFacebookPostPcb(url);

    if (pcb) {
        if (fcHintId) {
            const id = fcHintId + "_" + pcb;
            return new UrlWithExtractedData(url, postType, id);
        } else {
            return new UrlWithExtractedData(url, postType, pcb);
        }
    }
    if (fcHintId) {
        return new UrlWithExtractedData(url, postType, fcHintId);
    }
    return null;
}

function extractPostIdFromUrl(urlString) {
    const url = toUrlObject(urlString);
    if (!url) {
        return null;
    }
    const setParamValue = extractParamValueFromUrl(url, 'set');
    if (!setParamValue) {
        return null;
    }
    setParamValue.replace('gm.', '');
    setParamValue.replace('pcb.', '');
    setParamValue.replace('a.', '');
    const match = setParamValue.match(/\d+/);
    return match ? match[0] : null;
}

function buildPostId(urlWithExtractedData) {
    if (!urlWithExtractedData) {
        return null;
    }
    if (PostType.PERMANENT_LINK === urlWithExtractedData.type) {
        return urlWithExtractedData.id;
    }
    if (PostType.USER_PROFILE === urlWithExtractedData.type) {
        return null;
    }
    if (PostType.EXTERNAL_DYNAMIC_RESOURCE === urlWithExtractedData.type) {
        return urlWithExtractedData.id;
    }
    if (PostType.EXTERNAL_RESOURCE === urlWithExtractedData.type) {
        return urlWithExtractedData.id;
    }
    if (PostType.COMMENT === urlWithExtractedData.type) {
        return extractFirstSubstring(urlWithExtractedData.id, "_");
    }
    const postId = extractPostIdFromUrl(urlWithExtractedData.url);
    if (postId) {
        return postId;
    }
    return extractLastSubstring(urlWithExtractedData.id, "_");
}

function isFbContentDynamicLink(urlString) {
    if (!urlString) {
        return false;
    }
    return urlString.startsWith("https://scontent-") && urlString.includes('fbcdn.net');
}

function isDynamicLink(urlString) {
    if (urlString.startsWith("https://l.facebook.com/l.php")) {
        return true;
    }
    if ((!urlString.includes("facebook.com"))
        && (urlString.startsWith("https://external-"))
        && urlString.includes('fbcdn.net')) {
        return true;
    }
    return false;
}

function isExternalLink(urlString) {
    const url = removeQueryParametersFromUrl(urlString);
    if (!url) {
        return false;
    }
    if (!url.startsWith("http")) {
        return false;
    }
    if (url.includes("facebook.com") || url.includes("fbcdn.net")) {
        return false;
    }
    return true;
}

function isFacebookVideoWatchPage() {
    return window.location.href.startsWith("https://www.facebook.com/watch/?v=")
        || window.location.href.startsWith("https://www.facebook.com/watch?v=");
}

function isFacebookVideoReelPage() {
    return window.location.href.startsWith("https://www.facebook.com/reel/");
}

function isFacebookGroupUrl(url) {
    const pattern = /^https:\/\/www\.facebook\.com\/groups\/([a-zA-Z0-9\-_.]+)\/$/;
    return pattern.test(url);
}

function isSingleFacebookPostPage(url) {
    const vUrl = url ? url : window.location.href;
    if ((vUrl === 'https://www.facebook.com/') || (vUrl === 'https://www.facebook.com')) {
        return false;
    }
    if (isFacebookGroupUrl(vUrl)) {
        return false;
    }
    const urlWithExtractedData = extractDataFromUrl(vUrl);
    if (urlWithExtractedData && (urlWithExtractedData.type === PostType.USER_PROFILE)) {
        return false;
    }
    return !!(urlWithExtractedData && urlWithExtractedData.id);
}

//======================VK=======================================================
function getVkPostId(el0) {
    if (!el0) {
        return null;
    }
    if (el0.id.startsWith("post-") || el0.id.startsWith("post-")) {
        return el0.id.replace("post-", "").replace("post", "");
    }
    return null;
}

function getVkPostUrl(id) {
    return window.location.href + "?w=wall-" + id;
}

function validateAndPrepareVkUserLink(href) {
    let url = href;
    if (url.startsWith("/")) {
        url = 'https://vk.com' + url;
    }
    return new UrlWithExtractedData(
        url,
        PostType.USER_PROFILE,
        url.replace('https://vk.com/', '')
    );
}

function extractIdFromVkPostUrl(href) {
    const url = href ? href : window.location.href;
    const pattern = /^https:\/\/vk\.com\/.*?w=wall-(\d+_\d+)/;
    const matches = url.match(pattern);

    if (matches && matches[1]) {
        return matches[1];
    } else {
        return null;
    }
}

//======================Linkedin==================================================
function extractActivityId(urn) {
    const regex = /activity:(\d+)$/;
    const match = urn.match(regex);
    return match ? match[1] : null;
}

const linkedinCommunityMemberPatters = [
    "/in/",
    "/groups/",
    "/company/"
]

function validateAndPrepareCommunityMemberLink(href) {
    if (isEmpty(href)) {
        return null;
    }
    let url = href;
    if (url.startsWith("/")) {
        url = 'https://www.linkedin.com' + url;
    }
    if (linkedinCommunityMemberPatters.filter(p => url.includes(p)).length === 0) {
        return null;
    }
    url = removeQueryParametersFromUrl(url);
    if (url.endsWith('/')) {
        url = url.slice(0, -1);  // Remove the last character
    }
    return new UrlWithExtractedData(
        url,
        PostType.USER_PROFILE,
        decodeURIComponent(url.replace('https://www.linkedin.com/', ''))
    );
}
