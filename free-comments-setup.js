class PostPreviewInfo {
    constructor(objectUrl, totalCount, postUrl) {
        this.objectUrl = objectUrl;
        this.totalCount = totalCount;
        this.postUrl = postUrl;
    }
}

const dbNamePrefix = "FreeCommentsPosts";
let dbName;
const storeName = "postScreenshots";
const totalPostsNumberLimit = 100;

const dbRegistry = new Map();

function openDataBase(accountId) {
    dbName = `${dbNamePrefix}_${accountId}`;
    const request = indexedDB.open(dbName, 1);

    request.onerror = function (event) {
        console.error("Database error: ", event.target.error);
    };

    request.onupgradeneeded = function (event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {keyPath: "id"});
            objectStore.createIndex("timestamp", "timestamp", {unique: false});
            //console.log(`Store ${storeName} was created`);
        }
    };

    request.onsuccess = function (event) {
        const db = event.target.result;
        dbRegistry.set(accountId, db);
        //console.log(`Database ${dbName} opened successfully`);
        //clearAllPostPreviews();
    };
}

function closeDataBase(accountId) {
    try {
        const db = dbRegistry.get(accountId);
        if (db) {
            db.close();
        }
    } catch (error) {
    }
}

function getActiveDb() {
    if (typeof PushcaClient === 'undefined') {
        return null;
    }
    if ((!PushcaClient.ClientObj) || (!PushcaClient.ClientObj.accountId)) {
        return null;
    }
    const accountId = PushcaClient.ClientObj.accountId;
    return dbRegistry.get(accountId);
}

function addPostPreview(postId, postUrl, imageBlob, total) {
    const db = getActiveDb();
    if (!db) {
        console.error('No open database for active account');
    }
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const timestamp = new Date().getTime();
    const request = store.put({
        id: postId,
        image: imageBlob,
        url: postUrl,
        total: total,
        timestamp: timestamp
    });

    request.onsuccess = function () {
        //console.log("Screenshot added to the database successfully with custom ID:", postId);
        maintainLatestEntries(store);
    };

    request.onerror = function (event) {
        console.error("Error adding screenshot to the database", event.target.error);
    };
}

function updatePostPreviewTotal(postId, newTotal) {
    const db = getActiveDb();
    if (!db) {
        console.error('No open database for active account');
    }
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    // Retrieve the existing record first
    const getRequest = store.get(postId);

    getRequest.onsuccess = function () {
        const data = getRequest.result;

        if (data) {
            // Update the total field only
            data.total = newTotal;

            // Put the updated record back into the store
            const updateRequest = store.put(data);

            updateRequest.onsuccess = function () {
                //console.log("Total updated successfully for post ID:", postId);
            };

            updateRequest.onerror = function (error) {
                console.error("Error updating total for post ID:", postId, error.target.error);
            };
        } else {
            //console.log("No record found with post ID:", postId);
        }
    };

    getRequest.onerror = function (event) {
        console.error("Error retrieving the record to update", event.target.error);
    };
}


function maintainLatestEntries(store) {
    // Open a cursor on the timestamp index, sorted by timestamp
    const index = store.index("timestamp");
    let count = 0;
    index.openCursor(null, "prev").onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            count++;
            if (count > totalPostsNumberLimit) {
                // Delete the entry with the oldest timestamp
                store.delete(cursor.primaryKey);
            }
            cursor.continue();
        }
    };
}

function getPostPreview(postId, recordConsumer) {
    const db = getActiveDb();
    if (!db) {
        console.error('No open database for active account');
    }
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(postId);

    request.onsuccess = function () {
        if (!request.result) {
            return;
        }
        const imgBlob = request.result.image;
        if (imgBlob) {
            const url = URL.createObjectURL(imgBlob);
            recordConsumer(new PostPreviewInfo(url, request.result.total, request.result.url));
        } else {
            console.error(`No preview image found for the specified post ID ${postId}.`);
        }
    };

    request.onerror = function (event) {
        console.error('Error retrieving preview image from the database for the specified post ID ${postId}', event.target.error);
    };
}

function getAllPostPreviews(allRecordsConsumer) {
    const db = getActiveDb();
    if (!db) {
        console.error('No open database for active account');
    }
    let postPreviews = new Map();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.openCursor();

    request.onsuccess = function (event) {
        const cursor = event.target.result;
        if (cursor) {
            if (cursor.value.image) {
                const url = URL.createObjectURL(cursor.value.image);
                postPreviews.set(
                    cursor.key,
                    new PostPreviewInfo(url, cursor.value.total, cursor.value.url)
                );
            } else {
                console.error(`No preview image found for record ID ${cursor.key}.`);
            }
            cursor.continue();
        } else {
            //console.log('All entries processed, passing data to consumer.');
            allRecordsConsumer(postPreviews);
        }
    };

    request.onerror = function (event) {
        console.error('Error retrieving preview images from the database', event.target.error);
    };
}

function clearAllPostPreviews() {
    const db = getActiveDb();
    if (!db) {
        console.error('No open database for active account');
    }
    // Open a read-write transaction on your database
    const transaction = db.transaction([storeName], "readwrite");

    // Get the object store from the transaction
    const store = transaction.objectStore(storeName);

    // Request to clear all the entries in the store
    const request = store.clear();

    request.onsuccess = function () {
        //console.log("All entries have been successfully removed from the store.");
    };

    request.onerror = function (event) {
        console.error("Error clearing the store:", event.target.error);
    };
}

function getFreeCommentsProperties(isModalView, propertiesConsumer) {
    const varName = 'fcProperties';
    chrome.storage.local.get([varName]).then(result => {
        let fcProperties = result.fcProperties;
        const clientObj = new ClientFilter(
            "workSpaceMain",
            result.fcProperties.nickName,
            fcProperties.deviceId,
            "FREE_COMMENTS",
            fcProperties.avatar,
            isModalView,
            result.fcProperties.signatureHash,
            result.fcProperties.webSite
        );
        fcProperties = {...fcProperties, clientObj: clientObj};
        if (propertiesConsumer) {
            propertiesConsumer(fcProperties);
        }
    });
}

function addUserToBlackList(accountId, signatureHash) {
    const varName = "userBlackList";
    getFromLocalStorage(
        varName,
        function (userBlackListJson) {
            const userBlackList = new Map(userBlackListJson);
            userBlackList.set(signatureHash, accountId);
            saveToLocalStorage(varName, Array.from(userBlackList.entries()));
        },
        function () {
            const userBlackList = new Map();
            userBlackList.set(signatureHash, accountId);
            saveToLocalStorage(varName, Array.from(userBlackList.entries()));
        }
    );
}

function getUserBlackList(blackListConsumer) {
    const varName = "userBlackList";
    if (typeof blackListConsumer !== 'function') {
        return;
    }
    getFromLocalStorage(
        varName,
        function (userBlackListEntries) {
            const userBlackList = new Map(userBlackListEntries);
            blackListConsumer(Array.from(userBlackList.keys()));
        },
        function () {
            blackListConsumer([]);
        }
    );
}

window.addEventListener('beforeunload', function () {
    try {
        const db = getActiveDb();
        if (db) {
            db.close();
        }
    } catch (error) {
    }
});
