var mindmapModelCopy;
mindmaps.OpenDocumentView = function() {
    var e = this;
    var t = $("#template-open").tmpl().dialog({
        autoOpen: false,
        modal: true,
        zIndex: 5e3,
        width: 550,
        close: function() {
            $(this).dialog("destroy");
            $(this).remove()
        }
    });
    var n = $("#button-open-cloud").button().click(function() {
        if (e.openCloudButtonClicked) {
            e.openCloudButtonClicked()
        }
    });
    t.find(".file-chooser input").bind("change", function(t) {
        if (e.openExernalFileClicked) {
            e.openExernalFileClicked(t)
        }
    });
    var s = t.find(".localstorage-filelist");
    s.delegate("a.title", "click", function() {
        if (e.documentClicked) {
            var t = $(this).tmplItem();
            console.log("t1 " + t);
            console.log("changing");
            mindmaps.isMapLoadingConfirmationRequired = false;
            mindmaps.ignoreHashChange = true;
            mindmaps.currentMapId = "new-localstorage-offline";
            window.location.hash = "m:new-localstorage-offline";
            e.documentClicked(t.data);
            event.preventDefault()
        }
    }).delegate("a.delete", "click", function() {
        if (e.deleteDocumentClicked) {
            var t = $(this).tmplItem();
            e.deleteDocumentClicked(t.data)
        }
        event.preventDefault()
    });
    this.render = function(e) {
        console.log(e);
        var n = $(".document-list", t).empty();
        $("#template-open-table-item").tmpl(e, {
            format: function(e) {
                if (!e) return "";
                var t = e.getDate();
                var n = e.getMonth() + 1;
                var r = e.getFullYear();
                return t + "/" + n + "/" + r
            }
        }).appendTo(n)
    };
    this.showOpenDialog = function(e) {
        this.render(e);
        t.dialog("open")
    };
    this.hideOpenDialog = function() {
        t.dialog("close")
    };
    this.showCloudError = function(e) {
        t.find(".cloud-loading").removeClass("loading");
        t.find(".cloud-error").text(e)
    };
    this.showCloudLoading = function() {
        t.find(".cloud-error").text("");
        t.find(".cloud-loading").addClass("loading")
    };
    this.hideCloudLoading = function() {
        t.find(".cloud-loading").removeClass("loading")
    }
};
mindmaps.OpenDocumentPresenter = function(e, t, n, r) {
    mindmapModelCopy = t;
    n.openCloudButtonClicked = function(e) {
        mindmaps.Util.trackEvent("Clicks", "cloud-open");
        r.open({
            load: function() {
                n.showCloudLoading()
            },
            success: function() {
                mindmaps.currentMapId = "new-import-cloud";
                window.location.hash = "m:new-import-cloud";
                mindmaps.isMapLoadingConfirmationRequired = false;
                mindmaps.ignoreHashChange = true;
                console.log("a" + mindmaps.currentMapId);
                if (n) n.hideOpenDialog()
            },
            error: function(e) {
                n.showCloudError(e)
            }
        })
    };
    n.openExernalFileClicked = function(r) {
        mindmaps.Util.trackEvent("Clicks", "hdd-open");
        var i = r.target.files;
        var s = i[0];
        var o = new FileReader;
        o.onload = function() {
            try {
                console.log(o.result);
                var r = mindmaps.Document.fromJSON(o.result)
            } catch (i) {
                e.publish(mindmaps.Event.NOTIFICATION_ERROR, "File is not a valid mind map!");
                throw new Error("Error while opening map from hdd", i)
            }
            t.setDocument(r);
            mindmaps.currentMapId = "new-import-file";
            window.location.hash = "m:new-import-file";
            mindmaps.isMapLoadingConfirmationRequired = false;
            mindmaps.ignoreHashChange = true;
            n.hideOpenDialog()
        };
        o.readAsText(s)
    };
    n.documentClicked = function(e) {
        mindmaps.Util.trackEvent("Clicks", "localstorage-open");
        t.setDocument(e);
        n.hideOpenDialog()
    };
    n.deleteDocumentClicked = function(e) {
        mindmaps.LocalDocumentStorage.deleteDocument(e);
        var t = mindmaps.LocalDocumentStorage.getDocuments();
        n.render(t)
    };
    this.go = function() {
        var e = mindmaps.LocalDocumentStorage.getDocuments();
        e.sort(mindmaps.Document.sortByModifiedDateDescending);
        n.showOpenDialog(e)
    }
}