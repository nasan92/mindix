var selfcopy;
mindmaps.SaveDocumentView = function() {
    var g = selfcopy = this;
    var c = $("#template-save").tmpl().dialog({
        autoOpen: false,
        modal: true,
        zIndex: 5000,
        width: 550,
        close: function() {
            $(this).dialog("destroy");
            $(this).remove()
        }
    });
    var j = $("#button-save-cloudstorage").button().click(function() {
        if (g.cloudStorageButtonClicked) {
            g.cloudStorageButtonClicked()
        }
    });
    var f = $("#button-save-localstorage").button().click(function() {
        if (g.localStorageButtonClicked) {
            g.localStorageButtonClicked()
        }
    });
    var b = $("#checkbox-autosave-localstorage").click(function() {
        if (g.autoSaveCheckboxClicked) {
            g.autoSaveCheckboxClicked($(this).prop("checked"))
        }
    });
    var d = $("#button-save-hdd").button().click(function() {
        if (g.hddSaveButtonClicked) {
            g.hddSaveButtonClicked()
        }
    });
    var k = $("#button-save-linked-file").button().click(function() {
        if (g.linkedFileSaveButtonClicked) {
            g.linkedFileSaveButtonClicked()
        }
    });
    this.setAutoSaveCheckboxState = function(i) {
        b.prop("checked", i)
    };
    this.showSaveDialog = function() {
        c.dialog("open")
    };
    this.hideSaveDialog = function() {
        c.dialog("close")
    };
    this.showCloudError = function(i) {
        c.find(".cloud-error").text(i)
    };
};
mindmaps.SaveDocumentPresenter = function(d, b, f, c, a) {
    f.cloudStorageButtonClicked = function() {
        mindmaps.Util.trackEvent("Clicks", "cloud-save");
        $(f).css("z-index", 1);
        a.save({
            success: function() {
                mindmaps.currentMapId = "new-import-cloud";
                window.location.hash = "m:new-import-cloud";
                mindmaps.isMapLoadingConfirmationRequired = false;
                mindmaps.ignoreHashChange = true;
                f.hideSaveDialog()
            },
            error: function(g) {
                f.showCloudError(g)
            }
        })
    };
    f.localStorageButtonClicked = function() {
        mindmaps.Util.trackEvent("Clicks", "localstorage-save");
        b.saveToLocalStorage().then(function(e) {
            if (e) {
                f.hideSaveDialog();
                mindmaps.currentMapId = "new-localstorage-offline";
                window.location.hash = "m:new-localstorage-offline";
                mindmaps.isMapLoadingConfirmationRequired = false;
                mindmaps.ignoreHashChange = true
            } else {
                d.publish(mindmaps.Event.NOTIFICATION_ERROR, "Error while saving to local storage")
            }
        })
    };
    f.autoSaveCheckboxClicked = function(g) {
        if (g) {
            c.enable()
        } else {
            c.disable()
        }
    };
    f.hddSaveButtonClicked = function() {
        mindmaps.Util.trackEvent("Clicks", "hdd-save");
        var g = b.getMindMap().getRoot().getCaption() + ".json";
        var i = b.getDocument().prepareSave().serialize();
        var e = new Blob([i], {
            type: "text/plain;charset=utf-8"
        });
        window.saveAs(e, g);
        var h = b.getDocument();
        mindmaps.currentMapId = "new-import-file";
        window.location.hash = "m:new-import-file";
        mindmaps.isMapLoadingConfirmationRequired = false;
        mindmaps.ignoreHashChange = true;
        d.publish(mindmaps.Event.DOCUMENT_SAVED, h);
        f.hideSaveDialog()
    };
    f.linkedFileSaveButtonClicked = function() {
        if (!mindmaps.LocalFileStorage) {
            d.publish(mindmaps.Event.NOTIFICATION_ERROR, "This browser does not support linked file editing.");
            return
        }
        mindmaps.Util.trackEvent("Clicks", "linked-file-save");
        if (b.getLinkedFileHandle()) {
            b.saveToLinkedFile().then(function(ok) {
                if (!ok) {
                    d.publish(mindmaps.Event.NOTIFICATION_ERROR, "Error while saving linked file")
                } else {
                    f.hideSaveDialog()
                }
            });
            return
        }
        mindmaps.LocalFileStorage.pickFileForLinkingSave().then(function(handle) {
            if (!handle) {
                return
            }
            b.setLinkedFileHandle(handle);
            return b.saveToLinkedFile().then(function(ok) {
                if (!ok) {
                    d.publish(mindmaps.Event.NOTIFICATION_ERROR, "Error while saving linked file")
                } else {
                    f.hideSaveDialog()
                }
            })
        }).catch(function(err) {
            if (err && err.name === "AbortError") {
                return
            }
            d.publish(mindmaps.Event.NOTIFICATION_ERROR, (err && err.message) || "Could not open local file picker")
        })
    };
    this.go = function() {
        f.setAutoSaveCheckboxState(c.isEnabled());
        f.showSaveDialog()
    }
};