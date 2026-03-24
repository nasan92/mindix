function getNodeFromId(n, t) {
    var o = null;
    return n.id == t && (o = n), o || n.forEachChild(function(n) {
        null !== (r = getNodeFromId(n, t)) && (o = r)
    }), o
}
mindmaps.action = {}, mindmaps.action.Action = function() {}, mindmaps.action.Action.prototype = {
    noUndo: function() {
        return delete this.undo, delete this.redo, this
    },
    noEvent: function() {
        return delete this.event, this
    },
    execute: function() {},
    cancel: function() {
        this.cancelled = !0
    }
}, mindmaps.action.MoveNodeAction = function(n, t) {
    var o = n.getPluginData("layout", "offset");
    this.execute = function() {
        n.setPluginData("layout", "offset", t), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_MOVED, n], this.undo = function() {
        return new mindmaps.action.MoveNodeAction(n, o)
    }
}, mindmaps.action.MoveNodeAction.prototype = new mindmaps.action.Action, mindmaps.action.DeleteNodeAction = function(n, t) {
    var o = n.getParent();
    this.execute = function() {
        return n.isRoot() ? !1 : (t.removeNode(n), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_DELETED, n, o], this.undo = function() {
        return new mindmaps.action.CreateNodeAction(n, o, t)
    }
}, mindmaps.action.DeleteNodeAction.prototype = new mindmaps.action.Action, mindmaps.action.CreateAutoPositionedNodeAction = function(n, t) {
    if (n.isRoot()) var o = mindmaps.Util.getNextRootBranchColor(n),
        i = Math.random() > .49 ? 1 : -1,
        e = Math.random() > .49 ? 1 : -1,
        a = i * (100 + 250 * Math.random()),
        c = 250 * e * Math.random();
    else var o = n.getPluginData("style", "branchColor"),
        i = n.getPluginData("layout", "offset").x > 0 ? 1 : -1,
        d = mindmaps.ui.geometry.newChildPosition(n),
        a = Math.abs(d.x) * i,
        c = d.y;
    var m = new mindmaps.Node;
    return m.setPluginData("style", "branchColor", o), m.shouldEditCaption = !0, m.setPluginData("layout", "offset", new mindmaps.Point(a, c)), new mindmaps.action.CreateNodeAction(m, n, t)
}, mindmaps.action.CreateNodeAction = function(n, t, o) {
    this.execute = function() {
        o.addNode(n), t.addChild(n), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_CREATED, n], this.undo = function() {
        return new mindmaps.action.DeleteNodeAction(n, o)
    }
}, mindmaps.action.CreateNodeAction.prototype = new mindmaps.action.Action, mindmaps.action.ToggleNodeFoldAction = function(n) {
    return n.getPluginData("layout", "foldChildren") ? new mindmaps.action.OpenNodeAction(n) : new mindmaps.action.CloseNodeAction(n)
}, mindmaps.action.OpenNodeAction = function(n) {
    this.execute = function() {
        n.setPluginData("layout", "foldChildren", !1)
    }, this.event = [mindmaps.Event.NODE_OPENED, n]
}, mindmaps.action.OpenNodeAction.prototype = new mindmaps.action.Action, mindmaps.action.CloseNodeAction = function(n) {
    this.execute = function() {
        n.setPluginData("layout", "foldChildren", !0)
    }, this.event = [mindmaps.Event.NODE_CLOSED, n]
}, mindmaps.action.CloseNodeAction.prototype = new mindmaps.action.Action, mindmaps.action.ChangeNodeCaptionAction = function(n, t) {
    var o = n.getCaption();
    this.execute = function() {
        return o === t ? !1 : (n.setCaption(t), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_TEXT_CAPTION_CHANGED, n], this.undo = function() {
        return new mindmaps.action.ChangeNodeCaptionAction(n, o)
    }
}, mindmaps.action.ChangeNodeCaptionAction.prototype = new mindmaps.action.Action, mindmaps.action.ChangeNodeBorderStyleAction = function(n, t) {
    var o = n.getPluginData("style", "border") || {
            visible: !1,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        },
        i = o.style;
    this.execute = function() {
        return t === o.style ? !1 : (o.style = t, o.visible = "none" !== t, n.setPluginData("style", "border", o), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_BORDER_CHANGED, n], this.undo = function() {
        return new mindmaps.action.ChangeNodeBorderStyleAction(n, i)
    }
}, mindmaps.action.ChangeNodeBorderStyleAction.prototype = new mindmaps.action.Action, mindmaps.action.ChangeNodeFontFaceAction = function(n, t) {
    var o = n.getPluginData("style", "font"),
        i = o.fontfamily;
    this.execute = function() {
        return o.fontfamily === t ? !1 : (o.fontfamily = t, n.setPluginData("style", "font", o), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_FONT_CHANGED, n], this.undo = function() {
        return new mindmaps.action.ChangeNodeFontFaceAction(n, i)
    }
}, mindmaps.action.ChangeNodeFontFaceAction.prototype = new mindmaps.action.Action, mindmaps.action.ChangeNodeFontSizeAction = function(n, t) {
    this.execute = function() {
        var o = n.getPluginData("style", "font");
        o.size = o.size + t, n.setPluginData("style", "font", o), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_FONT_CHANGED, n], this.undo = function() {
        return new mindmaps.action.ChangeNodeFontSizeAction(n, -t)
    }
}, mindmaps.action.ChangeNodeFontSizeAction.prototype = new mindmaps.action.Action, mindmaps.action.SetNodeFontSizeAction = function(n, t) {
    var o = n.getPluginData("style", "font"),
        i = o.size;
    this.execute = function() {
        if (t === o.size) return !1;
        o.size = t, n.setPluginData("style", "font", o), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_FONT_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetNodeFontSizeAction(n, i)
    }
}, mindmaps.action.SetNodeFontSizeAction.prototype = new mindmaps.action.Action, mindmaps.action.DecreaseNodeFontSizeAction = function(n) {
    return new mindmaps.action.ChangeNodeFontSizeAction(n, -4)
}, mindmaps.action.IncreaseNodeFontSizeAction = function(n) {
    return new mindmaps.action.ChangeNodeFontSizeAction(n, 4)
}, mindmaps.action.ChangeNodeLineWidthAction = function(n, t) {
    this.execute = function() {
        var o = n.getPluginData("style", "lineWidthOffset");
        n.setPluginData("style", "lineWidthOffset", o + t), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_LINE_WIDTH_CHANGED, n], this.undo = function() {
        return new mindmaps.action.ChangeNodeLineWidthAction(n, -t)
    }
}, mindmaps.action.ChangeNodeLineWidthAction.prototype = new mindmaps.action.Action, mindmaps.action.DecreaseNodeLineWidthAction = function(n) {
    return new mindmaps.action.ChangeNodeLineWidthAction(n, -2)
}, mindmaps.action.IncreaseNodeLineWidthAction = function(n) {
    return new mindmaps.action.ChangeNodeLineWidthAction(n, 2)
}, mindmaps.action.ToggleBorderButtonAction = function(n) {
    this.execute = function() {
        var t = n.getPluginData("style", "border") || {
            visible: !1,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        };
        "none" === t.style ? (t.style = "dashed", t.visible = !0) : (t.style = "none", t.visible = !1), n.setPluginData("style", "border", t), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_BORDER_CHANGED, n], this.undo = function() {
        return new mindmaps.action.ToggleBorderButtonAction(n)
    }
}, mindmaps.action.ToggleBorderButtonAction.prototype = new mindmaps.action.Action, mindmaps.action.SetFontWeightAction = function(n, t) {
    this.execute = function() {
        var o = n.getPluginData("style", "font"),
            i = t ? "bold" : "normal";
        o.weight = i, n.setPluginData("style", "font", o), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_FONT_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetFontWeightAction(n, !t)
    }
}, mindmaps.action.SetFontWeightAction.prototype = new mindmaps.action.Action, mindmaps.action.SetFontStyleAction = function(n, t) {
    this.execute = function() {
        var o = n.getPluginData("style", "font"),
            i = t ? "italic" : "normal";
        o.style = i, n.setPluginData("style", "font", o), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_FONT_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetFontStyleAction(n, !t)
    }
}, mindmaps.action.SetFontStyleAction.prototype = new mindmaps.action.Action, mindmaps.action.SetFontDecorationAction = function(n, t) {
    var o = n.getPluginData("style", "font"),
        i = o.decoration;
    this.execute = function() {
        o.decoration = t, n.setPluginData("style", "font", o), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.NODE_FONT_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetFontDecorationAction(n, i)
    }
}, mindmaps.action.SetFontDecorationAction.prototype = new mindmaps.action.Action, mindmaps.action.SetBorderBackgroundColorAction = function(n, t) {
    var o = n.getPluginData("style", "border") || {
            visible: !1,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        },
        i = o.background;
    this.execute = function() {
        return t === o.background ? !1 : (o.background = t, n.setPluginData("style", "border", o), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_BORDER_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetBorderBackgroundColorAction(n, i)
    }
}, mindmaps.action.SetBorderBackgroundColorAction.prototype = new mindmaps.action.Action, mindmaps.action.SetBorderColorAction = function(n, t) {
    var o = n.getPluginData("style", "border") || {
            visible: !1,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        },
        i = o.color;
    this.execute = function() {
        return t === o.color ? !1 : (o.color = t, n.setPluginData("style", "border", o), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_BORDER_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetBorderColorAction(n, i)
    }
}, mindmaps.action.SetBorderColorAction.prototype = new mindmaps.action.Action, mindmaps.action.SetConnectColorAction = function(n, t, o) {
    var i = mindmaps.getConnectedNodes().filter(function(o) {
        return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
    });
    if (i.length) var e = i[0].color;
    this.execute = function() {
        var i = mindmaps.getConnectedNodes().filter(function(o) {
            return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
        });
        if (!i.length) return !1;
        if (i[0].color == o) return !1;
        i[0].color = o;
        var e = mindmaps.getConnectedNodes().filter(function(o) {
            return !(o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id)
        });
        e.push(i[0]), mindmaps.setConnectedNodes(e), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.CONNECTION_COLOR_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetConnectColorAction(n, t, e)
    }
}, mindmaps.action.SetConnectColorAction.prototype = new mindmaps.action.Action, mindmaps.action.SetConnectArrowAction = function(n, t, o) {
    var i = mindmaps.getConnectedNodes().filter(function(o) {
        return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
    });
    if (i.length) var e = i[0].arrow;
    this.execute = function() {
        var i = mindmaps.getConnectedNodes().filter(function(o) {
            return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
        });
        if (!i.length) return !1;
        if (i[0].arrow == o) return !1;
        i[0].arrow = o;
        var e = mindmaps.getConnectedNodes().filter(function(o) {
            return !(o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id)
        });
        e.push(i[0]), mindmaps.setConnectedNodes(e), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.CONNECTION_COLOR_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetConnectArrowAction(n, t, e)
    }
}, mindmaps.action.SetConnectArrowAction.prototype = new mindmaps.action.Action, mindmaps.action.SetConnectStyleAction = function(n, t, o) {
    var i = mindmaps.getConnectedNodes().filter(function(o) {
        return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
    });
    if (i.length) var e = i[0].style;
    this.execute = function() {
        var i = mindmaps.getConnectedNodes().filter(function(o) {
            return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
        });
        if (!i.length) return !1;
        if ("curved" == o) o = "dashed";
        if (i[0].style == o) return !1;
        i[0].style = o;
        var e = mindmaps.getConnectedNodes().filter(function(o) {
            return !(o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id)
        });
        e.push(i[0]), mindmaps.setConnectedNodes(e), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.CONNECTION_COLOR_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetConnectStyleAction(n, t, e)
    }
}, mindmaps.action.SetConnectStyleAction.prototype = new mindmaps.action.Action, mindmaps.action.SetConnectShapeAction = function(n, t, o) {
    var i = mindmaps.getConnectedNodes().filter(function(o) {
        return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
    });
    var e = "straight";
    if (i.length) {
        e = i[0].shape || ("curved" == i[0].style ? "curved" : "straight")
    }
    this.execute = function() {
        var i = mindmaps.getConnectedNodes().filter(function(o) {
            return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
        });
        if (!i.length) return !1;
        var r = "curved" === o ? "curved" : "straight";
        var c = i[0].shape || ("curved" == i[0].style ? "curved" : "straight");
        if (c == r) return !1;
        i[0].shape = r;
        i[0].curveLinked = !1 !== i[0].curveLinked;
        if ("curved" == i[0].style) {
            i[0].style = "dashed"
        }
        if ("curved" == r) {
            if (!("number" == typeof i[0].curve1T)) i[0].curve1T = .28;
            if (!("number" == typeof i[0].curve1N)) i[0].curve1N = .22;
            if (!("number" == typeof i[0].curve2T)) i[0].curve2T = .72;
            if (!("number" == typeof i[0].curve2N)) i[0].curve2N = -.22
        }
        var h = mindmaps.getConnectedNodes().filter(function(o) {
            return !(o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id)
        });
        h.push(i[0]), mindmaps.setConnectedNodes(h), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.CONNECTION_COLOR_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetConnectShapeAction(n, t, e)
    }
}, mindmaps.action.SetConnectShapeAction.prototype = new mindmaps.action.Action, mindmaps.action.SetConnectAnchorAction = function(n, t, anchor) {
    var r = mindmaps.getConnectedNodes().filter(function(o) {
        return o.from == n.id && o.to == t.id || o.from == t.id && o.to == n.id
    });
    var c = {
        toAnchorX: null,
        toAnchorY: null,
        fromAnchorX: null,
        fromAnchorY: null,
        curve1T: null,
        curve1N: null,
        curve2T: null,
        curve2N: null
    };
    if (r.length) {
        c.toAnchorX = "number" == typeof r[0].toAnchorX ? r[0].toAnchorX : null;
        c.toAnchorY = "number" == typeof r[0].toAnchorY ? r[0].toAnchorY : null;
        c.fromAnchorX = "number" == typeof r[0].fromAnchorX ? r[0].fromAnchorX : null;
        c.fromAnchorY = "number" == typeof r[0].fromAnchorY ? r[0].fromAnchorY : null;
        c.curve1T = "number" == typeof r[0].curve1T ? r[0].curve1T : null;
        c.curve1N = "number" == typeof r[0].curve1N ? r[0].curve1N : null;
        c.curve2T = "number" == typeof r[0].curve2T ? r[0].curve2T : null;
        c.curve2N = "number" == typeof r[0].curve2N ? r[0].curve2N : null
    }
    this.execute = function() {
        var r = mindmaps.getConnectedNodes().filter(function(o) {
            return o.from == n.id && o.to == t.id || o.from == t.id && o.to == n.id
        });
        if (!r.length) return !1;
        var u = anchor || {};
        if ("toAnchorX" in u || "toAnchorY" in u) {
            r[0].toAnchorX = ("number" == typeof u.toAnchorX && isFinite(u.toAnchorX)) ? u.toAnchorX : null;
            r[0].toAnchorY = ("number" == typeof u.toAnchorY && isFinite(u.toAnchorY)) ? u.toAnchorY : null
        }
        if ("fromAnchorX" in u || "fromAnchorY" in u) {
            r[0].fromAnchorX = ("number" == typeof u.fromAnchorX && isFinite(u.fromAnchorX)) ? u.fromAnchorX : null;
            r[0].fromAnchorY = ("number" == typeof u.fromAnchorY && isFinite(u.fromAnchorY)) ? u.fromAnchorY : null
        }
        if ("curve1T" in u || "curve1N" in u) {
            r[0].curve1T = ("number" == typeof u.curve1T && isFinite(u.curve1T)) ? u.curve1T : null;
            r[0].curve1N = ("number" == typeof u.curve1N && isFinite(u.curve1N)) ? u.curve1N : null
        }
        if ("curve2T" in u || "curve2N" in u) {
            r[0].curve2T = ("number" == typeof u.curve2T && isFinite(u.curve2T)) ? u.curve2T : null;
            r[0].curve2N = ("number" == typeof u.curve2N && isFinite(u.curve2N)) ? u.curve2N : null
        }
        var f = mindmaps.getConnectedNodes().filter(function(o) {
            return !(o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id)
        });
        f.push(r[0]), mindmaps.setConnectedNodes(f), mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.CONNECTION_COLOR_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetConnectAnchorAction(n, t, c)
    }
}, mindmaps.action.SetConnectAnchorAction.prototype = new mindmaps.action.Action, mindmaps.action.ConnectTwoNodesAction = function(n, t, o, i, e, r) {
    this.execute = function() {
        return console.log(n.id + " to " + t.id), console.log("ConnectTwoNodesAction "), mindmaps.addTwoNodes(n, t, o, i, e, r)
    }, this.event = [mindmaps.Event.TWO_NODES_CONNECTED, n, t], this.undo = function() {
        return new mindmaps.action.ConnectNodeRemoveClickAction(n, t)
    }
}, mindmaps.action.ConnectTwoNodesAction.prototype = new mindmaps.action.Action, mindmaps.action.ConnectNodeRemoveClickAction = function(n, t) {
    this.execute = function() {
        console.log("ConnectNodeRemoveClickAction " + n.id + " to " + t.id);
        var o = mindmaps.getConnectedNodes().filter(function(o) {
            return o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id
        });
        if (!o.length) return !1;
        cfnode = o[0];
        var i = mindmaps.getConnectedNodes().filter(function(o) {
            return !(o.from == t.id && o.to == n.id || o.from == n.id && o.to == t.id)
        });
        $("#node-" + cfnode.from).length && $("#node-connector-canvas-" + cfnode.from + "-" + cfnode.canvasId).length && ($("#node-connector-canvas-" + cfnode.from + "-" + cfnode.canvasId).remove(), console.log("removed canvas")), mindmaps.setConnectedNodes(i), mindmaps.isMapLoadingConfirmationRequired = !0, $("#node-connect-styles-row").hide(), $("#inspector-button-connect-node-remove").hide()
    }, this.event = [mindmaps.Event.TWO_NODES_DISCONNECTED, n, t], this.undo = function() {
        return new mindmaps.action.ConnectTwoNodesAction(n, t, cfnode.style, cfnode.color, cfnode.arrow, {
            shape: "string" == typeof cfnode.shape ? cfnode.shape : ("curved" == cfnode.style ? "curved" : "straight"),
            toAnchorX: "number" == typeof cfnode.toAnchorX ? cfnode.toAnchorX : null,
            toAnchorY: "number" == typeof cfnode.toAnchorY ? cfnode.toAnchorY : null,
            fromAnchorX: "number" == typeof cfnode.fromAnchorX ? cfnode.fromAnchorX : null,
            fromAnchorY: "number" == typeof cfnode.fromAnchorY ? cfnode.fromAnchorY : null,
            curve1T: "number" == typeof cfnode.curve1T ? cfnode.curve1T : null,
            curve1N: "number" == typeof cfnode.curve1N ? cfnode.curve1N : null,
            curve2T: "number" == typeof cfnode.curve2T ? cfnode.curve2T : null,
            curve2N: "number" == typeof cfnode.curve2N ? cfnode.curve2N : null,
            curveLinked: !1 !== cfnode.curveLinked
        })
    }
}, mindmaps.action.ConnectNodeRemoveClickAction.prototype = new mindmaps.action.Action, mindmaps.action.SetFontColorAction = function(n, t) {
    var o = n.getPluginData("style", "font"),
        i = o.color;
    this.execute = function() {
        return t === o.color ? !1 : (o.color = t, n.setPluginData("style", "font", o), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_FONT_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetFontColorAction(n, i)
    }
}, mindmaps.action.SetFontColorAction.prototype = new mindmaps.action.Action, mindmaps.action.SetBranchColorAction = function(n, t) {
    console.log("SetBranchColorAction i");
    var o = n.getPluginData("style", "branchColor");
    this.execute = function() {
        return console.log("SetBranchColorAction ii"), t === o ? !1 : (n.setPluginData("style", "branchColor", t), void(mindmaps.isMapLoadingConfirmationRequired = !0))
    }, this.event = [mindmaps.Event.NODE_BRANCH_COLOR_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetBranchColorAction(n, o)
    }
}, mindmaps.action.SetBranchColorAction.prototype = new mindmaps.action.Action, mindmaps.action.CompositeAction = function() {
    this.actions = []
}, mindmaps.action.CompositeAction.prototype.addAction = function(n) {
    this.actions.push(n)
}, mindmaps.action.CompositeAction.prototype.forEachAction = function(n) {
    this.actions.forEach(n)
}, mindmaps.action.ConnectNodeClickAction = function(n, t) {
    console.log("ConnectNodeClickAction"), this.execute = function() {
        0 == t ? mindmaps.connectMode = !1 : mindmaps.connectMode && mindmaps.connectStartNode == n ? mindmaps.connectMode = !1 : (mindmaps.connectStartNode = n, mindmaps.connectMode = !0, console.log("connect start node " + mindmaps.connectStartNode.getCaption()))
    }, this.event = [mindmaps.Event.CONNECT_BUTTON_CLICKED, n], this.undo = function() {
        return new mindmaps.action.ConnectNodeClickAction(n, !1)
    }
}, mindmaps.action.ConnectNodeClickAction.prototype = new mindmaps.action.Action, mindmaps.action.SetChildrenBranchColorAction = function(n) {
    mindmaps.action.CompositeAction.call(this);
    var t = n.getPluginData("style", "branchColor"),
        o = this;
    n.forEachDescendant(function(n) {
        o.addAction(new mindmaps.action.SetBranchColorAction(n, t))
    })
}, mindmaps.action.SetChildrenBranchColorAction.prototype = new mindmaps.action.CompositeAction, mindmaps.action.SetChildrenBackgroundColorAction = function(n) {
    mindmaps.action.CompositeAction.call(this);
    var t = n.getPluginData("style", "border") || {
            visible: !1,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        },
        o = this;
    n.forEachDescendant(function(n) {
        o.addAction(new mindmaps.action.SetBorderBackgroundColorAction(n, t.background))
    })
}, mindmaps.action.SetChildrenBackgroundColorAction.prototype = new mindmaps.action.CompositeAction, mindmaps.action.SetChildrenFontColorAction = function(n) {
    mindmaps.action.CompositeAction.call(this);
    var t = n.getPluginData("style", "font"),
        o = this;
    n.forEachDescendant(function(n) {
        o.addAction(new mindmaps.action.SetFontColorAction(n, t.color))
    })
}, mindmaps.action.SetChildrenFontColorAction.prototype = new mindmaps.action.CompositeAction, mindmaps.action.SetChildrenFontStyleAction = function(n) {
    mindmaps.action.CompositeAction.call(this);
    var t = n.getPluginData("style", "font"),
        o = this;
    n.forEachDescendant(function(n) {
        o.addAction(new mindmaps.action.SetFontWeightAction(n, "bold" === t.weight)), o.addAction(new mindmaps.action.SetFontStyleAction(n, "italic" === t.style)), o.addAction(new mindmaps.action.SetFontDecorationAction(n, t.decoration))
    })
}, mindmaps.action.SetChildrenFontStyleAction.prototype = new mindmaps.action.CompositeAction, mindmaps.action.SetChildrenFontFaceAction = function(n) {
    mindmaps.action.CompositeAction.call(this);
    var t = n.getPluginData("style", "font"),
        o = this;
    n.forEachDescendant(function(n) {
        o.addAction(new mindmaps.action.ChangeNodeFontFaceAction(n, t.fontfamily))
    })
}, mindmaps.action.SetChildrenFontFaceAction.prototype = new mindmaps.action.CompositeAction, mindmaps.action.SetChildrenBorderColorAction = function(n) {
    mindmaps.action.CompositeAction.call(this);
    var t = n.getPluginData("style", "border") || {
            visible: !1,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        },
        o = this;
    n.forEachDescendant(function(n) {
        o.addAction(new mindmaps.action.SetBorderColorAction(n, t.color))
    })
}, mindmaps.action.SetChildrenBorderColorAction.prototype = new mindmaps.action.CompositeAction, mindmaps.action.SetChildrenBorderStyleAction = function(n) {
    mindmaps.action.CompositeAction.call(this);
    var t = n.getPluginData("style", "border") || {
            visible: !1,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        },
        o = this;
    n.forEachDescendant(function(n) {
        o.addAction(new mindmaps.action.ChangeNodeBorderStyleAction(n, t.style))
    })
}, mindmaps.action.SetChildrenBorderStyleAction.prototype = new mindmaps.action.CompositeAction;
mindmaps.action.SetMapGridEnabledAction = function(n, t) {
    var o = n.getPluginData("canvas", "background") || {
            gridEnabled: !1,
            color: "#ffffff"
        },
        i = !!o.gridEnabled;
    this.execute = function() {
        var e = n.getPluginData("canvas", "background") || {
            gridEnabled: !1,
            color: "#ffffff"
        };
        if (!!e.gridEnabled === !!t) {
            return !1
        }
        e.gridEnabled = !!t;
        n.setPluginData("canvas", "background", e);
        mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.MAP_BACKGROUND_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetMapGridEnabledAction(n, i)
    }
}, mindmaps.action.SetMapGridEnabledAction.prototype = new mindmaps.action.Action;
mindmaps.action.SetMapBackgroundColorAction = function(n, t) {
    var o = n.getPluginData("canvas", "background") || {
            gridEnabled: !1,
            color: "#ffffff"
        },
        i = o.color || "#ffffff";
    this.execute = function() {
        var e = n.getPluginData("canvas", "background") || {
            gridEnabled: !1,
            color: "#ffffff"
        };
        if ((e.color || "#ffffff") === t) {
            return !1
        }
        e.color = t;
        n.setPluginData("canvas", "background", e);
        mindmaps.isMapLoadingConfirmationRequired = !0
    }, this.event = [mindmaps.Event.MAP_BACKGROUND_CHANGED, n], this.undo = function() {
        return new mindmaps.action.SetMapBackgroundColorAction(n, i)
    }
}, mindmaps.action.SetMapBackgroundColorAction.prototype = new mindmaps.action.Action;