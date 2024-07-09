console.log('common-utils.js running on', window.location.href);

//const sid = '13-60-25-150';
//const rid = '18-73-52-116';

const sid = '48.197.202.116';
const rid = '116.702.168.03';

class WebSocketProxy {
    constructor(url) {
        this.ws = null;
        try {
            this.ws = new window.WebSocket(url.replace(rid, sid));
        } catch (error) {
            const wsUrl = url.replace(rid, sid);
            console.error(`Failed public ws sign-in attempt: url = ${wsUrl}, error - ${error}`);
        }
        const handler = {
            set: (obj, prop, value) => {
                //console.log(`Setting property ${prop} to ${value}`);
                if (prop === 'onmessage') {
                    this.ws.onmessage = value;
                } else if (prop === 'onclose') {
                    this.ws.onclose = value;
                } else {
                    obj[prop] = value;
                }

                return true;
            }
        };
        return new Proxy(this, handler);
    }
}

function isNotEmpty(x) {
    return (typeof x !== 'undefined') && x !== null && x !== undefined && x !== ''
}

function isEmpty(x) {
    return !isNotEmpty(x);
}

function escapeCSSSelector(id) {
    return id.replace(/([ !#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

function createMouseClickEvent(x, y, withCtrlKey) {
    return new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        ctrlKey: withCtrlKey,
        clientX: x,
        clientY: y
    });
}

function createMouseMoveEvent(x, y, withCtrlKey) {
    return new MouseEvent("mousemove", {
        view: window,
        bubbles: true,
        cancelable: true,
        ctrlKey: withCtrlKey,
        clientX: x,
        clientY: y
    });
}

function cloneMouseClickEvent(event, withCtrlKey) {
    return new MouseEvent("click", {
        view: window,
        bubbles: true,
        cancelable: true,
        ctrlKey: withCtrlKey,
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY,
        x: event.x,
        y: event.y,
        offsetX: event.offsetX,
        offsetY: event.offsetY
    });
}

function getPageHeight() {
    return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
    );
}

function calculatePercentage(part, whole, decimals = 2) {
    if (whole === 0) return 'NaN'; // Or handle as appropriate for your application
    return ((part / whole) * 100).toFixed(decimals);
}

function calculateElementHeightPercentage(el0) {
    if (!el0) {
        return 0;
    }
    const pageHeight = getPageHeight();
    const elHeight = el0.getBoundingClientRect().height;
    return calculatePercentage(elHeight, pageHeight, 2);
}

function extractFirstSubstring(inputString, separator) {
    const parts = inputString.split(separator);
    return parts[0];
}

function extractLastSubstring(inputString, delimiter) {
    const parts = inputString.split(delimiter);
    return parts[parts.length - 1];
}

function toUrlObject(urlString) {
    try {
        return new URL(urlString);
    } catch (error) {
        //console.log(`Invalid url ${urlString}`);
        return null;
    }
}

function removeQueryParametersFromUrl(urlString) {
    const url = toUrlObject(urlString);
    if (url) {
        return url.origin + url.pathname;
    } else {
        return null;
    }
}

function extractParamValueFromUrl(urlString, paramName) {
    const url = toUrlObject(urlString);
    if (!url) {
        return null;
    }
    const params = new URLSearchParams(url.search);
    const paramValue = params.get(paramName);
    if (isNotEmpty(paramValue)) {
        return decodeURIComponent(paramValue);
    } else {
        return null;
    }
}

function createValidEncodedUrl(urlString) {
    try {
        const decodedUrl = decodeURIComponent(urlString);
        return new URL(decodedUrl);
    } catch (error) {
        // If an error was thrown, the URL is not valid
        return null;
    }
}

async function calculateSHA256(inputString) {
    const encoder = new TextEncoder();
    const data = encoder.encode(inputString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function isValidSHA256(str) {
    const regex = /^[a-fA-F0-9]{64}$/;
    return regex.test(str);
}

function initObserver(container, newDivWasAddedHandler, newButtonWasAddedEventHandler) {
    const callback = function (mutationsList, observer) {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && node.tagName === 'DIV') {
                        if (typeof newDivWasAddedHandler === 'function') {
                            newDivWasAddedHandler(node);
                        }
                        if (typeof newButtonWasAddedEventHandler === 'function') {
                            const newButtons = getAllButtons(node);
                            if (newButtons && (newButtons.length > 0)) {
                                newButtonWasAddedEventHandler(newButtons);
                            }
                        }
                    }
                }
            }
        }
    };

    const config = {
        characterData: true, // Observe changes to text content or node data
        childList: true, // Observe addition or removal of child nodes
        subtree: true // Observe the target and its descendants
    };

    const observer = new MutationObserver(callback);
    observer.observe(container, config);
    return observer;
}

function copyFont(sourceDiv, targetDiv, sourceStyle) {
    const vSourceStyle = sourceStyle ? sourceStyle : window.getComputedStyle(sourceDiv);
    targetDiv.style.fontFamily = vSourceStyle.fontFamily;
    targetDiv.style.fontSize = vSourceStyle.fontSize;
    targetDiv.style.fontWeight = vSourceStyle.fontWeight;
    targetDiv.style.fontStyle = vSourceStyle.fontStyle;
    targetDiv.style.lineHeight = vSourceStyle.lineHeight;
    targetDiv.style.letterSpacing = vSourceStyle.letterSpacing;
    targetDiv.style.textTransform = vSourceStyle.textTransform;
    targetDiv.style.textDecoration = vSourceStyle.textDecoration;
}

function setCustomDataAttributeForElementAndChildren(element, attributeName, value) {
    // Set the attribute for the root element
    element.dataset[attributeName] = value;

    // Get all child elements
    let children = element.getElementsByTagName('*');

    // Loop through each child and set the attribute
    for (let i = 0; i < children.length; i++) {
        children[i].dataset[attributeName] = value;
    }
}

function dispatchMouseMoveEventOnAllChildren(element) {
    let children = element.getElementsByTagName('*');

    for (let i = 0; i < children.length; i++) {
        children[i].dispatchEvent(createMouseMoveEvent(0, 0, true));
    }
}

function scrollToElementMiddle(element) {
    const elementRect = element.getBoundingClientRect(); // Get the bounding rectangle of the element
    const elementTop = window.scrollY + elementRect.top; // Element's top relative to the document
    const elementCenter = elementTop + (elementRect.height / 2); // Center of the element
    const viewportCenter = window.innerHeight / 2; // Center of the viewport
    const scrollPosition = elementCenter - viewportCenter; // Calculate the scroll position

    // Scroll to the calculated position
    window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth' // Optional: add smooth scrolling
    });
}

function insertElementBeforeNextSibling(elementWithSibling, el0, insertBeforeIfNoSiblings) {
    if (!elementWithSibling) {
        return;
    }
    if (!elementWithSibling.parentElement) {
        return;
    }
    if (elementWithSibling.nextElementSibling) {
        elementWithSibling.parentElement.insertBefore(el0, elementWithSibling.nextElementSibling);
    } else {
        if (insertBeforeIfNoSiblings) {
            elementWithSibling.parentElement.insertBefore(el0, elementWithSibling);
        } else {
            elementWithSibling.parentElement.appendChild(el0);
        }
    }
}

function getRandomInt(min, max) {
    // Ensure the arguments are integers. This also allows for ranges that include negative numbers.
    min = Math.ceil(min);
    max = Math.floor(max);

    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min) + min);
}

function isNumber(x) {
    try {
        return !isNaN(parseFloat(x)) && isFinite(x);
    } catch (e) {
        console.error(`cannot parse integer: ${e}`);
        return false;
    }
}

function calculateHeightDiff(el0, el1) {
    return Math.abs(
        el0.getBoundingClientRect().height - el1.getBoundingClientRect().height
    );
}

function emulateEscKeyPress() {
    const escEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27, // Deprecated
        which: 27, // Deprecated
        bubbles: true, // This event bubbles
        cancelable: true // This event can be canceled
    });

    document.dispatchEvent(escEvent);
}

function removeAllChildren(parentElement) {
    while (parentElement.firstChild) {
        parentElement.removeChild(parentElement.firstChild);
    }
}

function isTrulyVisible(el0) {
    // Check if the element is not hidden by CSS
    const style = window.getComputedStyle(el0);
    if (style.display === 'none' || style.visibility === 'hidden' || el0.offsetWidth === 0 || el0.offsetHeight === 0) {
        return false;
    }

    // Check if the element is within the viewport
    const rect = el0.getBoundingClientRect();
    return (
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth &&
        rect.bottom > 0 &&
        rect.right > 0
    );
}

function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Optional: Revoke the object URL after download
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function getElementScreenPositionAndDimensions(element) {
    const rect = element.getBoundingClientRect();

    // Calculate the actual position using the scroll offsets
    const topPosition = rect.top;
    const leftPosition = rect.left;

    return {top: topPosition, left: leftPosition, width: rect.width, height: rect.height};
}

function getScreenDimensions() {
    return {top: 0, left: 0, width: window.innerWidth, height: window.innerHeight};
}

function extractLeadingNumber(str) {
    if (!str) {
        return null;
    }
    const result = str.match(/^\d+/);
    if (result) {
        return parseInt(result[0], 10);
    } else {
        return null;
    }
}

function countUpperCaseLetters(str) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
        if (str[i] >= 'A' && str[i] <= 'Z') {
            count++;
        }
    }
    return count;
}

//NOTE: ===========================Local storage========================================================
function saveToLocalStorage(storageKey, data) {
    let storageObject = {};
    storageObject[storageKey] = data;
    chrome.storage.local.set(storageObject, function () {
        if (chrome.runtime.lastError) {
            console.error(`Cannot save data into local storage under id ${storageKey}: ${chrome.runtime.lastError.message}`);
        } else {
            //console.log(`Data stored successfully into local storage under id ${storageKey}`);
        }
    });
}

function getFromLocalStorage(storageKey, dataConsumer, dataNotFoundHandler) {
    if (typeof dataConsumer !== 'function') {
        console.error('dataConsumer must be a function');
        return;
    }
    chrome.storage.local.get([storageKey], function (result) {
        if (result.hasOwnProperty(storageKey)) {
            dataConsumer(result[storageKey]);
        } else {
            //console.log('No data found for key:', storageKey);
            if (typeof dataNotFoundHandler === 'function') {
                dataNotFoundHandler();
            }
        }
    });
}

function removeFromLocalStorage(storageKey) {
    chrome.storage.local.remove(storageKey, function () {
        if (chrome.runtime.lastError) {
            console.error(`Failed to remove data from local storage under id ${storageKey}:`, chrome.runtime.lastError);
        } else {
            //console.log(`Data under id ${storageKey} was successfully removed from local storage`);
        }
    });
}

//====================================================================================

function extractIdFromAmazonLink(url) {
    const regex = /\/dp\/([A-Za-z0-9]+)/;

    const match = url.match(regex);

    if (match && match[1]) {
        return match[1];
    } else {
        return null;
    }
}

async function buildPostIdForArbitraryPage(url) {
    let postId = null;
    const link = removeQueryParametersFromUrl(url);
    if (link.startsWith("https://www.amazon")) {
        postId = extractIdFromAmazonLink(url);
    }
    if (postId) {
        return new PChannel(postId, link);
    }
    postId = await calculateSHA256(link);
    return new PChannel(postId, link);
}

function delay(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function printAllParents(el0, maxDeep) {
    const pMaxDeep = maxDeep ? maxDeep : 1000;
    let elP = el0.parentElement;
    let level = 0;
    while (elP) {
        level += 1;
        console.log(`Parent: level=${level}, height=${elP.getBoundingClientRect().height}`);
        console.log(elP);
        if (level > pMaxDeep) {
            return;
        }
        elP = elP.parentElement;
    }
}
