var self;
mindmaps.ApplicationController = function() {
    function n() {
        g.getDocument();
        a();
        var n = new mindmaps.NewDocumentPresenter(c, g, new mindmaps.NewDocumentView);
        n.go()
    }

    function e() {
        if (mindmaps.isMapLoadingConfirmationRequired) $("#dialog-confirm").dialog({
            resizable: !1,
            height: 140,
            modal: !0,
            buttons: {
                Proceed: function() {
                    g.getDocument();
                    a();
                    var n = new mindmaps.NewDocumentPresenter(c, g, new mindmaps.NewDocumentView);
                    n.go(), $(this).dialog("close")
                },
                Cancel: function() {
                    $(this).dialog("close")
                }
            }
        });
        else {
            {
                g.getDocument()
            }
            a();
            var n = new mindmaps.NewDocumentPresenter(c, g, new mindmaps.NewDocumentView);
            n.go()
        }
    }

    function o() {
        var n = new mindmaps.SaveDocumentPresenter(c, g, new mindmaps.SaveDocumentView, f, w);
        n.go()
    }

    function a() {
        var n = g.getDocument();
        n && g.setDocument(null)
    }

    function m() {
        if (mindmaps.isMapLoadingConfirmationRequired) $("#dialog-confirm").dialog({
            resizable: !1,
            height: 140,
            modal: !0,
            buttons: {
                Proceed: function() {
                    var n = new mindmaps.OpenDocumentPresenter(c, g, new mindmaps.OpenDocumentView, w);
                    n.go(), $(this).dialog("close")
                },
                Cancel: function() {
                    $(this).dialog("close")
                }
            }
        });
        else {
            var n = new mindmaps.OpenDocumentPresenter(c, g, new mindmaps.OpenDocumentView, w);
            n.go()
        }
    }

    function d() {
        var n = new mindmaps.ExportMapPresenter(c, g, new mindmaps.ExportMapView);
        n.go()
    }

    function v() {
        if (mindmaps.isMapLoadingConfirmationRequired) $("#dialog-confirm").dialog({
            resizable: !1,
            height: 140,
            modal: !0,
            buttons: {
                Proceed: function() {
                    var n = new mindmaps.ImportMarkdownPresenter(c, g, new mindmaps.ImportMarkdownView);
                    n.go(), $(this).dialog("close")
                },
                Cancel: function() {
                    $(this).dialog("close")
                }
            }
        });
        else {
            var n = new mindmaps.ImportMarkdownPresenter(c, g, new mindmaps.ImportMarkdownView);
            n.go()
        }
    }
    mindmaps.connectStartNode = null, mindmaps.connectMode = !1, mindmaps.connectSelected = !1, mindmaps.connectPendingAnchor = null;
    var c = new mindmaps.EventBus,
        l = new mindmaps.ShortcutController,
        p = new mindmaps.CommandRegistry(l);
    mindmaps.ui = mindmaps.ui || {}, mindmaps.ui.commandRegistry = p;
    var u = new mindmaps.UndoController(c, p),
        g = new mindmaps.MindMapModel(c, p, u),
        h = new mindmaps.Geometry(g);
    mindmaps.ui.geometry = h;
    var f = (new mindmaps.ClipboardController(c, p, g), new mindmaps.PrintController(c, p, g), new mindmaps.AutoSaveController(c, g)),
        w = new mindmaps.FilePicker(c, g);
    self = this, mindmaps.getConnectedNodes = function() {
        return g.getDocument().getConnectedNodes()
    }, mindmaps.setConnectedNodes = function(n) {
        g.getDocument().setConnectedNodes(n)
    }, mindmaps.showErrorNotification = function(n) {
        c.publish(mindmaps.Event.NOTIFICATION_ERROR, n)
    }, mindmaps.addTwoNodes = function(n, e, o, a, t, r) {
        if (n.id == e.id) return !1;
        if (g.getDocument().getConnectedNodes().filter(function(o) {
                return o.from == n.id && o.to == e.id
            }).length > 0) return $("#node-connect-styles-row").show(), $("#inspector-button-connect-node-remove").show(), !1;
        if (g.getDocument().getConnectedNodes().filter(function(o) {
                return o.to == n.id && o.from == e.id
            }).length > 0) return $("#node-connect-styles-row").show(), $("#inspector-button-connect-node-remove").show(), !1;
        if (n.getParent() == e || e.getParent() == n) return mindmaps.connectSelected = !1, $("#node-connect-styles-row").hide(), $("#inspector-button-connect-node-remove").hide(), !1;
        if (filNodes = g.getDocument().getConnectedNodes().filter(function(e) {
                return e.from == n.id
            }), filNodes.length > 0) {
            for (newid = filNodes[0].canvasId, i = 1; i < filNodes.length; i++) newid < filNodes[i].canvasId && newid++;
            newid++
        } else newid = 1;
        var s = $("<canvas/>", {
            id: "node-connector-canvas-" + n.id + "-" + newid,
            "class": "line-canvas"
        });
        s.appendTo($("#node-" + n.id)), g.getDocument().addConnectedNode({
            from: n.id,
            to: e.id,
            canvasId: newid,
            style: o,
            shape: r && "string" == typeof r.shape ? r.shape : ("curved" == o ? "curved" : "straight"),
            color: a,
            arrow: t,
            toAnchorX: r && "number" == typeof r.toAnchorX ? r.toAnchorX : null,
            toAnchorY: r && "number" == typeof r.toAnchorY ? r.toAnchorY : null,
            fromAnchorX: r && "number" == typeof r.fromAnchorX ? r.fromAnchorX : null,
            fromAnchorY: r && "number" == typeof r.fromAnchorY ? r.fromAnchorY : null,
            curve1T: r && "number" == typeof r.curve1T ? r.curve1T : null,
            curve1N: r && "number" == typeof r.curve1N ? r.curve1N : null,
            curve2T: r && "number" == typeof r.curve2T ? r.curve2T : null,
            curve2N: r && "number" == typeof r.curve2N ? r.curve2N : null,
            curveLinked: r && "boolean" == typeof r.curveLinked ? r.curveLinked : !0
        }), $("#node-connect-styles-row").show(), $("#inspector-button-connect-node-remove").show(), console.log("connection added")
    }, this.init = function() {
        var n = p.get(mindmaps.NewDocumentCommand);
        n.setHandler(e), n.setEnabled(!0);
        var g = p.get(mindmaps.OpenDocumentCommand);
        g.setHandler(m), g.setEnabled(!0);
        var N = p.get(mindmaps.ImportMarkdownCommand);
        N.setHandler(v), N.setEnabled(!0);
        var h = p.get(mindmaps.SaveDocumentCommand);
        h.setHandler(o);
        var f = p.get(mindmaps.CloseDocumentCommand);
        f.setHandler(a);
        var w = p.get(mindmaps.ExportCommand);
        w.setHandler(d), c.subscribe(mindmaps.Event.DOCUMENT_CLOSED, function() {
            h.setEnabled(!1), f.setEnabled(!1), w.setEnabled(!1), mindmaps.isMapLoadingConfirmationRequired = !1
        }), c.subscribe(mindmaps.Event.DOCUMENT_OPENED, function() {
            h.setEnabled(!0), f.setEnabled(!0), w.setEnabled(!0), mindmaps.isMapLoadingConfirmationRequired = !1
        })
    }, this.go = function() {
        var e = new mindmaps.MainViewController(c, g, p);
        e.go(), _.chain(mindmaps.plugins).sortBy("startOrder").each(function(n) {
            n.onUIInit(c, g)
        }), n()
    }, this.init(), c.subscribe(mindmaps.Event.DOCUMENT_SAVED, function() {
        mindmaps.isMapLoadingConfirmationRequired = !1
    })
};