mindmaps.MindMapModel = function(e, t, n) {
    var r = this;
    var linkedSaveTimeoutId = null;
    var linkedSaveDelayMs = 2e3;
    this.document = null;
    this.linkedFileHandle = null;
    this.selectedNode = null;
    this.selectedNodes = [];

    function sameSelection(e, t) {
        if (e.length !== t.length) {
            return false;
        }
        return e.every(function(e, n) {
            return e === t[n];
        });
    }

    function normalizeSelection(e, t) {
        var n = [];
        (e || []).forEach(function(e) {
            if (e && n.indexOf(e) === -1) {
                n.push(e);
            }
        });
        if (t && n.indexOf(t) === -1) {
            n.push(t);
        }
        if (!t && n.length) {
            t = n[n.length - 1];
        }
        return {
            selectedNodes: n,
            selectedNode: t || null
        };
    }

    function scheduleLinkedFileSave() {
        if (!r.linkedFileHandle || !r.document) {
            return;
        }
        if (linkedSaveTimeoutId) {
            clearTimeout(linkedSaveTimeoutId);
        }
        linkedSaveTimeoutId = setTimeout(function() {
            linkedSaveTimeoutId = null;
            r.saveToLinkedFile();
        }, linkedSaveDelayMs);
    }

    this.getDocument = function() {
        return this.document
    };
    this.setDocument = function(t) {
        this.document = t;
        this.linkedFileHandle = null;
        this.selectedNode = null;
        this.selectedNodes = [];
        if (linkedSaveTimeoutId) {
            clearTimeout(linkedSaveTimeoutId);
            linkedSaveTimeoutId = null;
        }
        if (t) {
            e.publish(mindmaps.Event.DOCUMENT_OPENED, t)
        } else {
            e.publish(mindmaps.Event.DOCUMENT_CLOSED)
        }
    };
    this.setLinkedFileHandle = function(handle) {
        this.linkedFileHandle = handle || null;
    };
    this.getLinkedFileHandle = function() {
        return this.linkedFileHandle;
    };
    this.getMindMap = function() {
        if (this.document) {
            return this.document.mindmap
        }
        return null
    };
    this.init = function() {
        var n = t.get(mindmaps.CreateNodeCommand);
        n.setHandler(this.createNode.bind(this));
        var i = t.get(mindmaps.CreateSiblingNodeCommand);
        i.setHandler(this.createSiblingNode.bind(this));
        var s = t.get(mindmaps.DeleteNodeCommand);
        s.setHandler(this.deleteNode.bind(this));
        var l = t.get(mindmaps.ConnectNodeCommand);
        l.setHandler(this.connectNode.bind(this));
        var o = t.get(mindmaps.SelectParentNodeCommand);
        o.setHandler(this.selectParent.bind(this));
        var u = t.get(mindmaps.SelectChildFirstNodeCommand);
        u.setHandler(this.selectChildFirst.bind(this));
        var a = t.get(mindmaps.SelectSiblingNextNodeCommand);
        a.setHandler(this.selectSiblingN.bind(this));
        var f = t.get(mindmaps.SelectSiblingPrevNodeCommand);
        f.setHandler(this.selectSiblingP.bind(this));
        e.subscribe(mindmaps.Event.DOCUMENT_CLOSED, function() {
            n.setEnabled(false);
            i.setEnabled(false);
            s.setEnabled(false);
            l.setEnabled(false);
            o.setEnabled(false);
            u.setEnabled(false);
            a.setEnabled(false);
            f.setEnabled(false)
        });
        e.subscribe(mindmaps.Event.DOCUMENT_OPENED, function() {
            n.setEnabled(true);
            i.setEnabled(true);
            s.setEnabled(true);
            l.setEnabled(true);
            o.setEnabled(true);
            u.setEnabled(true);
            a.setEnabled(true);
            f.setEnabled(true)
        });
        e.subscribe(mindmaps.Event.NODE_SELECTED, function(e) {
            i.setEnabled(r.getParent(e));
            s.setEnabled(r.getParent(e));
            l.setEnabled(!!e);
            o.setEnabled(r.getParent(e));
            u.setEnabled(r.getChildFirst(e));
            a.setEnabled(r.getSiblingN(e));
            f.setEnabled(r.getSiblingP(e))
        })
    };
    this.deleteNode = function(e) {
        if (!e) {
            e = this.selectedNode
        }
        var t = this.getMindMap();
        var n = new mindmaps.action.DeleteNodeAction(e, t);
        this.executeAction(n)
    };
    this.createNode = function(e, t) {
        var n = this.getMindMap();
        if (!(e && t)) {
            t = this.selectedNode;
            var r = new mindmaps.action.CreateAutoPositionedNodeAction(t, n)
        } else {
            var r = new mindmaps.action.CreateNodeAction(e, t, n)
        }
        this.executeAction(r)
    };
    this.createSiblingNode = function() {
        var e = this.getMindMap();
        var t = this.selectedNode;
        var n = t.getParent();
        if (n === null) {
            return
        }
        var r = new mindmaps.action.CreateAutoPositionedNodeAction(n, e);
        this.executeAction(r)
    };
    this.connectNode = function() {
        if (!this.selectedNode) {
            return
        }
        var e = new mindmaps.action.ConnectNodeClickAction(this.selectedNode, !0);
        this.executeAction(e)
    };
    this.getSelectedNodes = function() {
        return this.selectedNodes.slice()
    };
    this.setSelectedNodes = function(t, n) {
        var r = normalizeSelection(t, n);
        var i = this.selectedNode;
        var s = this.selectedNodes.slice();
        if (i === r.selectedNode && sameSelection(s, r.selectedNodes)) {
            return
        }
        this.selectedNode = r.selectedNode;
        this.selectedNodes = r.selectedNodes;
        if (i !== r.selectedNode) {
            e.publish(mindmaps.Event.NODE_SELECTED, r.selectedNode, i)
        }
        e.publish(mindmaps.Event.NODE_SELECTION_CHANGED, r.selectedNodes.slice(), s, r.selectedNode, i)
    };
    this.selectNode = function(t) {
        this.setSelectedNodes(t ? [t] : [], t)
    };
    this.toggleNodeSelection = function(e) {
        if (!e) {
            return
        }
        var t = this.selectedNodes.slice();
        var n = t.indexOf(e);
        if (n === -1) {
            t.push(e);
            this.setSelectedNodes(t, e);
            return
        }
        if (t.length === 1) {
            this.setSelectedNodes(t, e);
            return
        }
        t.splice(n, 1);
        this.setSelectedNodes(t, this.selectedNode === e ? t[t.length - 1] : this.selectedNode)
    };
    this.selectParent = function() {
        if (r.selectedNode) {
            var e = r.selectedNode;
            var t = r.getParent(e);
            if (t) {
                r.selectNode(t)
            }
        }
    };
    this.selectChildFirst = function() {
        if (r.selectedNode) {
            var e = r.selectedNode;
            var t = r.getChildFirst(e);
            if (t) {
                r.selectNode(t)
            }
        }
    };
    this.selectSiblingN = function() {
        if (r.selectedNode) {
            var e = r.selectedNode;
            var t = r.getSiblingN(e);
            if (t) {
                r.selectNode(t)
            }
        }
    };
    this.selectSiblingP = function() {
        if (r.selectedNode) {
            var e = r.selectedNode;
            var t = r.getSiblingP(e);
            if (t) {
                r.selectNode(t)
            }
        }
    };
    this.getParent = function(e) {
        return e.parent
    };
    this.getChildFirst = function(e) {
        if (e.children && e.children.count > 0) {
            var t = e.children.nodes[e.children.indexes[0]];
            return t
        }
        return null
    };
    this.getChildLast = function(e) {
        if (e.children && e.children.count > 0) {
            var t = e.children.nodes[e.children.indexes[e.children.indexes.length - 1]];
            return t
        }
        return null
    };
    this.getSiblingN = function(e) {
        if (e.parent) {
            var t = e.parent;
            if (t.children && t.children.count > 0) {
                var n = t.children.indexes.indexOf(e.id);
                if (n >= 0 && n < t.children.count - 1) {
                    var r = t.children.nodes[t.children.indexes[n + 1]];
                    return r
                }
            }
        }
        return null
    };
    this.getSiblingP = function(e) {
        if (e.parent) {
            var t = e.parent;
            if (t.children && t.children.count > 0) {
                var n = t.children.indexes.indexOf(e.id);
                if (n > 0) {
                    var r = t.children.nodes[t.children.indexes[n - 1]];
                    return r
                }
            }
        }
        return null
    };
    this.changeNodeCaption = function(e, t) {
        if (!e) {
            e = this.selectedNode
        }
        var n = new mindmaps.action.ChangeNodeCaptionAction(e, t);
        this.executeAction(n)
    };
    this.executeAction = function(t) {
        if (t instanceof mindmaps.action.CompositeAction) {
            var i = this.executeAction.bind(this);
            t.forEachAction(i);
            return
        }
        var s = t.execute();
        if (s !== undefined && !s) {
            return false
        }
        if (t.event) {
            if (!Array.isArray(t.event)) {
                t.event = [t.event]
            }
            e.publish.apply(e, t.event)
        }
        if (t.undo) {
            var o = function() {
                r.executeAction(t.undo())
            };
            if (t.redo) {
                var u = function() {
                    r.executeAction(t.redo())
                }
            }
            n.addUndo(o, u)
        }
        scheduleLinkedFileSave();
    };
    this.saveToLocalStorage = function() {
        var t = this.document.prepareSave();
        return mindmaps.LocalDocumentStorage.saveDocument(t).then(function(n) {
            if (n) {
                e.publish(mindmaps.Event.DOCUMENT_SAVED, t)
            }
            return n
        }).catch(function() {
            return false
        })
    };
    this.saveToLinkedFile = function() {
        if (!mindmaps.LocalFileStorage || !this.linkedFileHandle) {
            return Promise.resolve(false)
        }
        var t = this.document.prepareSave();
        return mindmaps.LocalFileStorage.writeDocument(this.linkedFileHandle, t).then(function() {
            e.publish(mindmaps.Event.DOCUMENT_SAVED, t);
            return true
        }).catch(function() {
            return false
        })
    };
    this.init()
}