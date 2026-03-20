mindmaps.LocalFileStorage = (function () {
    function isSecureContextAvailable() {
        return !!window.isSecureContext;
    }

    function canOpenFiles() {
        return typeof window.showOpenFilePicker === "function";
    }

    function canSaveFiles() {
        return typeof window.showSaveFilePicker === "function";
    }

    function isSupported() {
        return isSecureContextAvailable() && canOpenFiles() && canSaveFiles();
    }

    function getSupportMessageForOpen() {
        if (!isSecureContextAvailable()) {
            return "Linked files require a secure context (https:// or localhost).";
        }
        if (!canOpenFiles()) {
            return "This browser does not support opening linked local files.";
        }
        return null;
    }

    function getSupportMessageForSave() {
        if (!isSecureContextAvailable()) {
            return "Linked files require a secure context (https:// or localhost).";
        }
        if (!canSaveFiles()) {
            return "This browser does not support saving linked local files.";
        }
        return null;
    }

    function ensureWritePermission(handle) {
        if (!handle || typeof handle.queryPermission !== "function") {
            return Promise.resolve(false);
        }

        return handle.queryPermission({ mode: "readwrite" }).then(function (state) {
            if (state === "granted") {
                return true;
            }
            return handle.requestPermission({ mode: "readwrite" }).then(function (result) {
                return result === "granted";
            });
        });
    }

    return {
        isSupported: isSupported,
        canOpenFiles: canOpenFiles,
        canSaveFiles: canSaveFiles,
        getSupportMessageForOpen: getSupportMessageForOpen,
        getSupportMessageForSave: getSupportMessageForSave,

        pickFileForOpen: function () {
            var supportMessage = getSupportMessageForOpen();
            if (supportMessage) {
                return Promise.reject(new Error(supportMessage));
            }
            return window.showOpenFilePicker({
                types: [{
                    description: "Mind map JSON",
                    accept: { "application/json": [".json"] }
                }],
                multiple: false
            }).then(function (handles) {
                return handles && handles.length ? handles[0] : null;
            });
        },

        pickFileForSave: function () {
            var supportMessage = getSupportMessageForSave();
            if (supportMessage) {
                return Promise.reject(new Error(supportMessage));
            }
            return window.showSaveFilePicker({
                suggestedName: "mindmap.json",
                types: [{
                    description: "Mind map JSON",
                    accept: { "application/json": [".json"] }
                }]
            });
        },

        pickFileForLinkingSave: function () {
            if (!isSecureContextAvailable()) {
                return Promise.reject(new Error("Linked files require a secure context (https:// or localhost)."));
            }

            if (canSaveFiles()) {
                return this.pickFileForSave();
            }

            if (canOpenFiles()) {
                // Fallback for browsers exposing open picker only: user links an existing file.
                return window.showOpenFilePicker({
                    types: [{
                        description: "Mind map JSON",
                        accept: { "application/json": [".json"] }
                    }],
                    multiple: false
                }).then(function (handles) {
                    return handles && handles.length ? handles[0] : null;
                });
            }

            return Promise.reject(new Error("This browser does not support linked local file saving."));
        },

        readDocument: function (handle) {
            return handle.getFile().then(function (file) {
                return file.text();
            }).then(function (json) {
                return mindmaps.Document.fromJSON(json);
            });
        },

        writeDocument: function (handle, doc) {
            return ensureWritePermission(handle).then(function (granted) {
                if (!granted) {
                    throw new Error("Write permission denied");
                }
                return handle.createWritable();
            }).then(function (writable) {
                return writable.write(doc.serialize()).then(function () {
                    return writable.close();
                });
            });
        }
    };
})();
