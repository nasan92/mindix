mindmaps.ExportMapView = function() {
    var e = this;
    var n = null;
    var r = null;
    var t = $("#template-export-map").tmpl().dialog({
        autoOpen: false,
        modal: true,
        zIndex: 5e3,
        width: "auto",
        height: "auto",
        close: function() {
            $(this).dialog("destroy");
            $(this).remove()
        },
        open: function() {
            $(this).css({
                "max-width": $(window).width() * .9,
                "max-height": $(window).height() * .8
            });
            t.dialog("option", "position", "center")
        },
        buttons: {
            "Download PNG": function() {
                if (typeof n === "function") {
                    n()
                }
            },
            "Download SVG": function() {
                if (typeof r === "function") {
                    r()
                }
            },
            Close: function() {
                $(this).dialog("close")
            }
        }
    });
    this.showDialog = function() {
        t.dialog("open")
    };
    this.hideDialog = function() {
        t.dialog("close")
    };
    this.setDownloadHandlers = function(t, i) {
        n = t;
        r = i
    };
    this.setImage = function(e) {
        $("#export-preview").html(e)
    }
};
mindmaps.StaticSVGRenderer = function() {
    var padding = 8;

    var defaultFont = {
        style: "normal",
        weight: "normal",
        size: 15,
        fontfamily: "sans-serif",
        color: "#000000",
        decoration: "none"
    };

    var defaultBorder = {
        visible: true,
        style: "dashed",
        color: "#ffa500",
        background: "#ffffff"
    };

    function escapeXml(e) {
        return String(e || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;")
    }

    function toNumber(e, t) {
        var n = parseFloat(e);
        return isNaN(n) ? t : n
    }

    function safeOffset(node) {
        var offset = null;
        if (node && typeof node.getPluginData === "function") {
            offset = node.getPluginData("layout", "offset")
        }
        return {
            x: toNumber(offset && offset.x, 0),
            y: toNumber(offset && offset.y, 0)
        }
    }

    function getPositionSafe(node) {
        var point = {
            x: 0,
            y: 0
        };
        var current = node;
        while (current) {
            var offset = safeOffset(current);
            point.x += offset.x;
            point.y += offset.y;
            if (typeof current.getParent === "function") {
                current = current.getParent()
            } else {
                current = current.parent || null
            }
        }
        return point
    }

    function normalizeFont(font) {
        return $.extend(true, {}, defaultFont, font || {})
    }

    function normalizeBorder(border) {
        return $.extend(true, {}, defaultBorder, border || {})
    }

    function lineDash(e) {
        if (e == "dashed") {
            return "8,8"
        }
        if (e == "dotted") {
            return "3,6"
        }
        return ""
    }

    function prepareNodes(e) {
        var t = e.getRoot().cloneForExport();

        function n(e) {
            var t = mindmaps.CanvasDrawingUtil.getLineWidth(e, 1, e.getDepth());
            var metrics;
            try {
                metrics = mindmaps.TextMetrics.getTextMetrics(e, 1)
            } catch (r) {
                var caption = e.getCaption ? e.getCaption() : "";
                metrics = {
                    width: Math.max(40, String(caption || "").length * 8),
                    height: 24,
                    fontW: Math.max(40, String(caption || "").length * 8),
                    fontH: 16
                }
            }
            $.extend(e, {
                lineWidth: t,
                textMetrics: metrics,
                width: function() {
                    if (e.isRoot()) {
                        return 0
                    }
                    return metrics.width
                },
                innerHeight: function() {
                    return metrics.height + padding
                },
                outerHeight: function() {
                    return metrics.height + t + padding
                }
            });
            e.forEachChild(function(e) {
                n(e)
            })
        }

        n(t);
        return t
    }

    function getMindMapDimensions(e) {
        var t = 0,
            n = 0,
            r = 0,
            i = 0;
        var s = 50;

        function o(e) {
            var s = getPositionSafe(e);
            var o = e.textMetrics;
            if (s.x < t) {
                t = s.x
            }
            if (s.x + o.width > r) {
                r = s.x + o.width
            }
            if (s.y < n) {
                n = s.y
            }
            if (s.y + e.outerHeight() > i) {
                i = s.y + e.outerHeight()
            }
        }

        o(e);
        e.forEachDescendant(function(e) {
            o(e)
        });
        var u = Math.max(Math.abs(r), Math.abs(t));
        var a = Math.max(Math.abs(i), Math.abs(n));
        return {
            width: 2 * u + s,
            height: 2 * a + s
        }
    }

    function getNodeById(e, t) {
        if (e.id == t) {
            return e
        }
        var n = null;
        e.forEachChild(function(e) {
            if (n) {
                return
            }
            var r = getNodeById(e, t);
            if (r) {
                n = r
            }
        });
        return n
    }

    function getNodeCenter(e) {
        var t = getPositionSafe(e);
        var n = e.textMetrics;
        if (e.isRoot()) {
            return {
                x: t.x,
                y: t.y + 20 + n.height / 2
            }
        }
        return {
            x: t.x + n.width / 2,
            y: t.y + n.height / 2
        }
    }

    function createArrow(e, t, n, r) {
        var i = n - e;
        var s = r - t;
        var o = Math.sqrt(i * i + s * s);
        if (o === 0) {
            return ""
        }
        var u = i / o;
        var a = s / o;
        var f = -a;
        var l = u;
        var c = 12;
        var h = 6;
        var p = n - u * c;
        var d = r - a * c;
        var v = p + f * h;
        var m = d + l * h;
        var g = p - f * h;
        var y = d - l * h;
        return n + "," + r + " " + v + "," + m + " " + g + "," + y
    }

    function quoteAttr(e) {
        return '"' + escapeXml(e) + '"'
    }

    this.render = function(document) {
        var root = prepareNodes(document.mindmap);
        var dimensions = getMindMapDimensions(root);
        var output = [];

        function pushLine(line) {
            output.push(line)
        }

        function buildTag(tagName, attrs) {
            var attrList = [];
            for (var key in attrs) {
                if (attrs.hasOwnProperty(key) && attrs[key] !== null && attrs[key] !== undefined && attrs[key] !== "") {
                    attrList.push(key + "=" + quoteAttr(attrs[key]))
                }
            }
            return "<" + tagName + (attrList.length ? " " + attrList.join(" ") : "") + ">"
        }

        function openTag(tagName, attrs) {
            pushLine(buildTag(tagName, attrs || {}))
        }

        function closeTag(tagName) {
            pushLine("</" + tagName + ">")
        }

        function addSelfTag(tagName, attrs) {
            pushLine(buildTag(tagName, attrs || {}).replace(/>$/, "/>"))
        }

        function addPath(pathData, attrs) {
            var pathAttrs = attrs || {};
            pathAttrs.d = pathData;
            addSelfTag("path", pathAttrs)
        }

        function drawBranch(childNode, parentNode) {
            var depth = childNode.getDepth();
            var childOffset = safeOffset(childNode);
            var offsetX = childOffset.x;
            var offsetY = childOffset.y;
            var parentWidth = parentNode.width();
            var childWidth = childNode.width();
            var parentInnerHeight = parentNode.innerHeight();
            var childInnerHeight = childNode.innerHeight();
            var leftToRight;
            var childOnTop;
            var hasCrossing = false;
            var left;
            var top;
            var width;
            var height;

            var toLeft = offsetX + childWidth / 2 < parentWidth / 2;
            if (toLeft) {
                var absX = Math.abs(offsetX);
                if (absX > childWidth) {
                    width = absX - childWidth + 1;
                    left = childWidth;
                    leftToRight = true
                } else {
                    left = -offsetX;
                    width = childWidth + offsetX;
                    leftToRight = false;
                    hasCrossing = true
                }
            } else if (offsetX > parentWidth) {
                width = offsetX - parentWidth + 1;
                left = parentWidth - offsetX;
                leftToRight = false
            } else {
                width = parentWidth - offsetX;
                left = 0;
                leftToRight = true;
                hasCrossing = true
            }

            var childLineWidth = mindmaps.CanvasDrawingUtil.getLineWidth(childNode, 1, depth);
            var halfChildLineWidth = childLineWidth / 2;
            if (width < childLineWidth) {
                width = childLineWidth
            }

            var childAboveParent = offsetY + childInnerHeight < parentInnerHeight;
            if (childAboveParent) {
                top = childInnerHeight;
                height = parentNode.outerHeight() - offsetY - top;
                childOnTop = true
            } else {
                top = parentInnerHeight - offsetY;
                height = childNode.outerHeight() - top;
                childOnTop = false
            }

            var startX;
            var startY;
            var endX;
            var endY;
            if (leftToRight) {
                startX = 0;
                endX = width
            } else {
                startX = width;
                endX = 0
            }

            var parentLineWidth = mindmaps.CanvasDrawingUtil.getLineWidth(parentNode, 1, depth - 1);
            var lineOffset = (parentLineWidth - childLineWidth) / 2;
            if (childOnTop) {
                startY = 0 + halfChildLineWidth;
                endY = height - halfChildLineWidth - lineOffset
            } else {
                startY = height - halfChildLineWidth;
                endY = 0 + halfChildLineWidth + lineOffset
            }

            var ctrl1X;
            var ctrl1Y;
            var ctrl2X;
            var ctrl2Y;
            if (!hasCrossing) {
                ctrl2X = startX > endX ? startX / 5 : endX - endX / 5;
                ctrl2Y = endY;
                ctrl1X = Math.abs(startX - endX) / 2;
                ctrl1Y = startY
            } else {
                if (leftToRight) {
                    startX += halfChildLineWidth;
                    endX -= halfChildLineWidth
                } else {
                    startX -= halfChildLineWidth;
                    endX += halfChildLineWidth
                }
                ctrl1X = startX;
                ctrl1Y = Math.abs(startY - endY) / 2;
                ctrl2X = endX;
                ctrl2Y = startY > endY ? startY / 5 : endY - endY / 5
            }

            var childPosition = getPositionSafe(childNode);
            var baseX = childPosition.x + left;
            var baseY = childPosition.y + top;

            addPath("M " + (baseX + startX) + " " + (baseY + startY) + " C " + (baseX + ctrl1X) + " " + (baseY + ctrl1Y) + ", " + (baseX + ctrl2X) + " " + (baseY + ctrl2Y) + ", " + (baseX + endX) + " " + (baseY + endY), {
                fill: "none",
                stroke: childNode.getPluginData("style", "branchColor"),
                "stroke-width": childLineWidth,
                "stroke-linecap": "round"
            })
        }

        function drawAllBranches(node) {
            node.forEachChild(function(child) {
                drawBranch(child, node);
                drawAllBranches(child)
            })
        }

        function drawConnections() {
            var connectedNodes = document.getConnectedNodes ? document.getConnectedNodes() : [];
            if (!connectedNodes || typeof connectedNodes.forEach !== "function") {
                connectedNodes = []
            }
            connectedNodes.forEach(function(connector) {
                var fromNode = getNodeById(root, connector.from);
                var toNode = getNodeById(root, connector.to);
                if (!fromNode || !toNode) {
                    return
                }
                var fromCenter = getNodeCenter(fromNode);
                var toCenter = getNodeCenter(toNode);
                var color = connector.color || "#000000";

                var lineAttrs = {
                    x1: fromCenter.x,
                    y1: fromCenter.y,
                    x2: toCenter.x,
                    y2: toCenter.y,
                    stroke: color,
                    "stroke-width": 2,
                    "stroke-linecap": "round"
                };
                var dash = lineDash(connector.style);
                if (dash) {
                    lineAttrs["stroke-dasharray"] = dash
                }
                addSelfTag("line", lineAttrs);

                if (connector.arrow == "2") {
                    var backArrow = createArrow(toCenter.x, toCenter.y, fromCenter.x, fromCenter.y);
                    if (backArrow) {
                        addSelfTag("polygon", {
                            points: backArrow,
                            fill: color
                        })
                    }
                }
                if (connector.arrow == "1" || connector.arrow == "2") {
                    var frontArrow = createArrow(fromCenter.x, fromCenter.y, toCenter.x, toCenter.y);
                    if (frontArrow) {
                        addSelfTag("polygon", {
                            points: frontArrow,
                            fill: color
                        })
                    }
                }
            })
        }

        function drawNode(node) {
            var position = getPositionSafe(node);
            var textMetrics = node.textMetrics;
            var font = normalizeFont(node.getPluginData("style", "font"));
            var border = normalizeBorder(node.getPluginData("style", "border"));
            var imageData = node.getPluginData("image", "data");

            var boxX;
            var boxY;
            var textX;
            var textY;
            var textAnchor = "middle";

            if (node.isRoot()) {
                boxX = position.x - textMetrics.width / 2 - 4;
                boxY = position.y + 16;
                textX = position.x;
                textY = position.y + 20
            } else {
                boxX = position.x - 4;
                boxY = position.y - 4;
                textX = position.x + textMetrics.width / 2;
                textY = position.y
            }

            var boxWidth = textMetrics.width + 8;
            var boxHeight = textMetrics.height + 8;

            if (imageData) {
                var imageWidth = toNumber(imageData.width, 0);
                var imageHeight = toNumber(imageData.height, 0);

                if (imageData.align == "top") {
                    textY += imageHeight
                } else if (imageData.align == "center") {
                    textY += textMetrics.height / 2 - textMetrics.fontH / 2
                } else if (imageData.align == "right") {
                    textAnchor = "start";
                    textX = boxX + 4;
                    textY += textMetrics.height / 2 - textMetrics.fontH / 2
                } else if (imageData.align == "left") {
                    textAnchor = "end";
                    textX = boxX + textMetrics.width + 6;
                    textY += textMetrics.height / 2 - textMetrics.fontH / 2
                }

                var imageX = boxX + 6;
                var imageY = boxY + 6;
                if (imageData.align == "bottom") {
                    if (textMetrics.fontW > imageWidth) {
                        imageX = boxX + 6 + (textMetrics.fontW - imageWidth) / 2
                    }
                    imageY = boxY + textMetrics.fontH + 8
                } else if (imageData.align == "top") {
                    if (textMetrics.fontW > imageWidth) {
                        imageX = boxX + 6 + (textMetrics.fontW - imageWidth) / 2
                    }
                } else if (imageData.align == "center") {
                    if (textMetrics.fontW > imageWidth) {
                        imageX = boxX + 6 + (textMetrics.fontW - imageWidth) / 2
                    }
                    if (textMetrics.fontH > imageHeight) {
                        imageY = boxY + 6 + (textMetrics.fontH - imageHeight) / 2
                    }
                } else if (imageData.align == "right") {
                    imageX = boxX + 4 + (textMetrics.width - imageWidth);
                    if (textMetrics.fontH > imageHeight) {
                        imageY = boxY + 6 + (textMetrics.fontH - imageHeight) / 2
                    }
                } else if (imageData.align == "left") {
                    if (textMetrics.fontH > imageHeight) {
                        imageY = boxY + 6 + (textMetrics.fontH - imageHeight) / 2
                    }
                }

                addSelfTag("image", {
                    href: imageData.data,
                    x: imageX,
                    y: imageY,
                    width: imageWidth,
                    height: imageHeight
                })
            }

            var strokeColor = border.visible ? border.color : border.background;
            var rectAttrs = {
                x: boxX,
                y: boxY,
                width: boxWidth,
                height: boxHeight,
                rx: 10,
                ry: 10,
                fill: border.background,
                stroke: strokeColor,
                "stroke-width": 5
            };
            var borderDash = lineDash(border.style);
            if (border.visible && borderDash) {
                rectAttrs["stroke-dasharray"] = borderDash
            }
            addSelfTag("rect", rectAttrs);

            var lines = (node.getCaption() || "").split(/\r\n|\r|\n/g);
            var baselineShift = toNumber(font.size, 15) * .8;
            var textAttrs = {
                x: textX,
                y: textY + baselineShift,
                fill: font.color,
                "font-family": font.fontfamily,
                "font-size": font.size,
                "font-style": font.style,
                "font-weight": font.weight,
                "text-anchor": textAnchor
            };
            if (font.decoration && font.decoration != "none") {
                textAttrs["text-decoration"] = font.decoration
            }

            if (lines.length <= 1) {
                pushLine(buildTag("text", textAttrs) + escapeXml(lines[0] || "") + "</text>")
            } else {
                openTag("text", textAttrs);
                for (var i = 0; i < lines.length; i++) {
                    pushLine(buildTag("tspan", {
                        x: textX,
                        y: textY + baselineShift + i * font.size
                    }) + escapeXml(lines[i]) + "</tspan>")
                }
                closeTag("text")
            }

            node.forEachChild(function(child) {
                drawNode(child)
            })
        }

        pushLine('<?xml version="1.0" encoding="UTF-8"?>');
        openTag("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            width: dimensions.width,
            height: dimensions.height,
            viewBox: "0 0 " + dimensions.width + " " + dimensions.height
        });
        addSelfTag("rect", {
            x: 0,
            y: 0,
            width: dimensions.width,
            height: dimensions.height,
            fill: "white"
        });
        openTag("g", {
            transform: "translate(" + dimensions.width / 2 + " " + dimensions.height / 2 + ")"
        });

        drawAllBranches(root);
        drawConnections();
        drawNode(root);

        closeTag("g");
        closeTag("svg");
        return output.join("\n")
    }
};
mindmaps.ExportMapPresenter = function(e, t, n) {
    var r = new mindmaps.StaticCanvasRenderer;
    var s = new mindmaps.StaticSVGRenderer;
    var i = "";
    var a = "mindmap";
    var f = 0;
    var l = 0;

    function c(e) {
        var t = e.split(",");
        var n = t[0].match(/:(.*?);/)[1];
        var r = atob(t[1]);
        var i = r.length;
        var o = new Uint8Array(i);
        while (i--) {
            o[i] = r.charCodeAt(i)
        }
        return new Blob([o], {
            type: n
        })
    }

    function u(e) {
        var t = e || "mindmap";
        return t.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "mindmap"
    }

    this.go = function() {
        var o = t.getDocument();
        var p = r.renderAsCanvas(o);
        var h = p[0];
        i = h.toDataURL("image/png");
        f = h.width;
        l = h.height;
        a = u(o.mindmap.getRoot().getCaption());

        n.setImage($("<img/>", {
            src: i,
            "class": "map"
        }));
        n.setDownloadHandlers(function() {
            window.saveAs(c(i), a + ".png")
        }, function() {
            try {
                var t = s.render(o);
                window.saveAs(new Blob([t], {
                    type: "image/svg+xml;charset=utf-8"
                }), a + ".svg")
            } catch (r) {
                console.error("SVG export failed", r);
                e.publish(mindmaps.Event.NOTIFICATION_WARN, "SVG export failed. Please retry or remove unsupported content and try again.")
            }
        });

        setTimeout(function() {
            n.showDialog()
        }, 30)
    }
}