mindmaps.CanvasPresenter = function(e, n, o, t, i) {
    function g(e) {
        return e ? {
            data: e.data,
            width: String(e.width),
            height: String(e.height),
            align: e.align
        } : null
    }

    function y(e, n) {
        return JSON.stringify(g(e)) === JSON.stringify(g(n))
    }

    function m(e, n, r) {
        n = g(n);
        r = g(r);
        return {
            execute: function() {
                if (y(e.getPluginData("image", "data"), r)) {
                    return false
                }
                e.setPluginData("image", "data", r)
            },
            event: [mindmaps.Event.NODE_IMAGE_CHANGED, e],
            undo: function() {
                return m(e, r, n)
            }
        }
    }

    function l(e) {
        var n = e && e.mindmap && e.mindmap.root ? e.mindmap.root.getPluginData("canvas", "background") : null;
        return {
            gridEnabled: !!(n && n.gridEnabled),
            color: n && n.color ? n.color : "#ffffff"
        }
    }

    function d(e) {
        t.setZoomFactor(i.DEFAULT_ZOOM);
        var n = e.dimensions;
        t.setDimensions(n.x, n.y);
        var d = e.mindmap;
        t.drawMap(d), t.applyMapBackgroundStyle(l(e)), t.center(), o.selectNode(d.root), t.updateNode(d.root), d.root.forEachDescendant(function(e) {
            t.updateNode(e)
        })
    }

    function a() {
        function n(e) {
            var t = o.getDocument().getConnectedNodes().filter(function(n) {
                    return n.from != e.id && n.to != e.id
                }),
                i = o.getDocument().getConnectedNodes().filter(function(n) {
                    return n.from == e.id || n.to == e.id
                });
            i.forEach(function(e) {
                $("#node-" + e.from).length && $("#node-connector-canvas-" + e.from + "-" + e.canvasId).length && ($("#node-connector-canvas-" + e.from + "-" + e.canvasId).remove(), console.log("removed canvas"))
            }), o.getDocument().setConnectedNodes(t), e.forEachChild(function(e) {
                n(e)
            })
        }

        function i(e) {
            var n = o.getDocument().getConnectedNodes().filter(function(n) {
                return n.from == e.id || n.to == e.id
            });
            n.forEach(function(e) {
                $("#node-connector-canvas-" + e.from + "-" + e.canvasId).length && ($("#node-connector-canvas-" + e.from + "-" + e.canvasId).css("opacity", 1), console.log("show"))
            }), e.forEachChild(function(e) {
                i(e)
            })
        }

        function a(e) {
            var n = o.getDocument().getConnectedNodes().filter(function(n) {
                return n.from == e.id || n.to == e.id
            });
            n.forEach(function(e) {
                $("#node-connector-canvas-" + e.from + "-" + e.canvasId).length && $("#node-connector-canvas-" + e.from + "-" + e.canvasId).css("opacity", 0)
            }), e.forEachChild(function(e) {
                a(e)
            })
        }
        e.subscribe(mindmaps.Event.DOCUMENT_OPENED, function(e) {
            d(e)
        }), e.subscribe(mindmaps.Event.DOCUMENT_CLOSED, function() {
            t.clear()
        }), e.subscribe(mindmaps.Event.NODE_MOVED, function(e) {
            t.positionNode(e), t.updateNode(e)
        }), e.subscribe(mindmaps.Event.NODE_TEXT_CAPTION_CHANGED, function(e) {
            t.setNodeText(e, e.getCaption()), t.updateNode(e), t.redrawNodeConnectors(e)
        }), e.subscribe(mindmaps.Event.NODE_LINE_WIDTH_CHANGED, function(e) {
            for (var n = e; !n.isRoot();) t.updateNode(n), n = n.getParent()
        }), e.subscribe(mindmaps.Event.NODE_CREATED, function(e) {
            var doc = o.getDocument();
            if (doc && doc.mindmap) {
                var ls = doc.mindmap.getLevelStyle(e.getDepth());
                if (ls) {
                    var lsFont = e.getPluginData("style", "font");
                    $.extend(lsFont, ls);
                    e.setPluginData("style", "font", lsFont);
                }
            }
            t.createNode(e);
            for (var n = e; !n.isRoot();) t.updateNode(n), n = n.getParent();
            if (mindmaps.responsive.isTouchDevice || mindmaps.mode.inHD) {
                var i = e.getParent();
                if (i.getPluginData("layout", "foldChildren")) {
                    var d = new mindmaps.action.OpenNodeAction(i);
                    o.executeAction(d)
                }
                o.selectNode(e)
            } else if (e.shouldEditCaption) {
                delete e.shouldEditCaption;
                var i = e.getParent();
                if (i.getPluginData("layout", "foldChildren")) {
                    var d = new mindmaps.action.OpenNodeAction(i);
                    o.executeAction(d)
                }
                o.selectNode(e), c.attachToNode(e), t.editNodeCaption(e)
            }
        }), e.subscribe(mindmaps.Event.NODE_DELETED, function(e, i) {
            console.log("deleting node");
            var d = o.selectedNode;
            (e === d || e.isDescendant(d)) && o.selectNode(i), n(e), console.log("nodes is " + o.getDocument().getConnectedNodes().length), t.deleteNode(e), i.isLeaf() && t.removeFoldButton(i)
        }), e.subscribe(mindmaps.Event.CONNECTED_TWO_NODES, function(e, n, r) {
            console.log("connected " + e.getCaption() + "," + n.getCaption());
            var t = new mindmaps.action.ConnectTwoNodesAction(e, n, "dashed", "#ff0000", "0", r);
            o.executeAction(t)
        }), e.subscribe(mindmaps.Event.CONNECTION_COLOR_CHANGED, function() {}), e.subscribe(mindmaps.Event.NODE_SELECTION_CHANGED, r), e.subscribe(mindmaps.Event.NODE_OPENED, function(e) {
            e.forEachChild(function(e) {
                i(e)
            }), t.openNode(e)
        }), e.subscribe(mindmaps.Event.NODE_CLOSED, function(e) {
            e.forEachChild(function(e) {
                a(e)
            }), t.closeNode(e)
        }), e.subscribe(mindmaps.Event.NODE_FONT_CHANGED, function(e) {
            t.updateNode(e)
        }), e.subscribe(mindmaps.Event.TWO_NODES_CONNECTED, function(e, n) {
            t.updateNode(e), t.updateNode(n)
        }), e.subscribe(mindmaps.Event.TWO_NODES_DISCONNECTED, function(e, n) {
            t.updateNode(e), t.updateNode(n)
        }), e.subscribe(mindmaps.Event.CONNECTION_COLOR_CHANGED, function(e) {
            t.updateNode(e)
        }), e.subscribe(mindmaps.Event.NODE_BORDER_CHANGED, function(e) {
            console.log("node border changed"), t.updateNode(e)
        }), e.subscribe(mindmaps.Event.MAP_BACKGROUND_CHANGED, function() {
            var e = o.getDocument();
            e && t.applyMapBackgroundStyle(l(e))
        }), e.subscribe(mindmaps.Event.NODE_FONT_COLOR_PREVIEW, function(e, n) {
            t.updateFontColor(e, n)
        }), e.subscribe(mindmaps.Event.NODE_BRANCH_COLOR_CHANGED, function(e) {
            t.updateNode(e)
        }), e.subscribe(mindmaps.Event.NODE_BRANCH_COLOR_PREVIEW, function(e, n) {
            t.updateBranchColor(e, n)
        }), e.subscribe(mindmaps.Event.ZOOM_CHANGED, function(e) {
            t.setZoomFactor(e), t.applyViewZoom(), t.scaleMap();
            var n = o.getDocument();
            if (n) {
                var i = n.mindmap;
                t.updateNode(i.root), i.root.forEachDescendant(function(e) {
                    t.updateNode(e)
                })
            }
        })
    }
    var c = t.getCreator();
    var b = {};
    function h() {
        return [n.get(mindmaps.EditNodeCaptionCommand), n.get(mindmaps.CreateNodeCommand), n.get(mindmaps.CreateSiblingNodeCommand), n.get(mindmaps.DeleteNodeCommand), n.get(mindmaps.CopyNodeCommand), n.get(mindmaps.CutNodeCommand), n.get(mindmaps.PasteNodeCommand)]
    }

    function v() {
        var e = {
            clipboard: [n.get(mindmaps.CopyNodeCommand), n.get(mindmaps.CutNodeCommand), n.get(mindmaps.PasteNodeCommand)],
            structure: [n.get(mindmaps.CreateNodeCommand), n.get(mindmaps.CreateSiblingNodeCommand), n.get(mindmaps.DeleteNodeCommand)]
        };
        return [{
            id: "group-clipboard",
            type: "group-title",
            label: "Clipboard"
        }].concat(e.clipboard.map(function(e) {
            return {
                id: e.id,
                type: "action",
                label: e.label,
                enabled: e.enabled
            }
        })).concat([{ type: "separator" }, {
            id: "group-insert",
            type: "group-title",
            label: "Insert"
        }, {
            id: "INSERT_URL_ACTION",
            type: "action",
            label: "Add URL...",
            enabled: true
        }, {
            id: "INSERT_IMAGE_ACTION",
            type: "action",
            label: "Add Image...",
            enabled: true
        }, { type: "separator" }, {
            id: "group-structure",
            type: "group-title",
            label: "Structure"
        }]).concat(e.structure.map(function(e) {
            return {
                id: e.id,
                type: "action",
                label: e.label,
                enabled: e.enabled
            }
        }))
    }

    function p(e) {
        var t = null;
        h().some(function(n) {
            if (n.id === e) {
                t = n;
                return true
            }
            return false
        });
        return t
    }

    function C(e, n) {
        return (n || []).indexOf(e) !== -1
    }
    this.init = function() {
        var e = n.get(mindmaps.EditNodeCaptionCommand);
        e.setHandler(this.editNodeCaption.bind(this));
        var o = n.get(mindmaps.ToggleNodeFoldedCommand);
        o.setHandler(s)
    }, this.editNodeCaption = function(e) {
        e || (e = o.selectedNode), t.editNodeCaption(e)
    };
    var s = function(e) {
            e || (e = o.selectedNode);
            var n = new mindmaps.action.ToggleNodeFoldAction(e);
            o.executeAction(n)
        },
        r = function(e, n, r) {
            t.selectedNode = r || null;
            (n || []).forEach(function(n) {
                if (!C(n, e)) {
                    t.unhighlightNode(n)
                }
            });
            (e || []).forEach(function(e) {
                if (!C(e, n)) {
                    t.highlightNode(e)
                }
            })
        };
    t.mouseWheeled = function(e) {
        t.stopEditNodeCaption();
        var step = Math.min(Math.abs(e) * 0.004, 0.05);
        e > 0 ? i.zoomIn(step) : 0 > e && i.zoomOut(step)
    }, t.pinch = function(e) {
        t.stopEditNodeCaption(), i.zoomByScale(e)
    }, t.tow_tap = function() {
        t.stopEditNodeCaption(), i.zoomToOne()
    }, t.nodeContextMenuRequested = function(e, r) {
        o.selectNode(e);
        var i = v();
        t.showNodeContextMenu(e, r, i)
    }, t.nodeContextMenuAction = function(e, n) {
        if (n) {
            o.selectNode(n)
        }
        if (e === "INSERT_URL_ACTION") {
            $("#inspector-button-urls").trigger("click");
            return
        }
        if (e === "INSERT_IMAGE_ACTION") {
            $("#inspector-button-add-image").trigger("click");
            return
        }
        var r = p(e);
        if (r && r.enabled) {
            r.execute()
        }
    }, t.nodeMouseOver = function(e) {
        t.isNodeDragging() || c.isDragging() || c.attachToNode(e)
    }, t.nodeCaptionMouseOver = function(e) {
        t.isNodeDragging() || c.isDragging() || c.attachToNode(e)
    }, t.nodeMouseDown = function(e, n) {
        if (!mindmaps.connectMode) {
            mindmaps.connectSelected = !1
        }
        t.hideNodeContextMenu();
        if (n && (n.metaKey || n.ctrlKey) && !mindmaps.connectMode) {
            o.toggleNodeSelection(e)
        } else if (o.selectedNodes && o.selectedNodes.length > 1 && o.selectedNodes.indexOf(e) !== -1) {
            // Node is already part of a multi-selection — keep selection so all nodes can be dragged together
        } else {
            o.selectNode(e)
        }
        c.attachToNode(e)
    }, t.canvasMarqueeSelect = function(nodes) {
        t.stopEditNodeCaption();
        if (nodes.length === 0) {
            o.selectNode(null);
        } else {
            o.setSelectedNodes(nodes, nodes[0]);
        }
    }, t.canvasBackgroundClick = function() {
        t.stopEditNodeCaption();
        // Directly unhighlight any visually selected nodes before clearing the model.
        // This handles model/visual desync and ensures updateNode is called so branch lines redraw correctly.
        $(".node-caption.selected").each(function() {
            var node = $("#node-" + this.id.replace("node-caption-", "")).data("node");
            if (node) t.unhighlightNode(node);
        });
        o.selectNode(null);
    }, t.connectionSelected = function(fromNode, toNode, conn) {
        mindmaps.connectMode = !1;
        mindmaps.connectStartNode = toNode;
        mindmaps.connectSelected = !0;
        o.selectNode(fromNode);
        c.attachToNode(fromNode);
        e.publish(mindmaps.Event.CONNECTION_SELECTED, fromNode, toNode, conn)
    }, t.nodeDoubleClicked = function(e) {
        t.editNodeCaption(e)
    }, t.getSelectedNodes = function() {
        return o.selectedNodes;
    }, t.nodeDragged = function(draggedNode, newPos) {
        var selNodes = o.selectedNodes;
        if (selNodes && selNodes.length > 1 && selNodes.indexOf(draggedNode) !== -1) {
            var oldOffset = draggedNode.getPluginData("layout", "offset");
            var deltaX = newPos.x - oldOffset.x;
            var deltaY = newPos.y - oldOffset.y;
            selNodes.forEach(function(node) {
                var par = node.getParent();
                while (par) {
                    if (selNodes.indexOf(par) !== -1) return;
                    par = par.getParent();
                }
                var nodeOffset = node.getPluginData("layout", "offset");
                o.executeAction(new mindmaps.action.MoveNodeAction(node, new mindmaps.Point(nodeOffset.x + deltaX, nodeOffset.y + deltaY)));
            });
        } else {
            o.executeAction(new mindmaps.action.MoveNodeAction(draggedNode, newPos));
        }
    }, t.connectionAnchorMoved = function(e, n, r) {
        var anchor = {};
        if (r.type === "to") {
            anchor.toAnchorX = r.anchorX;
            anchor.toAnchorY = r.anchorY
        } else if (r.type === "curvePair") {
            anchor.curve1T = r.curve1T;
            anchor.curve1N = r.curve1N;
            anchor.curve2T = r.curve2T;
            anchor.curve2N = r.curve2N
        } else if (r.type === "curve1") {
            anchor.curve1T = r.anchorX;
            anchor.curve1N = r.anchorY
        } else if (r.type === "curve2") {
            anchor.curve2T = r.anchorX;
            anchor.curve2N = r.anchorY
        } else {
            anchor.fromAnchorX = r.anchorX;
            anchor.fromAnchorY = r.anchorY
        }
        var t = new mindmaps.action.SetConnectAnchorAction(e, n, anchor);
        o.executeAction(t)
    }, t.nodeImageResizeStarted = function(e, n) {
        b[e.id] = g(n)
    }, t.nodeImageResizePreview = function(e, n) {
        e.setPluginData("image", "data", g(n));
        t.updateNode(e)
    }, t.nodeImageResizeCommitted = function(e, n) {
        var r = b[e.id] || g(e.getPluginData("image", "data"));
        var i = g(n);
        delete b[e.id];
        if (!r || !i || y(r, i)) {
            return
        }
        e.setPluginData("image", "data", g(r));
        t.updateNode(e);
        o.executeAction(m(e, r, i))
    }, t.nodeImageRepositioned = function(e, n, r) {
        var i = g(e.getPluginData("image", "data"));
        if (!i) {
            return;
        }
        var s = {
            data: i.data,
            width: i.width,
            height: i.height,
            align: r
        };
        if (y(i, s)) {
            return;
        }
        e.setPluginData("image", "data", s);
        t.updateNode(e);
        o.executeAction(m(e, i, s));
    }, t.foldButtonClicked = function(e) {
        s(e)
    }, c.dragStarted = function(e) {
        var n = e.isRoot() ? mindmaps.Util.getNextRootBranchColor(e) : e.getPluginData("style", "branchColor");
        return n
    }, c.dragStopped = function(e, n, t, i) {
        if (!(50 > i)) {
            var d = new mindmaps.Node;
            d.setPluginData("style", "branchColor", c.lineColor), d.setPluginData("layout", "offset", new mindmaps.Point(n, t)), d.shouldEditCaption = !0, o.createNode(d, e)
        }
    }, t.nodeCaptionEditCommitted = function(e, n) {
        var n = $.trim(n);
        n && (t.stopEditNodeCaption(), o.changeNodeCaption(e, n))
    }, t.pluginclick = function(e,icon) {
        //this function created by ms to click on plugin icon
        o.selectNode(e);
        if(icon=="draw") {
			console.log("need work");

        }
        if(icon=="url") {
            $('#inspector-button-urls').trigger('click')
        }
    }, this.go = function() {
        t.init()
    }, a(), this.init()
};