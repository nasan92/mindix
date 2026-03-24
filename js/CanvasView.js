mindmaps.CanvasView = function() {
    this.$getDrawingArea = function() {
        return $("#drawing-area")
    };
    this.$getContainer = function() {
        return $("#canvas-container")
    };
    this.center = function() {
        var e = this.$getContainer();
        var t = this.$getDrawingArea();
        var n = t.width() - e.width();
        var r = t.height() - e.height();
        this.scroll(n / 2, r / 2)
    };
    this.scroll = function(e, t) {
        var n = this.$getContainer();
        n.scrollLeft(e).scrollTop(t)
    };
    this.applyViewZoom = function() {
        var e = this.zoomFactorDelta;
        var t = this.$getContainer();
        var n = t.scrollLeft();
        var r = t.scrollTop();
        var i = t.width();
        var s = t.height();
        var o = i / 2 + n;
        var u = s / 2 + r;
        o *= this.zoomFactorDelta;
        u *= this.zoomFactorDelta;
        n = o - i / 2;
        r = u - s / 2;
        var a = this.$getDrawingArea();
        var f = a.width();
        var l = a.height();
        a.width(f * e).height(l * e);
        this.scroll(n, r);
        var c = a.css("background-size") || "";
        var h = parseFloat(c);
        if (!isNaN(h)) {
            var p = h * e;
            a.css("background-size", p + "px " + p + "px")
        }
    };
    this.setDimensions = function(e, t) {
        e = e * this.zoomFactor;
        t = t * this.zoomFactor;
        var n = this.$getDrawingArea();
        n.width(e).height(t)
    };
    this.setZoomFactor = function(e) {
        this.zoomFactorDelta = e / (this.zoomFactor || 1);
        this.zoomFactor = e
    };
    this.applyMapBackgroundStyle = function(e) {
        var t = this.$getDrawingArea();
        var n = e || {};
        var r = n.gridEnabled !== false;
        var i = n.color || "#ffffff";
        t.css("background-color", i);
        if (r) {
            var s = 24 * (this.zoomFactor || 1);
            t.css("background-image", "url(img/grid.gif)");
            t.css("background-size", s + "px " + s + "px")
        } else {
            t.css("background-image", "none");
            t.css("background-size", "auto")
        }
    }
};
mindmaps.CanvasView.prototype.drawMap = function(e) {
    throw new Error("Not implemented")
};
mindmaps.DefaultCanvasView = function() {
    function M() {
        if (A) {
            return A
        }
        A = $("<div/>", {
            id: "node-context-menu",
            "class": "mindmap-context-menu"
        }).append($("<ul/>"));
        A.hide().appendTo("body");
        A.on("click", "li", function(t) {
            var n = $(this);
            if (n.hasClass("disabled")) {
                return false
            }
            var r = n.data("action");
            if (e.nodeContextMenuAction && N) {
                e.nodeContextMenuAction(r, N)
            }
            e.hideNodeContextMenu();
            t.preventDefault();
            return false
        });
        A.on("contextmenu", function(e) {
            e.preventDefault();
            return false
        });
        return A
    }

    function k() {
        if (L) {
            return
        }
        L = true;
        $(document).on("mousedown.canvasContextMenu", function(t) {
            if (!A || !A.is(":visible")) {
                return
            }
            if ($(t.target).closest("#node-context-menu").length) {
                return
            }
            e.hideNodeContextMenu()
        });
        $(document).on("keydown.canvasContextMenu", function(t) {
            if (t.keyCode === 27) {
                e.hideNodeContextMenu()
            }
        })
    }

    function a() {
        e.$getContainer().dragscrollable({
            dragSelector: "#drawing-area, canvas.line-canvas",
            acceptPropagatedEvent: false,
            delegateMode: true,
            preventDefault: true
        })
    }

    function f(e) {
        return $("#node-canvas-" + e.id)
    }

    function l(e, t) {
        t = t || 0;
        return $("#node-connector-canvas-" + e.id + "-" + t)
    }

    function c(e) {
        return $("#node-" + e.id)
    }

    function h(e) {
        return $("#node-caption-" + e.id)
    }

    function R(e, t, n, r) {
        return Math.max(e, Math.min(t, n || r))
    }

    function q(e, t, n) {
        if (!isFinite(e)) {
            return t
        }
        return Math.max(t, Math.min(n, e))
    }

    function U(e) {
        if (!e || !e.length) {
            return null
        }
        var t = e.attr("id") || "";
        var n = t.match(/^node-connector-canvas-(.+)-(\d+)$/);
        if (!n) {
            return null
        }
        var r = n[1];
        var i = parseInt(n[2], 10);
        if (!isFinite(i)) {
            return null
        }
        var s = mindmaps.getConnectedNodes().filter(function(e) {
            return String(e.from) === String(r) && parseInt(e.canvasId, 10) === i
        });
        return s.length ? s[0] : null
    }

    function V(e) {
        var t = $("#node-" + e.from);
        var n = $("#node-" + e.to);
        if (!t.length || !n.length) {
            return null
        }
        var r = t.offset();
        var i = n.offset();
        var s = t.outerWidth() || 1;
        var o = t.outerHeight() || 1;
        var u = n.outerWidth() || 1;
        var a = n.outerHeight() || 1;
        if ("number" == typeof e.toAnchorX && "number" == typeof e.toAnchorY) {
            return {
                x: i.left + q(e.toAnchorX, -.15, 1.15) * u,
                y: i.top + q(e.toAnchorY, -.15, 1.15) * a
            }
        }
        if ("number" == typeof e.fromAnchorX && "number" == typeof e.fromAnchorY) {
            return {
                x: i.left + u / 2,
                y: i.top + a / 2
            }
        }
        var f = r.left - i.left;
        var l = r.top - i.top;
        var c;
        var h;
        var p;
        var d;
        var v;
        var m;
        var g = f + u / 2 < s / 2;
        if (g) {
            var y = Math.abs(f);
            if (y > u) {
                p = y - u + 1;
                c = u;
                v = true
            } else {
                c = -f;
                p = u + f;
                v = false
            }
        } else {
            if (f > s) {
                p = f - s + 1;
                c = s - f;
                v = false
            } else {
                p = s - f;
                c = 0;
                v = true
            }
        }
        if (p < 5) {
            p = 5
        }
        var b = l + a < o;
        if (b) {
            h = a;
            d = -l - h;
            m = true
        } else {
            h = o - l;
            d = -h;
            m = false
        }
        if (d < 5) {
            d = 5
        }
        if (!p && !d) {
            return {
                x: i.left + u / 2,
                y: i.top + a / 2
            }
        }
        var w = v ? p : 0;
        var E = v ? 0 : p;
        var S = m ? d : 0;
        var x = m ? 0 : d;
        return {
            x: r.left + c + w,
            y: r.top + h + S
        }
    }

    function W(e) {
        var t = $("#node-" + e.from);
        var n = $("#node-" + e.to);
        if (!t.length || !n.length) {
            return null
        }
        var r = t.offset();
        var i = n.offset();
        var s = t.outerWidth() || 1;
        var o = t.outerHeight() || 1;
        var u = n.outerWidth() || 1;
        var a = n.outerHeight() || 1;
        if ("number" == typeof e.fromAnchorX && "number" == typeof e.fromAnchorY) {
            return {
                x: r.left + q(e.fromAnchorX, -.15, 1.15) * s,
                y: r.top + q(e.fromAnchorY, -.15, 1.15) * o
            }
        }
        if ("number" == typeof e.toAnchorX && "number" == typeof e.toAnchorY) {
            var tx = i.left + q(e.toAnchorX, -.15, 1.15) * u;
            var ty = i.top + q(e.toAnchorY, -.15, 1.15) * a;
            var cx = r.left + s / 2;
            var cy = r.top + o / 2;
            var ddx = tx - cx;
            var ddy = ty - cy;
            if (!ddx && !ddy) return {x: cx, y: cy};
            var oox = ddx ? s / 2 / Math.abs(ddx) : 1e9;
            var ooy = ddy ? o / 2 / Math.abs(ddy) : 1e9;
            var aa = Math.min(oox, ooy);
            return {x: cx + ddx * aa, y: cy + ddy * aa}
        }
        var f = r.left - i.left;
        var l = r.top - i.top;
        var c;
        var h;
        var p;
        var d;
        var v;
        var m;
        var g = f + u / 2 < s / 2;
        if (g) {
            var y = Math.abs(f);
            if (y > u) {
                p = y - u + 1;
                c = u;
                v = true
            } else {
                c = -f;
                p = u + f;
                v = false
            }
        } else {
            if (f > s) {
                p = f - s + 1;
                c = s - f;
                v = false
            } else {
                p = s - f;
                c = 0;
                v = true
            }
        }
        if (p < 5) {
            p = 5
        }
        var b = l + a < o;
        if (b) {
            h = a;
            d = -l - h;
            m = true
        } else {
            h = o - l;
            d = -h;
            m = false
        }
        if (d < 5) {
            d = 5
        }
        if (!p && !d) {
            return {
                x: r.left + s / 2,
                y: r.top + o / 2
            }
        }
        var E = v ? 0 : p;
        var x = m ? 0 : d;
        return {
            x: r.left + c + E,
            y: r.top + h + x
        }
    }

    function D(e) {
        var t = h(e);
        if (!t.length) {
            return null
        }
        var n = e.getPluginData("image", "data") || {};
        if (!n.data) {
            return null
        }
        var r = parseInt(n.width, 10);
        var i = parseInt(n.height, 10);
        if (!$.isNumeric(r) || !$.isNumeric(i)) {
            return null
        }
        var s = R(16, 2e3, r, r) * (this.zoomFactor || 1);
        var o = R(16, 2e3, i, i) * (this.zoomFactor || 1);
        var u = t.innerWidth();
        var a = t.innerHeight();
        var f = 0;
        var l = 0;
        if (n.align === "left") {
            f = 0
        } else if (n.align === "right") {
            f = u - s
        } else {
            f = (u - s) / 2
        }
        if (n.align === "top") {
            l = 0
        } else if (n.align === "bottom") {
            l = a - o
        } else {
            l = (a - o) / 2
        }
        return {
            left: Math.max(0, Math.round(f)),
            top: Math.max(0, Math.round(l)),
            width: Math.round(s),
            height: Math.round(o)
        }
    }

    function B() {
        $(".node-image-selection").remove();
        j = null
    }

    function P() {
        if (!I) {
            return
        }
        $(document).off("mousemove.imageResize mouseup.imageResize");
        $("body").css("cursor", "");
        var t = I.node;
        var n = I.moved;
        var r = I.preview;
        I = null;
        if (n && t && r && e.nodeImageResizeCommitted) {
            e.nodeImageResizeCommitted(t, r)
        }
    }

    function O(t, n) {
        n = n || {};
        if (!e.selectedNode || e.selectedNode !== t || !n.data || j !== t.id) {
            return
        }
        var r = h(t);
        var i = D.call(e, t);
        if (!i) {
            return
        }
        r.find(".node-image-selection").remove();
        var s = $("<div/>", {
            "class": "node-image-selection"
        }).css({
            position: "absolute",
            left: i.left,
            top: i.top,
            width: i.width,
            height: i.height,
            border: "2px solid #2d8cff",
            "box-sizing": "border-box",
            "z-index": 250,
            "pointer-events": "auto",
            cursor: "move"
        });
        s.on("mousedown", function(evt) {
            if ($(evt.target).hasClass("node-image-corner")) {
                return;
            }
            evt.preventDefault();
            evt.stopPropagation();
            var repoState = {
                startX: evt.pageX,
                startY: evt.pageY,
                node: t,
                imageData: n,
                moved: false,
                pendingAlign: null
            };
            $("body").css("cursor", "move");
            $(document).on("mousemove.imageReposition", function(moveEvt) {
                if (!repoState) {
                    return;
                }
                moveEvt.preventDefault();
                var s = moveEvt.pageX - repoState.startX;
                var o = moveEvt.pageY - repoState.startY;
                var u;
                if (Math.abs(s) > Math.abs(o)) {
                    u = s > 0 ? "right" : "left";
                } else {
                    u = o > 0 ? "bottom" : "top";
                }
                repoState.pendingAlign = u;
                repoState.moved = true;
            });
            $(document).on("mouseup.imageReposition", function() {
                if (!repoState) {
                    return;
                }
                $(document).off("mousemove.imageReposition mouseup.imageReposition");
                $("body").css("cursor", "");
                if (repoState.moved && repoState.pendingAlign && e.nodeImageRepositioned) {
                    e.nodeImageRepositioned(repoState.node, repoState.imageData, repoState.pendingAlign);
                }
                repoState = null;
            });
        });
        var o = [{
            name: "nw",
            sx: -1,
            sy: -1,
            left: "-6px",
            top: "-6px",
            cursor: "nwse-resize"
        }, {
            name: "ne",
            sx: 1,
            sy: -1,
            right: "-6px",
            top: "-6px",
            cursor: "nesw-resize"
        }, {
            name: "se",
            sx: 1,
            sy: 1,
            right: "-6px",
            bottom: "-6px",
            cursor: "nwse-resize"
        }, {
            name: "sw",
            sx: -1,
            sy: 1,
            left: "-6px",
            bottom: "-6px",
            cursor: "nesw-resize"
        }];
        o.forEach(function(corner) {
            var o = $("<div/>", {
                "class": "node-image-corner handle-" + corner.name,
                title: "Drag to resize image"
            }).css({
                position: "absolute",
                width: "10px",
                height: "10px",
                border: "1px solid #2d8cff",
                background: "#fff",
                "border-radius": "1px",
                "box-sizing": "border-box",
                cursor: corner.cursor,
                "pointer-events": "auto"
            }).css({
                left: corner.left,
                right: corner.right,
                top: corner.top,
                bottom: corner.bottom
            });
            o.on("mousedown", function(evt) {
            var o = parseInt(n.width, 10);
            var u = parseInt(n.height, 10);
            if (!$.isNumeric(o) || !$.isNumeric(u)) {
                return
            }
            evt.preventDefault();
            evt.stopPropagation();
            var a = R(16, 2e3, o, o);
            var f = R(16, 2e3, u, u);
            var l = a / (f || 1);
            I = {
                node: t,
                imageData: {
                    data: n.data,
                    align: n.align,
                    width: String(a),
                    height: String(f)
                },
                startPageX: evt.pageX,
                startPageY: evt.pageY,
                startWidth: a,
                startHeight: f,
                signX: corner.sx,
                signY: corner.sy,
                aspect: l,
                moved: false,
                preview: null
            };
            if (e.nodeImageResizeStarted) {
                e.nodeImageResizeStarted(t, I.imageData)
            }
            $("body").css("cursor", $(evt.currentTarget).css("cursor") || "nwse-resize");
            $(document).on("mousemove.imageResize", function(n) {
                if (!I) {
                    return
                }
                n.preventDefault();
                var r = I.signX * (n.pageX - I.startPageX) / (e.zoomFactor || 1);
                var i = I.signY * (n.pageY - I.startPageY) / (e.zoomFactor || 1);
                var o;
                var u;
                if (Math.abs(r) >= Math.abs(i)) {
                    o = R(16, 2e3, I.startWidth + r, I.startWidth);
                    u = o / I.aspect
                } else {
                    u = R(16, 2e3, I.startHeight + i, I.startHeight);
                    o = u * I.aspect
                }
                o = Math.round(R(16, 2e3, o, I.startWidth));
                u = Math.round(R(16, 2e3, u, I.startHeight));
                I.preview = {
                    data: I.imageData.data,
                    align: I.imageData.align,
                    width: String(o),
                    height: String(u)
                };
                I.moved = true;
                if (e.nodeImageResizePreview) {
                    e.nodeImageResizePreview(t, I.preview)
                }
            });
            $(document).on("mouseup.imageResize", function() {
                P()
            })
        });
            s.append(o)
        });
        r.css("position", "relative").append(s)
    }

    function p(t, n, r, i, s, u, a, f, l, c, h, conn) {
        var m = t[0];
        var d = m.getContext("2d");
        o.$canvas = t;
        if (conn) {
            conn._selected = !!(selectedConn && String(selectedConn.from) === String(conn.from) && selectedConn.canvasId === conn.canvasId)
        }
        o.render(d, n, r, i, s, u, f, a, l, e.zoomFactor, c, h, conn)
    }

    function d(e, t, n, r, i) {
        i = i || false;
        n = n || e.getPluginData("layout", "offset").x;
        r = r || e.getPluginData("layout", "offset").y;
        var s = mindmaps.getConnectedNodes().filter(function(t) {
            return t.from == e.id
        });
        s.forEach(function(s) {
            if ($("#node-" + s.from).length) g($("#node-connector-canvas-" + s.from + "-" + s.canvasId), t, n, r, true, s.from, s.to, e.getRoot(), i, s.style, s.arrow, s.color, s)
        });
        s = mindmaps.getConnectedNodes().filter(function(t) {
            return t.to == e.id
        });
        s.forEach(function(s) {
            if ($("#node-" + s.from).length) g($("#node-connector-canvas-" + s.from + "-" + s.canvasId), t, n, r, false, s.from, s.to, e.getRoot(), i, s.style, s.arrow, s.color, s)
        });
        if (i) e.forEachChild(function(e) {
            if (b == e.id) d(e, e.getDepth(), w, E, true);
            else d(e, e.getDepth(), e.getPluginData("layout", "offset").x, e.getPluginData("layout", "offset").y, true)
        })
    }

    function v(e, t) {
        var n = null;
        if (e.id == t) n = e;
        if (!n) e.forEachChild(function(e) {
            if ((r = v(e, t)) !== null) n = r
        });
        return n
    }

    function G(e) {
        tmp = e.getParent();
        while (tmp) {
            if (tmp.getPluginData("layout", "foldChildren")) return true;
            tmp = tmp.getParent()
        }
        return false
    }

    function g(e, t, n, r, i, s, o, u, a, f, l, h, m) {
        a = a || false;
        s = v(u, s);
        o = v(u, o);
        if (!s || !o) return;
        if (G(s) || G(o)) e.css("opacity", 0);
        else e.css("opacity", 1);
        if (a)
            if (b == s.id || b == o.id) a = false;
        var d = 0,
            g = 0;
        var y = 0,
            S = 0;
        if (i) {
            d = n;
            y = r;
            g = o.getPluginData("layout", "offset").x;
            S = o.getPluginData("layout", "offset").y
        } else {
            d = s.getPluginData("layout", "offset").x;
            y = s.getPluginData("layout", "offset").y;
            g = n;
            S = r
        }
        if (!s.isRoot()) {
            tmp = s.getParent();
            while (!tmp.isRoot()) {
                if (!i && tmp.id == o.id) {
                    d += n;
                    y += r
                } else if (a && tmp.id == b) {
                    d += w;
                    y += E
                } else {
                    d += tmp.getPluginData("layout", "offset").x;
                    y += tmp.getPluginData("layout", "offset").y
                }
                tmp = tmp.getParent()
            }
        }
        if (!o.isRoot()) {
            tmp = o.getParent();
            while (!tmp.isRoot()) {
                if (i && tmp.id == s.id) {
                    g += n;
                    S += r
                } else if (a && tmp.id == b) {
                    g += w;
                    S += E
                } else {
                    g += tmp.getPluginData("layout", "offset").x;
                    S += tmp.getPluginData("layout", "offset").y
                }
                tmp = tmp.getParent()
            }
        }
        p(e, t, d, y, g, S, c(o), c(s), h, f, l, m)
    }

    function y(t, n, r, i, s, o, a) {
        var f = t[0];
        var l = f.getContext("2d");
        u.$canvas = t;
        u.render(l, n, r, i, s, o, a, e.zoomFactor)
    }

    function S(e, t) {
        var n = e.getParent();
        var r = e.getDepth();
        var i = e.getPluginData("layout", "offset").x;
        var s = e.getPluginData("layout", "offset").y;
        t = t || e.getPluginData("style", "branchColor");
        var o = c(e);
        var u = c(n);
        var a = f(e);
        y(a, r, i, s, o, u, t)
    }

    function x(e) {
        function i() {
            if (n && t.commit) {
                t.commit(t.node, r.val())
            }
        }

        function o() {
            setTimeout(function() {
                e.redrawNodeConnectors(t.node)
            }, 1)
        }
        var t = this;
        var n = false;
        var r = $("<textarea/>", {
            id: "caption-editor",
            "class": "node-text-behaviour"
        }).bind("keydown", "esc", function() {
            t.stop()
        }).bind("keydown", "return", function() {
            i()
        }).mousedown(function(e) {
            e.stopPropagation()
        }).blur(function() {
            i()
        }).bind("input", function() {
            var n = s.getTextMetrics(t.node, e.zoomFactor, r.val());
            r.css(n);
            o()
        });
        this.edit = function(o, u) {
            if (n) {
                return
            }
            this.node = o;
            n = true;
            var a = o.getPluginData("image", "data");
            this.$text = h(o);
            this.$cancelArea = u;
            this.text = this.$text.text();
            this.$text.css({
                width: "auto",
                height: "auto"
            }).empty().addClass("edit");
            u.bind("mousedown.editNodeCaption", function(e) {
                i()
            });
            var f = s.getTextMetrics(t.node, e.zoomFactor, this.text);
            r.attr({
                value: this.text
            }).css(f).appendTo(this.$text).select();
            if (a) {
                if (a.align == "bottom") this.$text.css({
                    "padding-top": "0px",
                    "text-align": "center"
                });
                if (a.align == "top") this.$text.css({
                    height: f.fontH,
                    "padding-top": "" + this.zoomFactor * a.height + "px",
                    "text-align": "center"
                });
                if (a.align == "left") this.$text.css({
                    width: f.width,
                    height: f.height,
                    "padding-top": "0px",
                    "text-align": "right"
                });
                if (a.align == "center") this.$text.css({
                    width: f.width,
                    height: f.height,
                    "padding-top": "0px",
                    "text-align": "center"
                });
                if (a.align == "right") this.$text.css({
                    width: f.width,
                    height: f.height,
                    "padding-top": "0px",
                    "text-align": "left"
                })
            }
        };
        this.stop = function() {
            if (n) {
                n = false;
                this.$text.removeClass("edit");
                r.detach();
                this.$cancelArea.unbind("mousedown.editNodeCaption");
                e.setNodeText(this.node, this.text);
                o()
            }
        }
    }

    function T(e) {
        var t = this;
        var n = false;
        this.node = null;
        this.lineColor = null;
        var r = $("<div/>", {
            id: "creator-wrapper"
        }).bind("remove", function(e) {
            t.detach();
            e.stopImmediatePropagation();
            console.debug("creator detached.");
            return false
        });
        var i = $("<div/>", {
            id: "creator-nub"
        }).appendTo(r);
        var s = $("<div/>", {
            id: "creator-fakenode"
        }).appendTo(i);
        var o = $("<canvas/>", {
            id: "creator-canvas",
            "class": "line-canvas"
        }).hide().appendTo(r);
        r.draggable({
            revert: true,
            revertDuration: 0,
            start: function() {
                n = true;
                o.show();
                if (t.dragStarted) {
                    t.lineColor = t.dragStarted(t.node)
                }
            },
            drag: function(n, r) {
                var i = r.position.left / e.zoomFactor;
                var u = r.position.top / e.zoomFactor;
                var a = c(t.node);
                y(o, t.depth + 1, i, u, s, a, t.lineColor)
            },
            stop: function(i, s) {
                n = false;
                o.hide();
                if (t.dragStopped) {
                    var u = r.position();
                    var a = u.left / e.zoomFactor;
                    var f = u.top / e.zoomFactor;
                    var l = s.position.left / e.zoomFactor;
                    var c = s.position.top / e.zoomFactor;
                    var h = mindmaps.Util.distance(a - l, f - c);
                    t.dragStopped(t.node, l, c, h)
                }
                r.css({
                    left: "",
                    top: ""
                })
            }
        });
        this.attachToNode = function(t) {
            if (this.node === t) {
                return
            }
            this.node = t;
            r.removeClass("left right");
            if (t.getPluginData("layout", "offset").x > 0) {
                r.addClass("right")
            } else if (t.getPluginData("layout", "offset").x < 0) {
                r.addClass("left")
            }
            var n = c(t);
            this.depth = t.getDepth();
            var i = e.getLineWidth(n, this.depth + 1);
            s.css("border-bottom-width", i);
            r.appendTo(n)
        };
        this.detach = function() {
            r.detach();
            this.node = null
        };
        this.isDragging = function() {
            return n
        }
    }
    var e = this;
	var exx = this;
    var t = false;
    var A = null;
    var N = null;
    var L = false;
    var K = null;
    var selectedConn = null;
    var I = null;
    var j = null;
    var n = new T(this);
    var i = new x(this);
    i.commit = function(t, n) {
        if (e.nodeCaptionEditCommitted) {
            e.nodeCaptionEditCommitted(t, n)
        }
    };
    var s = mindmaps.TextMetrics;
    var o = new mindmaps.CanvasConnectorDrawer;
    o.beforeDraw = function(e, t, n, r) {
        this.$canvas.attr({
            width: e,
            height: t
        }).css({
            left: n,
            top: r
        })
    };
    var u = new mindmaps.CanvasBranchDrawer;
    u.beforeDraw = function(e, t, n, r) {
        this.$canvas.attr({
            width: e,
            height: t
        }).css({
            left: n,
            top: r
        })
    };
    this.init = function() {
        a();
        k();
        this.center();
        var t = this.$getDrawingArea();
        t.addClass("mindmap");
        t.on("mousedown.imageSelection", function(n) {
            if ($(n.target).closest(".node-image-selection, .node-image-corner").length) {
                return
            }
            if (!$(n.target).closest("div.node-caption").length) {
                B()
            }
            if (!$(n.target).is("canvas[id^='node-connector-canvas-']")) {
                if (selectedConn) {
                    var sc = selectedConn;
                    selectedConn = null;
                    var sf = $("#node-" + sc.from).data("node");
                    if (sf) e.redrawConnections(sf)
                }
            }
        });
        t.on("mousedown.canvasContextMenu", function(n) {
            if (n.which !== 1 || !A || !A.is(":visible")) {
                return
            }
            if ($(n.target).closest("#node-context-menu").length) {
                return
            }
            e.hideNodeContextMenu()
        });
        t.delegate("div.node-caption", "mousedown", function(t) {
            var n = $(this).parent().data("node");
            mindmaps.connectPendingAnchor = null;
            if (e.nodeMouseDown) {
                e.nodeMouseDown(n)
            }
        });
        t.delegate("canvas[id^='node-connector-canvas-']", "mousedown", function(t) {
            if (t.which !== 1) {
                return
            }
            var n = U($(this));
            if (!n) {
                return
            }
            var oldSel = selectedConn;
            var wasSame = oldSel && String(oldSel.from) === String(n.from) && oldSel.canvasId === n.canvasId;
            selectedConn = n;
            if (oldSel && !wasSame) {
                var oldFrom = $("#node-" + oldSel.from).data("node");
                if (oldFrom) e.redrawConnections(oldFrom)
            }
            var fromN = $("#node-" + n.from).data("node");
            if (fromN) e.redrawConnections(fromN);
            var vPt = V(n);
            var wPt = W(n);
            var dragType = null;
            if (vPt && mindmaps.Util.distance(t.pageX - vPt.x, t.pageY - vPt.y) <= 18) {
                dragType = "to"
            } else if (wPt && mindmaps.Util.distance(t.pageX - wPt.x, t.pageY - wPt.y) <= 18) {
                dragType = "from"
            }
            if (!dragType) {
                return
            }
            t.preventDefault();
            t.stopPropagation();
            K = {
                connection: n,
                type: dragType,
                startAnchorX: dragType === "to" ? ("number" == typeof n.toAnchorX ? n.toAnchorX : null) : ("number" == typeof n.fromAnchorX ? n.fromAnchorX : null),
                startAnchorY: dragType === "to" ? ("number" == typeof n.toAnchorY ? n.toAnchorY : null) : ("number" == typeof n.fromAnchorY ? n.fromAnchorY : null),
                moved: false
            };
            $("body").css("cursor", "crosshair");
            $(document).on("mousemove.connectorAnchor", function(t) {
                if (!K || !K.connection) {
                    return
                }
                var nodeId = K.type === "to" ? K.connection.to : K.connection.from;
                var anchor = $("#node-caption-" + nodeId);
                if (!anchor.length) {
                    anchor = $("#node-" + nodeId)
                }
                if (!anchor.length) {
                    return
                }
                var r = anchor.offset();
                var i = anchor.outerWidth() || 1;
                var s = anchor.outerHeight() || 1;
                var ax = q((t.pageX - r.left) / i, -.15, 1.15);
                var ay = q((t.pageY - r.top) / s, -.15, 1.15);
                if (K.type === "to") {
                    K.connection.toAnchorX = ax;
                    K.connection.toAnchorY = ay
                } else {
                    K.connection.fromAnchorX = ax;
                    K.connection.fromAnchorY = ay
                }
                K.moved = true;
                var o = $("#node-" + K.connection.from).data("node");
                if (o) {
                    e.redrawConnections(o)
                }
            });
            $(document).on("mouseup.connectorAnchor", function() {
                if (!K) {
                    return
                }
                $(document).off("mousemove.connectorAnchor mouseup.connectorAnchor");
                $("body").css("cursor", "");
                var t = K;
                K = null;
                if (!t.connection || !t.moved) {
                    return
                }
                var finalX, finalY;
                if (t.type === "to") {
                    finalX = t.connection.toAnchorX;
                    finalY = t.connection.toAnchorY;
                    t.connection.toAnchorX = t.startAnchorX;
                    t.connection.toAnchorY = t.startAnchorY
                } else {
                    finalX = t.connection.fromAnchorX;
                    finalY = t.connection.fromAnchorY;
                    t.connection.fromAnchorX = t.startAnchorX;
                    t.connection.fromAnchorY = t.startAnchorY
                }
                var fromNode = $("#node-" + t.connection.from).data("node");
                var toNode = $("#node-" + t.connection.to).data("node");
                if (fromNode && toNode && e.connectionAnchorMoved) {
                    e.connectionAnchorMoved(fromNode, toNode, {
                        type: t.type,
                        anchorX: finalX,
                        anchorY: finalY
                    })
                } else {
                    if (t.type === "to") {
                        t.connection.toAnchorX = finalX;
                        t.connection.toAnchorY = finalY
                    } else {
                        t.connection.fromAnchorX = finalX;
                        t.connection.fromAnchorY = finalY
                    }
                    mindmaps.isMapLoadingConfirmationRequired = !0
                }
            })
        });
        t.delegate("canvas[id^='node-connector-canvas-']", "mousemove", function(t) {
            var n = U($(this));
            if (!n) {
                this.style.cursor = "";
                return
            }
            var vPt = V(n);
            var wPt = W(n);
            var near = (vPt && mindmaps.Util.distance(t.pageX - vPt.x, t.pageY - vPt.y) <= 20) ||
                       (wPt && mindmaps.Util.distance(t.pageX - wPt.x, t.pageY - wPt.y) <= 20);
            this.style.cursor = near ? "crosshair" : ""
        });
        t.delegate("canvas[id^='node-connector-canvas-']", "mouseleave", function() {
            this.style.cursor = ""
        });
        t.delegate("div.node-caption", "mouseup", function(t) {
            var n = $(this).parent().data("node");
            if (e.nodeMouseUp) {
                e.nodeMouseUp(n)
            }
        });
        t.delegate("div.node-caption", "dblclick", function(t) {
            var n = $(this).parent().data("node");
            if (e.nodeDoubleClicked) {
                e.nodeDoubleClicked(n)
            }
        });
        t.delegate("div.node-caption", "click", function(t) {
            if ($(t.target).closest(".node-image-selection, .node-image-corner").length) {
                return
            }
            var n = $(this).parent().data("node");
            if (!n) {
                B();
                return
            }
            var r = D.call(e, n);
            if (!r) {
                B();
                return
            }
            var i = $(this).offset();
            var s = t.pageX - i.left;
            var o = t.pageY - i.top;
            var u = s >= r.left && s <= r.left + r.width && o >= r.top && o <= r.top + r.height;
            if (u) {
                j = n.id;
                O(n, n.getPluginData("image", "data"))
            } else {
                B()
            }
        });
        t.delegate("div.node-caption", "contextmenu", function(t) {
            var n = $(this).parent().data("node");
            if (e.nodeContextMenuRequested) {
                e.nodeContextMenuRequested(n, {
                    x: t.pageX,
                    y: t.pageY
                })
            }
            t.preventDefault();
            return false
        });
        t.delegate("div.node-container", "mouseover", function(t) {
            if (t.target === this) {
                var n = $(this).data("node");
                if (e.nodeMouseOver) {
                    e.nodeMouseOver(n)
                }
            }
            return false
        });
        t.delegate("div.node-caption", "mouseover", function(t) {
            if (t.target === this) {
                var n = $(this).parent().data("node");
                if (e.nodeCaptionMouseOver) {
                    e.nodeCaptionMouseOver(n)
                }
            }
            return false
        });
        this.$getContainer().bind("mousewheel", function(t) {
            var n = t.originalEvent.wheelDelta || -t.originalEvent.detail;
            if (e.mouseWheeled) {
                e.mouseWheeled(n)
            }
        });
        if (mindmaps.responsive.isTouchDevice) {
            this.$getContainer().hammer({}).bind("transform", function(t) {
                console.log(t);
                if (e.pinch) {
                    e.pinch(t.scale)
                }
            }).bind("dragstart", function(t) {
                window.xstart = e.$getContainer().scrollLeft();
                window.ystart = e.$getContainer().scrollTop();
                var n = t.originalEvent.touches;
                if (n.length == 1) {
                    var r = n[0].target;
                    if (r && r.className.search("node-caption") > -1 && r.className.search("root") <= -1) {
                        console.log("on node but no root");
                        window.dragOnNode = true;
                        window.dragTarget = r;
                        var i = $(r).parent();
                        window.beginDragX = i.position().left;
                        window.beginDragY = i.position().top
                    } else {
                        window.dragOnNode = false
                    }
                } else {
                    window.dragOnNode = false
                }
            }).bind("drag", function(t) {
                if (window.dragOnNode) {
                    var n = $(window.dragTarget).parent();
                    var r = n.data("node");
                    var i = window.beginDragX + t.distanceX;
                    var s = window.beginDragY + t.distanceY;
                    window.draggingLeft = i;
                    window.draggingTop = s;
                    n.css("left", i);
                    n.css("top", s);
                    var o = i / e.zoomFactor;
                    var u = s / e.zoomFactor;
                    var a = r.getPluginData("style", "branchColor");
                    var l = f(r);
                    var h = r.getDepth();
                    y(l, h, o, u, c(r), c(r.parent), a);
                    d(r, h, o, u);
                    if (e.nodeDragging) {
                        e.nodeDragging()
                    }
                } else {
                    var p = t.originalEvent.touches;
                    var v = p[0].target;
                    if (v.id == "drawing-area") {
                        var m = e.$getContainer();
                        m.scrollLeft(window.xstart - t.distanceX).scrollTop(window.ystart - t.distanceY)
                    }
                }
            }).bind("dragend", function(t) {
                if (window.dragOnNode) {
                    var n = $(window.dragTarget).parent();
                    var r = n.data("node");
                    if (e.nodeDragged) {
                        var i = new mindmaps.Point(window.draggingLeft / e.zoomFactor, window.draggingTop / e.zoomFactor);
                        e.nodeDragged(r, i)
                    }
                    window.dragOnNode = false
                }
            }).bind("doubletap", function(t) {
                e.tow_tap()
            }).bind("tap", function(t) {
                var n = t.originalEvent.touches;
                if (n.length == 1) {
                    var r = n[0].target;
                    if (r && r.className.search("node-caption") > -1) {
                        console.log("on node");
                        e.nodeMouseDown($(r).parent().data("node"))
                    }
                }
            })
        }
    };
    this.clear = function() {
        var e = this.$getDrawingArea();
        e.children().remove();
        e.width(0).height(0)
    };
    this.getLineWidth = function(e, t) {
        return mindmaps.CanvasDrawingUtil.getLineWidth(e, this.zoomFactor, t)
    };
    this.drawMap = function(t) {
        var n = (new Date).getTime();
        var r = this.$getDrawingArea();
        r.children().remove();
        var i = t.root;
        var s = false;
        if (s) {
            var o = r.parent();
            r.detach();
            e.createNode(i, r);
            r.appendTo(o)
        } else {
            e.createNode(i, r)
        }
        console.debug("draw map ms: ", (new Date).getTime() - n)
    };
    var b, w, E;
    this.createNode = function(n, r, i) {
        var o = n.getParent();
        var r = r || c(o);
        var i = i || n.getDepth();
        var u = n.getPluginData("layout", "offset");
        var a = u ? u.x : 0;
        var l = u ? u.y : 0;
        var h = $("<div/>", {
            id: "node-" + n.id,
            "class": "node-container"
        }).data({
            node: n
        }).css({
            "font-size": n.getPluginData("style", "font").size
        });
        h.appendTo(r);
        if (n.isRoot()) {
            var p = this.getLineWidth(h, i);
            h.css("border-bottom-width", p)
        }
        if (!n.isRoot()) {
            var v = this.getLineWidth(h, i);
            var m = n.getPluginData("style", "branchColor");
            var g = v + "px solid " + m;
            h.css({
                left: this.zoomFactor * a,
                top: this.zoomFactor * l,
                "border-bottom": g
            });
            h.one("mouseenter", function() {
                h.draggable({
                    handle: "div.node-caption:first",
                    start: function() {
                        t = true
                    },
                    drag: function(t, s) {
                        var o = s.position.left / e.zoomFactor;
                        var u = s.position.top / e.zoomFactor;
                        var a = n.getPluginData("style", "branchColor");
                        var l = f(n);
                        y(l, i, o, u, h, r, a);
                        b = n.id;
                        w = o;
                        E = u;
                        d(n, i, o, u, true);
                        if (e.nodeDragging) {
                            e.nodeDragging()
                        }
                    },
                    stop: function(r, i) {
                        t = false;
                        var s = new mindmaps.Point(i.position.left / e.zoomFactor, i.position.top / e.zoomFactor);
                        if (e.nodeDragged) {
                            e.nodeDragged(n, s)
                        }
                    }
                })
            })
        }
        var S = n.getPluginData("style", "font");
        var x = $("<div/>", {
            id: "node-caption-" + n.id,
            "class": "node-caption node-text-behaviour border",
            text: n.text.caption
        }).css({
            color: S.color,
            "font-size": this.zoomFactor * 100 + "%",
            "font-weight": S.weight,
            "font-style": S.style,
            "font-family": S.fontfamily,
            "text-decoration": S.decoration,
            "background-size": "40px 30px"
        }).appendTo(h);
        var T = s.getTextMetrics(n, this.zoomFactor);
        x.css(T);
        var N = $("<div/>", {
            id: "node-pluginIcons-" + n.id,
            "class": "node-pluginIcons"
        }).css("width", "100%");
        mindmaps.util.plugins.ui.createOnNode(N, n);
        var C = r.data("foldButton");
        var k = n.isRoot() || o.isRoot();
        if (!C && !k) {
            this.createFoldButton(o)
        }
        if (!n.isRoot()) {
            if (o.getPluginData("layout", "foldChildren")) {
                h.hide()
            } else {
                h.show()
            }
            var L = $("<canvas/>", {
                id: "node-canvas-" + n.id,
                "class": "line-canvas"
            });
            y(L, i, a, l, h, r, n.getPluginData("style", "branchColor"));
            L.appendTo(h)
        }
        var A = mindmaps.getConnectedNodes().filter(function(e) {
            return e.from == n.id
        });
        A.forEach(function(e) {
            if ($("#node-connector-canvas-" + e.from + "-" + e.canvasId).length <= 0) {
                var t = $("<canvas/>", {
                    id: "node-connector-canvas-" + e.from + "-" + e.canvasId,
                    "class": "line-canvas"
                });
                if ($("#node-" + e.from).length) t.appendTo($("#node-" + e.from))
            }
        });
        d(n, i, n.getPluginData("layout", "offset").x, n.getPluginData("layout", "offset").y);
        if (n.isRoot()) {
            h.children().andSelf().addClass("root")
        }
        n.forEachChild(function(t) {
            e.createNode(t, h, i + 1)
        });
        _.chain(mindmaps.plugins).each(function(e, t) {
            e.onCreateNode(n)
        })
        //this 3 statement created by ms to click on plugin icon
        $("#node-draw-" + n.id).on('click', function() {
            exx.pluginclick($("#node-" + n.id).data("node"),'draw');
        })
        $("#node-url-" + n.id).on('click', function() {
            exx.pluginclick($("#node-" + n.id).data("node"),'url');
        })
    };
    this.deleteNode = function(e) {
        var t = c(e);
        t.remove()
    };
    this.highlightNode = function(e) {
        var t = h(e);
        t.addClass("selected");
        this.updateNode(e)
    };
    this.unhighlightNode = function(e) {
        var t = h(e);
        t.removeClass("selected");
        this.updateNode(e)
    };
    this.closeNode = function(e) {
        var t = c(e);
        t.children(".node-container").hide();
        var n = t.children(".button-fold").first();
        n.removeClass("open").addClass("closed")
    };
    this.openNode = function(e) {
        var t = c(e);
        t.children(".node-container").show();
        var n = t.children(".button-fold").first();
        n.removeClass("closed").addClass("open")
    };
    this.createFoldButton = function(t) {
        var n = t.getPluginData("layout", "offset").x > 0 ? " right" : " left";
        var r = t.getPluginData("layout", "foldChildren") ? " closed" : " open";
        var i = $("<div/>", {
            "class": "button-fold no-select" + r + n
        }).click(function(n) {
            if (e.foldButtonClicked) {
                e.foldButtonClicked(t)
            }
            n.preventDefault();
            return false
        });
        var s = c(t);
        s.data({
            foldButton: true
        }).append(i)
    };
    this.removeFoldButton = function(e) {
        var t = c(e);
        t.data({
            foldButton: false
        }).children(".button-fold").remove()
    };
    this.editNodeCaption = function(e) {
        i.edit(e, this.$getDrawingArea())
    };
    this.stopEditNodeCaption = function() {
        i.stop()
    };
    this.showNodeContextMenu = function(t, n, r) {
        var i = M();
        var s = i.children("ul").first();
        s.empty();
        N = t;
        (r || []).forEach(function(e) {
            if (e.type === "separator") {
                s.append($("<li/>", {
                    "class": "separator"
                }));
                return
            }
            if (e.type === "group-title") {
                s.append($("<li/>", {
                    "class": "group-title",
                    text: e.label
                }));
                return
            }
            var t = $("<li/>", {
                text: e.label
            }).data("action", e.id);
            if (e.enabled === false) {
                t.addClass("disabled")
            }
            s.append(t)
        });
        if (!s.children().length) {
            return
        }
        i.css({
            left: n.x,
            top: n.y,
            display: "block"
        });
        var o = $(window);
        var u = i.outerWidth();
        var a = i.outerHeight();
        var f = o.scrollLeft();
        var l = o.scrollTop();
        var c = f + o.width();
        var h = l + o.height();
        var p = n.x;
        var d = n.y;
        if (p + u > c - 8) {
            p = Math.max(f + 8, c - u - 8)
        }
        if (d + a > h - 8) {
            d = Math.max(l + 8, h - a - 8)
        }
        i.css({
            left: p,
            top: d
        })
    };
    this.hideNodeContextMenu = function() {
        if (A) {
            A.hide()
        }
        N = null
    };
    this.setNodeText = function(e, t) {
        var n = h(e);
        var r = s.getTextMetrics(e, this.zoomFactor, t);
        n.css(r).text(t);
        mindmaps.util.plugins.ui.placeOnNode(mindmaps.util.plugins.ui.pluginIcons(e), e)
    };
    this.getCreator = function() {
        return n
    };
    this.isNodeDragging = function() {
        return t
    };
    this.redrawNodeConnectors = function(e) {
        if (!e.isRoot()) {
            S(e)
        }
        if (!e.isLeaf()) {
            e.forEachChild(function(e) {
                S(e)
            })
        }
    };
    this.redrawConnections = function(e) {
        d(e, e.getDepth(), e.getPluginData("layout", "offset").x, e.getPluginData("layout", "offset").y)
    };
    this.updateBranchColor = function(e, t) {
        var n = c(e);
        n.css("border-bottom-color", t);
        if (!e.isRoot()) {
            S(e, t)
        }
    };
    this.updateFontColor = function(e, t) {
        var n = h(e);
        n.css("color", t)
    };
    this.updateNode = function(e) {
        var t = this.selectedNode === e;
        var n = c(e);
        if (!n.length) return;
        var r = h(e);
        r.find(".node-image-selection").remove();
        var i = e.getPluginData("style", "font");
        var o = e.getPluginData("style", "border") || {
            visible: false,
            style: "none",
            color: "#ffffff",
            background: "#ffffff"
        };
        if (o.style !== "solid" && o.style !== "dashed" && o.style !== "none") {
            o.style = "dashed"
        }
        var borderVisible = o.visible !== false && o.style !== "none";
        if (o.style === "none") {
            borderVisible = false
        }
        var u = e.getPluginData("image", "data");
        if (u) {
            bkgrndsize = "" + this.zoomFactor * parseInt(u.width) + "px " + this.zoomFactor * parseInt(u.height) + "px";
            bkgrnd = "url('" + u.data + "') no-repeat " + u.align
        }
        var a = this.getLineWidth(n, e.getDepth());
        n.css({
            "font-size": i.size,
            "border-bottom-width": a,
            "border-bottom-color": e.getPluginData("style", "branchColor")
        });
        var f = s.getTextMetrics(e, this.zoomFactor);
        r.css({
            color: i.color,
            "font-weight": i.weight,
            "font-style": i.style,
            "font-family": i.fontfamily,
            "text-decoration": i.decoration,
            "background-color": o.background,
            background: "",
            "background-size": ""
        });
        if (u) {
            if (u.align == "top") r.css({
                width: f.width,
                height: f.height - this.zoomFactor * u.height,
                "padding-top": "" + this.zoomFactor * u.height + "px",
                "text-align": "center"
            });
            else if (u.align == "center") {
                r.css({
                    width: f.width,
                    height: f.height,
                    "padding-top": "0px",
                    "text-align": "center"
                });
                if (u.height > f.fontH) r.css({
                    "padding-top": "" + (f.height / 2 - f.fontH / 2 - 1) + "px",
                    height: f.height - (f.height / 2 - f.fontH / 2 - 1)
                })
            } else if (u.align == "bottom") r.css({
                width: f.width,
                height: f.height,
                "padding-top": "0px",
                "text-align": "center"
            });
            else if (u.align == "right") r.css({
                width: f.width,
                height: f.height - (f.height / 2 - f.fontH / 2 - 1),
                "padding-top": "" + (f.height / 2 - f.fontH / 2 - 1) + "px",
                "text-align": "left"
            });
            else if (u.align == "left") r.css({
                width: f.width,
                height: f.height - (f.height / 2 - f.fontH / 2 - 1),
                "padding-top": "" + (f.height / 2 - f.fontH / 2 - 1) + "px",
                "text-align": "right"
            })
        } else r.css({
            width: f.width,
            height: f.height,
            "padding-top": "0px",
            "text-align": "center"
        });
        if (u) {
            r.css("background", bkgrnd);
            r.css("background-size", bkgrndsize);
            r.css("background-color", o.background)
        } else r.css("background-color", o.background); {
            if (!borderVisible && r.hasClass("border")) r.removeClass("border");
            if (borderVisible && !r.hasClass("border")) r.addClass("border");
            if (borderVisible) {
                var l = "#node-caption-" + e.id + ".border";
                $(l).css({
                    "border-style": o.style,
                    "border-color": o.color
                })
            }
            if (borderVisible) {
                $("#inspector-border-color-picker").removeAttr("disabled")
            } else {
                $("#inspector-border-color-picker").attr("disabled", "disabled")
            }
        }
        if (t && u && j === e.id) {
            O(e, u)
        } else if (j === e.id && (!t || !u)) {
            B()
        }
        _.chain(mindmaps.plugins).sortBy("startOrder").each(function(n, r) {
            n.onNodeUpdate(e, t)
        });
        var p = $("#node-pluginIcons-" + e.id);
        mindmaps.util.plugins.ui.placeOnNode(p, e);
        this.redrawNodeConnectors(e);
        d(e, e.getDepth(), e.getPluginData("layout", "offset").x, e.getPluginData("layout", "offset").y)
    };
    this.positionNode = function(e) {
        var t = c(e);
        t.css({
            left: this.zoomFactor * e.getPluginData("layout", "offset").x,
            top: this.zoomFactor * e.getPluginData("layout", "offset").y
        });
        S(e)
    };
    this.scaleMap = function() {
        function f(n, r) {
            var i = c(n);
            var o = e.getLineWidth(i, r);
            i.css({
                left: t * n.getPluginData("layout", "offset").x,
                top: t * n.getPluginData("layout", "offset").y,
                "border-bottom-width": o
            });
            var u = h(n);
            u.css({
                "font-size": t * 100 + "%"
            });
            var a = s.getTextMetrics(n, e.zoomFactor);
            u.css(a);
            var l = $("#node-pluginIcons-" + n.id);
            mindmaps.util.plugins.ui.placeOnNode(l, n);
            l.css({
                "font-size": t * 100 + "%"
            });
            S(n);
            if (!n.isLeaf()) {
                n.forEachChild(function(e) {
                    f(e, r + 1)
                })
            }
        }
        var t = this.zoomFactor;
        var n = this.$getDrawingArea().children().first();
        var r = n.data("node");
        var i = this.getLineWidth(n, 0);
        n.css("border-bottom-width", i);
        var o = h(r);
        var u = s.getTextMetrics(r, this.zoomFactor);
        o.css({
            "font-size": t * 100 + "%",
            left: t * -mindmaps.TextMetrics.ROOT_CAPTION_MIN_WIDTH / 2
        }).css(u);
        var a = $("#node-pluginIcons-" + r.id);
        mindmaps.util.plugins.ui.placeOnNode(a, r);
        a.css({
            "font-size": t * 100 + "%"
        });
        r.forEachChild(function(e) {
            f(e, 1)
        })
    }
};
mindmaps.DefaultCanvasView.prototype = new mindmaps.CanvasView