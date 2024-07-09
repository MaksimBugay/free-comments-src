
document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById("start-button");
    if (startButton) {
        startButton.style.width = '100px';
        startButton.style.top = '480px';
        startButton.style.right = '40px';
    }
    const manifestoButton = document.getElementById("manifesto-button");
    if (manifestoButton) {
        manifestoButton.style.width = '130px';
        manifestoButton.style.top = '480px';
        manifestoButton.style.left = '165px';
    }
});
document.getElementById('avatar-dropdown').addEventListener('click', function () {
    this.querySelector('.dropdown-content').classList.toggle('show');
});

document.getElementById('signature').value = uuid.v4().toString();

document.getElementById('nickname').focus();

document.querySelectorAll('.dropdown-content .option').forEach(option => {
    option.addEventListener('click', function () {
        const avatarCode = this.getAttribute('data-avatar-code');
        const text = this.textContent.trim();

        // Update the UI with the current selection
        const selectedAvatar = document.getElementById("selected-avatar");
        if (selectedAvatar) {
            selectedAvatar.textContent = `Selected avatar: ${text}`;
            selectedAvatar.dataset.avatarCode = avatarCode;
        }

        // Close the dropdown after selection
        document.querySelector('.dropdown-content').classList.remove('show');
        delay(100).then(() => {
            document.getElementById("popup-content").dispatchEvent(createMouseClickEvent(0, 0, false));
        });

        // Here you can also handle the selected avatar
        // For example, save the selection to localStorage or update user settings
        //console.log("Avatar selected:", avatarCode);
    });
});

// Close the dropdown if the user clicks outside of it
window.addEventListener('click', function (e) {
    if (!document.getElementById('avatar-dropdown').contains(e.target)) {
        document.querySelector('.dropdown-content').classList.remove('show');
    }
});

document.getElementById('manifesto-button').addEventListener('click', (event) => {
    chrome.action.setPopup({popup: "html/manifesto.html"}, function () {
        window.location.href = "manifesto.html"; // Change the current popup to the new one
    });
});

document.getElementById('donate-button').addEventListener('click', (event) => {
    chrome.action.setPopup({popup: "html/for-investors.html"}, function () {
        window.location.href = "for-investors.html"; // Change the current popup to the new one
    });
});
document.getElementById('start-button').addEventListener('click', (event) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || (tabs.length === 0)) {
            return;
        }
        const tabId = tabs[0].id;
        let nickName = 'Anonymous';
        const nickNameInput = document.getElementById('nickname');
        if (nickNameInput && nickNameInput.value) {
            nickName = nickNameInput.value;
        }
        let signature = uuid.v4().toString();
        const signatureInput = document.getElementById('signature');
        if (signatureInput && signatureInput.value) {
            signature = signatureInput.value;
        }
        let webSite = "";
        const webSiteInput = document.getElementById('web-site');
        if (webSiteInput && webSiteInput.value) {
            webSite = webSiteInput.value;
        }
        let avatar = '0';
        const selectedAvatar = document.getElementById("selected-avatar");
        if (selectedAvatar && selectedAvatar.dataset && selectedAvatar.dataset.avatarCode) {
            avatar = selectedAvatar.dataset.avatarCode;
        }
        let blockAds = false;
        let allowDynamicLinkResolving = false;
        const checkBox = document.getElementById('allow-dynamic-link-resolving');
        if (checkBox) {
            allowDynamicLinkResolving = checkBox.checked;
        }
        calculateSHA256(signature).then(signatureHash => {
            chrome.runtime.sendMessage({
                action: "injectFreeCommentsIntoActiveTab",
                tabId: tabId,
                deviceId: uuid.v4().toString(),
                nickName: nickName,
                signature: signature,
                signatureHash: signatureHash,
                webSite: webSite,
                avatar: avatar,
                blockAds: blockAds,
                allowDynamicLinkResolving: allowDynamicLinkResolving
            }).then(() => {
                window.close();
            });
        });
    });
});

chrome.storage.local.get(['fcProperties']).then(result => {
    if (isNotEmpty(result) && isNotEmpty(result.fcProperties)) {
        let fcProperties = result.fcProperties;
        const nickNameInput = document.getElementById('nickname');
        nickNameInput.value = fcProperties.nickName;

        const signatureInput = document.getElementById('signature');
        signatureInput.value = fcProperties.signature;

        const webSiteInput = document.getElementById('web-site');
        webSiteInput.value = fcProperties.webSite;

        if (16 !== fcProperties.avatar) {
            const selectedAvatar = document.getElementById("selected-avatar");
            selectedAvatar.dataset.avatarCode = fcProperties.avatar;
            selectedAvatar.innerText = `Selected avatar: Avatar ${parseInt(fcProperties.avatar) + 1}`;
        }

        const checkBox = document.getElementById('allow-dynamic-link-resolving');
        checkBox.checked = fcProperties.allowDynamicLinkResolving;
    }
});