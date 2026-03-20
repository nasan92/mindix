mindmaps.LocalStorage = (function () {
    return {
        put: function (key, value) {
            localStorage.setItem(key, value);
        },
        get: function (key) {
            return localStorage.getItem(key);
        },
        clear: function () {
            localStorage.clear();
        }
    };
})();

mindmaps.SessionStorage = (function () {
    return {
        put: function (key, value) {
            sessionStorage.setItem(key, value);
        },
        get: function (key) {
            return sessionStorage.getItem(key);
        },
        clear: function () {
            sessionStorage.clear();
        }
    };
})();

/**
 * @namespace
 */
mindmaps.LocalDocumentStorage = (function () {
    var prefix = "mindmaps.document.";
    var dbName = "mindmaps-db";
    var storeName = "documents";
    var dbVersion = 1;
    var dbPromise = null;

    function parseDocument(json) {
        if (json === null || json === undefined) {
            return null;
        }
        try {
            return mindmaps.Document.fromJSON(json);
        } catch (error) {
            console.error("Error while parsing document", error);
            return null;
        }
    }

    function hasIndexedDb() {
        return typeof window.indexedDB !== "undefined";
    }

    function openDb() {
        if (!hasIndexedDb()) {
            return Promise.resolve(null);
        }
        if (dbPromise) {
            return dbPromise;
        }

        dbPromise = new Promise(function (resolve, reject) {
            var request = indexedDB.open(dbName, dbVersion);

            request.onupgradeneeded = function (event) {
                var db = event.target.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: "id" });
                }
            };

            request.onsuccess = function () {
                resolve(request.result);
            };

            request.onerror = function () {
                reject(request.error);
            };
        }).catch(function (error) {
            console.warn("IndexedDB unavailable, falling back to localStorage", error);
            dbPromise = Promise.resolve(null);
            return null;
        });

        return dbPromise;
    }

    function runObjectStore(mode, operation) {
        return openDb().then(function (db) {
            if (!db) {
                return operation(null);
            }

            return new Promise(function (resolve, reject) {
                var transaction = db.transaction(storeName, mode);
                var store = transaction.objectStore(storeName);
                var req = operation(store);

                if (req && typeof req.onsuccess !== "undefined") {
                    req.onsuccess = function () {
                        resolve(req.result);
                    };
                    req.onerror = function () {
                        reject(req.error);
                    };
                } else {
                    resolve(req);
                }

                transaction.onerror = function () {
                    reject(transaction.error);
                };
            });
        });
    }

    function fallbackGetById(docId) {
        return parseDocument(localStorage.getItem(prefix + docId));
    }

    function fallbackGetAll() {
        var documents = [];
        for (var i = 0, max = localStorage.length; i < max; i++) {
            var key = localStorage.key(i);
            if (key.indexOf(prefix) === 0) {
                var doc = parseDocument(localStorage.getItem(key));
                if (doc) {
                    documents.push(doc);
                }
            }
        }
        return documents;
    }

    function fallbackDeleteById(docId) {
        localStorage.removeItem(prefix + docId);
    }

    function fallbackSaveDocument(doc) {
        localStorage.setItem(prefix + doc.id, doc.serialize());
        return true;
    }

    function fallbackCount() {
        var count = 0;
        for (var i = 0, max = localStorage.length; i < max; i++) {
            var key = localStorage.key(i);
            if (key.indexOf(prefix) === 0) {
                count++;
            }
        }
        return count;
    }

    /**
     * Public API
     * @scope mindmaps.LocalDocumentStorage
     */
    return {
        /**
         * Saves a document to the localstorage. Overwrites the old document if
         * one with the same id exists.
         *
         * @param {mindmaps.Document} doc
         *
         * @returns {Boolean} true if save was successful, false otherwise.
         */
        saveDocument: function (doc) {
            var serialized = doc.serialize();
            return runObjectStore("readwrite", function (store) {
                if (!store) {
                    return fallbackSaveDocument(doc);
                }
                return store.put({
                    id: doc.id,
                    data: serialized,
                    modifiedAt: Date.now()
                });
            }).then(function () {
                return true;
            }).catch(function (error) {
                console.warn("Could not save in IndexedDB, falling back to localStorage", error);
                return fallbackSaveDocument(doc);
            });
        },

        /**
         * Loads a document from the local storage.
         *
         * @param {String} docId
         *
         * @returns {mindmaps.Document} the document or null if not found.
         */
        loadDocument: function (docId) {
            return runObjectStore("readonly", function (store) {
                if (!store) {
                    return fallbackGetById(docId);
                }
                return store.get(docId);
            }).then(function (result) {
                if (!result) {
                    return fallbackGetById(docId);
                }
                return parseDocument(result.data);
            }).catch(function () {
                return fallbackGetById(docId);
            });
        },

        /**
         * Finds all documents in the local storage object.
         *
         * @returns {Array} an Array of documents
         */
        getDocuments: function () {
            return runObjectStore("readonly", function (store) {
                if (!store) {
                    return fallbackGetAll();
                }
                return store.getAll();
            }).then(function (rows) {
                if (!rows || !rows.length) {
                    return fallbackGetAll();
                }
                var documents = [];
                rows.forEach(function (row) {
                    var doc = parseDocument(row.data);
                    if (doc) {
                        documents.push(doc);
                    }
                });
                return documents;
            }).catch(function () {
                return fallbackGetAll();
            });
        },

        /**
         * Gets all document ids found in the local storage object.
         *
         * @returns {Array} an Array of document ids
         */
        getDocumentIds: function () {
            return this.getDocuments().then(function (documents) {
                return documents.map(function (doc) {
                    return doc.id;
                });
            });
        },

        /**
         * Deletes a document from the local storage.
         *
         * @param {mindmaps.Document} doc
         */
        deleteDocument: function (doc) {
            return runObjectStore("readwrite", function (store) {
                if (!store) {
                    fallbackDeleteById(doc.id);
                    return true;
                }
                return store.delete(doc.id);
            }).then(function () {
                fallbackDeleteById(doc.id);
                return true;
            }).catch(function () {
                fallbackDeleteById(doc.id);
                return true;
            });
        },

        /**
         * Deletes all documents from the local storage.
         */
        deleteAllDocuments: function () {
            var self = this;
            return this.getDocuments().then(function (documents) {
                return Promise.all(documents.map(function (doc) {
                    return self.deleteDocument(doc);
                }));
            });
        },

        getBackendDiagnostics: function () {
            return openDb().then(function (db) {
                var indexedDbAvailable = !!db;
                var localStorageDocuments = fallbackCount();

                if (!indexedDbAvailable) {
                    return {
                        indexedDbAvailable: false,
                        usingIndexedDb: false,
                        indexedDbDocuments: 0,
                        localStorageDocuments: localStorageDocuments,
                        activeBackend: "localStorage"
                    };
                }

                return runObjectStore("readonly", function (store) {
                    return store.getAll();
                }).then(function (rows) {
                    var indexedDbDocuments = rows ? rows.length : 0;
                    return {
                        indexedDbAvailable: true,
                        usingIndexedDb: true,
                        indexedDbDocuments: indexedDbDocuments,
                        localStorageDocuments: localStorageDocuments,
                        activeBackend: "indexedDB"
                    };
                });
            }).catch(function () {
                return {
                    indexedDbAvailable: false,
                    usingIndexedDb: false,
                    indexedDbDocuments: 0,
                    localStorageDocuments: fallbackCount(),
                    activeBackend: "localStorage"
                };
            });
        }
    };
})();
