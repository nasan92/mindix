mindmaps.CanvasDrawingUtil = {
    getLineWidth: function(e, t, n) {
        var r = e;
        if (e.data) r = e.data().node;
        var i = t * (12 - n * 2);
        var s = 0;
        if (r !== undefined) {
            s = r.getLineWidthOffset()
        }
        i += s;
        if (i < 2) {
            i = 2
        }
        return i
    },
    roundedRect: function(t, n, r, i, s, o) {
        t.beginPath();
        t.moveTo(n, r + o);
        t.lineTo(n, r + s - o);
        t.quadraticCurveTo(n, r + s, n + o, r + s);
        t.lineTo(n + i - o, r + s);
        t.quadraticCurveTo(n + i, r + s, n + i, r + s - o);
        t.lineTo(n + i, r + o);
        t.quadraticCurveTo(n + i, r, n + i - o, r);
        t.lineTo(n + o, r);
        t.quadraticCurveTo(n, r, n, r + o);
        t.stroke();
        t.fill()
    }
};
mindmaps.CanvasConnectorDrawer = function() {
    this.beforeDraw = function(e, t, n, r) {};
    this.render = function(e, t, n, r, i, s, o, u, a, f, l, c, h) {
        function D(e, t) {
            try {
                e.setLineDash(t)
            } catch (n) {
                try {
                    e.mozDash = t
                } catch (n) {} finally {}
            } finally {}
        }

        function P(e, t, n) {
            if (!isFinite(e)) {
                return t
            }
            return Math.max(t, Math.min(n, e))
        }

        function O(t, n, r) {
            e.save();
            e.beginPath();
            e.translate(t, n);
            e.rotate(r);
            e.moveTo(0, 0);
            e.lineTo(5, 20);
            e.lineTo(-5, 20);
            e.closePath();
            e.restore();
            e.fill()
        }

        function N(t, n) {
            e.save();
            e.beginPath();
            e.fillStyle = "#4A90E2";
            e.strokeStyle = "#1a6fc4";
            e.lineWidth = 3;
            e.shadowColor = "rgba(0, 0, 0, 0.28)";
            e.shadowBlur = 5;
            e.arc(t, n, 7, 0, Math.PI * 2, false);
            e.fill();
            e.stroke();
            e.restore()
        }

        function M(e, t) {
            var n = e.x + e.w / 2;
            var r = e.y + e.h / 2;
            var i = t.x - n;
            var s = t.y - r;
            if (!i && !s) {
                return {
                    x: n,
                    y: r
                }
            }
            var o = i ? e.w / 2 / Math.abs(i) : Number.POSITIVE_INFINITY;
            var u = s ? e.h / 2 / Math.abs(s) : Number.POSITIVE_INFINITY;
            var a = Math.min(o, u);
            return {
                x: n + i * a,
                y: r + s * a
            }
        }

        function C(t, n, r, i, s) {
            var o = r - t;
            var u = i - n;
            var a = Math.sqrt(o * o + u * u) || 1;
            var f = o / a;
            var l = u / a;
            var c = -l;
            var h = f;
            var p = s && "number" == typeof s.curve1T ? s.curve1T : .28;
            var d = s && "number" == typeof s.curve1N ? s.curve1N : .22;
            var v = s && "number" == typeof s.curve2T ? s.curve2T : .72;
            var m = s && "number" == typeof s.curve2N ? s.curve2N : -.22;
            return {
                c1: {
                    x: t + o * p + c * (d * a),
                    y: n + u * p + h * (d * a)
                },
                c2: {
                    x: t + o * v + c * (m * a),
                    y: n + u * v + h * (m * a)
                }
            }
        }

        function B(t, n, r, i, s, o, u) {
            if (!u || !u.length || !s) {
                return
            }
            var a = u.offset();
            if (!a) {
                return
            }
            s._renderPoints = {
                from: {
                    x: a.left + t,
                    y: a.top + n
                },
                to: {
                    x: a.left + r,
                    y: a.top + i
                }
            };
            if (o) {
                s._renderPoints.c1 = {
                    x: a.left + o.c1.x,
                    y: a.top + o.c1.y
                };
                s._renderPoints.c2 = {
                    x: a.left + o.c2.x,
                    y: a.top + o.c2.y
                }
            }
        }

        function _(t, n, r, i, s) {
            e.strokeStyle = a;
            e.fillStyle = a;
            e.lineWidth = 2;
            if (lineStyle == "dashed") D(e, [8]);
            else if (lineStyle == "dotted") D(e, [3]);
            else if (lineStyle == "solid") D(e, [0]);
            else D(e, []);
            e.beginPath();
            e.moveTo(t, n);
            var h = null;
            if (isCurved) {
                h = C(t, n, r, i, s);
                e.bezierCurveTo(h.c1.x, h.c1.y, h.c2.x, h.c2.y, r, i)
            } else {
                e.lineTo(r, i)
            }
            e.stroke();
            var p = {
                x: r - t,
                y: i - n
            };
            var d = {
                x: p.x,
                y: p.y
            };
            var v = {
                x: p.x,
                y: p.y
            };
            if (h) {
                d = {
                    x: h.c1.x - t,
                    y: h.c1.y - n
                };
                v = {
                    x: r - h.c2.x,
                    y: i - h.c2.y
                }
            }
            if (c == "2") {
                var m = Math.atan2(d.y, d.x) - Math.PI / 2;
                O(t, n, m)
            }
            if (c == "2" || c == "1") {
                var g = Math.atan2(v.y, v.x) + Math.PI / 2;
                O(r, i, g)
            }
            return h
        }

        function oldRender() {
            var eOffsetX = n - i;
            var eOffsetY = r - s;
            var fromWidth = u.width();
            var toWidth = o.width();
            var fromHeight = u.innerHeight();
            var toHeight = o.innerHeight();
            var fromLeft;
            var fromTop;
            var width;
            var height;
            var startAtLeft;
            var startAtTop;
            var toLeft = eOffsetX + toWidth / 2 < fromWidth / 2;
            if (toLeft) {
                var absX = Math.abs(eOffsetX);
                if (absX > toWidth) {
                    width = absX - toWidth + 1;
                    fromLeft = toWidth;
                    startAtLeft = true
                } else {
                    fromLeft = -eOffsetX;
                    width = toWidth + eOffsetX;
                    startAtLeft = false
                }
            } else {
                if (eOffsetX > fromWidth) {
                    width = eOffsetX - fromWidth + 1;
                    fromLeft = fromWidth - eOffsetX;
                    startAtLeft = false
                } else {
                    width = fromWidth - eOffsetX;
                    fromLeft = 0;
                    startAtLeft = true
                }
            }
            if (width < 5) {
                width = 5
            }
            var toAbove = eOffsetY + toHeight < fromHeight;
            if (toAbove) {
                fromTop = toHeight;
                height = -eOffsetY - fromTop;
                startAtTop = true
            } else {
                fromTop = fromHeight - eOffsetY;
                height = -fromTop;
                startAtTop = false
            }
            if (height < 5) {
                height = 5
            }
            this.beforeDraw(width, height, fromLeft, fromTop);
            var startX = startAtLeft ? 0 : width;
            var endX = startAtLeft ? width : 0;
            var startY = startAtTop ? 0 : height;
            var endY = startAtTop ? height : 0;
            var curve = _(startX, startY, endX, endY, h);
            B(startX, startY, endX, endY, h, curve, this.$canvas);
            if (h && h._selected) {
                N(startX, startY);
                N(endX, endY);
                if (isCurved && curve) {
                    N(curve.c1.x, curve.c1.y);
                    N(curve.c2.x, curve.c2.y)
                }
            }
        }

        e.save();
        i = i * f;
        s = s * f;
        n = n * f;
        r = r * f;

        var isCurved = h && "curved" == h.shape || "curved" == l;
        var lineStyle = l;
        if ("dashed" != lineStyle && "dotted" != lineStyle && "solid" != lineStyle) {
            lineStyle = "dashed"
        }

        var hasManualToAnchor = h && "number" == typeof h.toAnchorX && "number" == typeof h.toAnchorY;
        var hasManualFromAnchor = h && "number" == typeof h.fromAnchorX && "number" == typeof h.fromAnchorY;
        var hasManualAnchor = hasManualToAnchor || hasManualFromAnchor;
        if (!hasManualAnchor && !isCurved) {
            oldRender.call(this);
            e.restore();
            return
        }

        var fromRect = {
            x: 0,
            y: 0,
            w: u.outerWidth() || u.width() || 1,
            h: u.innerHeight() || u.height() || 1
        };
        var toRect = {
            x: i - n,
            y: s - r,
            w: o.outerWidth() || o.width() || 1,
            h: o.innerHeight() || o.height() || 1
        };
        var targetPoint = hasManualToAnchor
            ? { x: toRect.x + P(h.toAnchorX, -.15, 1.15) * toRect.w, y: toRect.y + P(h.toAnchorY, -.15, 1.15) * toRect.h }
            : { x: toRect.x + toRect.w / 2, y: toRect.y + toRect.h / 2 };
        var sourcePoint = hasManualFromAnchor
            ? { x: P(h.fromAnchorX, -.15, 1.15) * fromRect.w, y: P(h.fromAnchorY, -.15, 1.15) * fromRect.h }
            : M(fromRect, targetPoint);
        var curveAbs = isCurved ? C(sourcePoint.x, sourcePoint.y, targetPoint.x, targetPoint.y, h) : null;
        var padding = isCurved ? 40 : 20;
        var minX = Math.min(sourcePoint.x, targetPoint.x);
        var maxX = Math.max(sourcePoint.x, targetPoint.x);
        var minY = Math.min(sourcePoint.y, targetPoint.y);
        var maxY = Math.max(sourcePoint.y, targetPoint.y);
        if (curveAbs) {
            minX = Math.min(minX, curveAbs.c1.x, curveAbs.c2.x);
            maxX = Math.max(maxX, curveAbs.c1.x, curveAbs.c2.x);
            minY = Math.min(minY, curveAbs.c1.y, curveAbs.c2.y);
            maxY = Math.max(maxY, curveAbs.c1.y, curveAbs.c2.y)
        }
        var left = minX - padding;
        var top = minY - padding;
        var width = Math.max(2, maxX - minX + 2 * padding);
        var height = Math.max(2, maxY - minY + 2 * padding);
        this.beforeDraw(width, height, left, top);
        var sourceX = sourcePoint.x - left;
        var sourceY = sourcePoint.y - top;
        var targetX = targetPoint.x - left;
        var targetY = targetPoint.y - top;
        var curve = _(sourceX, sourceY, targetX, targetY, h);
        B(sourceX, sourceY, targetX, targetY, h, curve, this.$canvas);
        if (h && h._selected) {
            N(sourceX, sourceY);
            N(targetX, targetY);
            if (isCurved && curve) {
                N(curve.c1.x, curve.c1.y);
                N(curve.c2.x, curve.c2.y)
            }
        }
        e.restore()
    }
};
mindmaps.CanvasBranchDrawer = function() {
    this.beforeDraw = function(e, t, n, r) {};
    this.render = function(e, t, n, r, i, s, o, u) {
        n = n * u;
        r = r * u;
        var a = s.width();
        var f = i.width();
        var l = s.innerHeight();
        var c = i.innerHeight();
        var h, p;
        var d = false;
        var v, m, g, y;
        var b;
        var w = n + f / 2 < a / 2;
        if (w) {
            var E = Math.abs(n);
            if (E > f) {
                g = E - f + 1;
                v = f;
                h = true
            } else {
                v = -n;
                g = f + n;
                h = false;
                d = true
            }
        } else {
            if (n > a) {
                g = n - a + 1;
                v = a - n;
                h = false
            } else {
                g = a - n;
                v = 0;
                h = true;
                d = true
            }
        }
        var S = mindmaps.CanvasDrawingUtil.getLineWidth(i, u, t);
        var x = S / 2;
        if (g < S) {
            g = S
        }
        var T = r + c < l;
        if (T) {
            m = c;
            y = s.outerHeight() - r - m;
            p = true
        } else {
            m = l - r;
            y = i.outerHeight() - m;
            p = false
        }
        this.beforeDraw(g, y, v, m);
        var N, C, k, L;
        if (h) {
            N = 0;
            k = g
        } else {
            N = g;
            k = 0
        }
        var A = mindmaps.CanvasDrawingUtil.getLineWidth(s, u, t - 1);
        var O = (A - S) / 2;
        if (p) {
            C = 0 + x;
            L = y - x - O
        } else {
            C = y - x;
            L = 0 + x + O
        }
        if (!d) {
            var M = N > k ? N / 5 : k - k / 5;
            var _ = L;
            var D = Math.abs(N - k) / 2;
            var P = C
        } else {
            if (h) {
                N += x;
                k -= x
            } else {
                N -= x;
                k += x
            }
            var D = N;
            var P = Math.abs(C - L) / 2;
            var M = k;
            var _ = C > L ? C / 5 : L - L / 5
        }
        e.lineWidth = S;
        e.strokeStyle = o;
        e.fillStyle = o;
        e.beginPath();
        e.moveTo(N, C);
        e.bezierCurveTo(D, P, M, _, k, L);
        e.stroke();
        var H = N;
        var B = C;
        var j = k;
        var F = L;
        var I = false;
        if (I) {
            e.strokeStyle = "#ff0000";
            setLineDashCatch(e, [3]);
            e.moveTo(H, B);
            e.lineTo(j, F);
            e.lineWidth = 1;
            e.stroke();
            setLineDashCatch(e, [0]);
            e.beginPath();
            e.fillStyle = "red";
            e.arc(D, P, 4, 0, Math.PI * 2);
            e.fill();
            e.beginPath();
            e.fillStyle = "green";
            e.arc(M, _, 4, 0, Math.PI * 2);
            e.fill()
        }
    }
};
mindmaps.TextMetrics = function() {
    var e = $("<div/>", {
        "class": "node-text-behaviour"
    }).css({
        position: "absolute",
        visibility: "hidden",
        height: "auto",
        width: "auto"
    }).prependTo($("body"));
    return {
        ROOT_CAPTION_MIN_WIDTH: 100,
        NODE_CAPTION_MIN_WIDTH: 70,
        NODE_CAPTION_MAX_WIDTH: 150,
        getTextMetrics: function(t, n, r) {
            n = n || 1;
            r = r || t.getCaption();
            var i = t.getPluginData("style", "font");
            var s = t.getPluginData("image", "data");
            var o = t.isRoot() ? this.ROOT_CAPTION_MIN_WIDTH : this.NODE_CAPTION_MIN_WIDTH;
            var u = this.NODE_CAPTION_MAX_WIDTH;
            e.css({
                "font-size": n * i.size,
                "min-width": n * o,
                "font-family": i.fontfamily,
                "font-weight": i.weight
            }).text(r);
            if (s) {
                if (s.align == "top" || s.align == "bottom") {
                    var a = Math.max(e.width(), n * parseInt(s.width));
                    var f = e.height() + n * parseInt(s.height)
                } else if (s.align == "center") {
                    var a = Math.max(e.width(), n * parseInt(s.width));
                    var f = Math.max(e.height(), n * parseInt(s.height))
                } else if (s.align == "right" || s.align == "left") {
                    var a = e.width() + n * parseInt(s.width);
                    var f = Math.max(e.height(), n * parseInt(s.height))
                }
            } else {
                var a = e.width();
                var f = e.height()
            }
            var l = parseInt(a + 2);
            var c = parseInt(f + 2);
            return {
                width: l,
                height: c,
                fontW: e.width(),
                fontH: e.height()
            }
        }
    }
}()