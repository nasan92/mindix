mindmaps.InspectorView = function() {
    var e = this,
        o = $("#template-inspector").tmpl(),
        n = o.find("#inspector-button-font-face-change"),
        z = $("#inspector-input-font-size", o),
        t = o.find("#inspector-button-connection-arrow-change"),
        c = o.find("#inspector-button-connection-style-change"),
        i = o.find("#inspector-button-border-style"),
        l = $("#inspector-button-line-width-decrease", o),
        a = $("#inspector-button-line-width-increase", o),
        u = $("#inspector-checkbox-font-bold", o),
        C = $("#inspector-checkbox-font-italic", o),
        h = $("#inspector-checkbox-font-underline", o),
        f = $("#inspector-checkbox-font-linethrough", o),
        k = $("#inspector-button-branch-color-children", o),
        b = $("#inspector-button-font-color-children", o),
        p = $("#inspector-button-font-style-children", o),
        m = $("#inspector-button-font-face-children", o),
        v = $("#inspector-button-background-color-children", o),
        g = $("#inspector-button-border-color-children", o),
        A = $("#inspector-button-connect-node", o),
        N = $("#inspector-button-connect-node-remove", o),
        T = $("#inspector-color-theme-select", o),
        F = $("#inspector-checkbox-map-grid", o),
        S = $("#inspector-branch-color-picker", o),
        x = $("#inspector-font-color-picker", o),
        w = $("#inspector-border-color-picker", o),
        P = $("#inspector-connection-color-picker", o),
        y = $("#inspector-border-background-color-picker", o),
        B = $("#inspector-map-background-color-picker", o),
        E = [l, a, u, C, h, f, m, p, b, k, g, v, A, N, F],
        D = [S, x, w, y, P, B];

    function I() {
        var e = ["inspector-section-text", "inspector-section-branch", "inspector-section-node", "inspector-section-map", "inspector-section-levelstyle"];
        e.forEach(function(e) {
            var n = $("#inspector-table tr.inspector-section-row." + e, o);
            n.removeClass("inspector-group-start inspector-group-end");
            if (!n.length) return;
            n.first().addClass("inspector-group-start");
            n.last().addClass("inspector-group-end")
        })
    }

    function M(e) {
        return "solid" === e || "dashed" === e || "none" === e ? e : "dashed"
    }

    function R() {
        var n = $("#inspector-table tr.inspector-section-title-row", o);
        n.each(function(i) {
            var n = $(this),
                t = n.nextUntil("tr.inspector-section-title-row");
            n.addClass("inspector-collapsible-title").attr("data-collapsed", "false");
            n.off("click").on("click", function() {
                var o = "true" === n.attr("data-collapsed");
                n.attr("data-collapsed", o ? "false" : "true");
                t.toggle(o);
                I()
            })
        })
    }

    this.getContent = function() {
        return o
    }, this.setControlsEnabled = function(e) {
        var o = e ? "enable" : "disable";
        E.forEach(function(e) {
            e.button(o)
        }), D.forEach(function(o) {
            o.attr("disabled", e)
        }), z.prop("disabled", !e), _.chain(mindmaps.plugins).sortBy("startOrder").each(function(o) {
            o.inspectorAdviser && o.inspectorAdviser.setControlsEnabled && o.inspectorAdviser.setControlsEnabled(e)
        })
    }, this.setBorderText = function(e) {
        e ? $("#inspector-border-color-picker").removeAttr("disabled") : $("#inspector-border-color-picker").attr("disabled", "disabled")
    }, this.setBorderStyle = function(e) {
        i.val(M(e))
    }, this.setFontFace = function(e) {
        n.val(e)
    }, this.setFontSize = function(e) {
        z.val(e)
    }, this.setConnectStyle = function(e) {
        c.val(e)
    }, this.setConnectArrow = function(e) {
        t.val(e)
    }, this.setBoldCheckboxState = function(e) {
        u.prop("checked", e).button("refresh")
    }, this.setItalicCheckboxState = function(e) {
        C.prop("checked", e).button("refresh")
    }, this.setUnderlineCheckboxState = function(e) {
        h.prop("checked", e).button("refresh")
    }, this.setLinethroughCheckboxState = function(e) {
        f.prop("checked", e).button("refresh")
    }, this.setBorderBackgroundColorPickerColor = function(e) {
        y.val(e).change()
    }, this.setBorderBackgroundColorPickerColor = function(e) {
        y.val(e).change()
    }, this.setBorderColorPickerColor = function(e) {
        w.val(e).change()
    }, this.setConnectColorPickerColor = function(e) {
        P.val(e).change()
    }, this.setMapGridEnabled = function(e) {
        F.prop("checked", !!e).button("refresh")
    }, this.setMapBackgroundColorPickerColor = function(e) {
        B.val(e).change()
    }, this.setBranchColorPickerColor = function(e) {
        S.val(e).change()
    }, this.setFontColorPickerColor = function(e) {
        x.val(e).change()
    }, this.setCurrentTheme = function(e) {
        T.val(e)
    }, this.refreshColorPickers = function() {
        function o(o, n, t) {
            o.next(".colorPicker-picker").remove();
            o.off("change");
            o.colorPicker({
                pickerDefault: n[0],
                colors: n
            });
            o.on("change", function() {
                var n = $(this).val();
                n && t && t(n)
            })
        }
        o(S, mindmaps.Util.colors20, function(o) {
            e.branchColorPicked && e.branchColorPicked(o)
        });
        o(y, mindmaps.Util.colors20c, function(o) {
            e.borderBackgroundColorPicked && e.borderBackgroundColorPicked(o)
        });
        o(w, mindmaps.Util.colors20b, function(o) {
            e.borderColorPicked && e.borderColorPicked(o)
        });
        o(P, mindmaps.Util.colors20d, function(o) {
            e.connectColorPicked && e.connectColorPicked(o)
        });
        o(B, mindmaps.Util.colors20c, function(o) {
            e.mapBackgroundColorPicked && e.mapBackgroundColorPicked(o)
        });
        o(x, mindmaps.Util.fontColors || mindmaps.Util.colors20, function(o) {
            e.fontColorPicked && e.fontColorPicked(o)
        })
    }, this.init = function() {
        $(".buttonset", o).buttonset(), b.button(), p.button(), m.button(), k.button(), v.button(), g.button(), A.button(), N.button(), n.change(function() {
            console.log(n.val()), e.fontfaceChangeClicked && e.fontfaceChangeClicked(n.val())
        }), c.change(function() {
            console.log(c.val()), e.connectStyleChangeClicked && e.connectStyleChangeClicked(c.val())
        }), t.change(function() {
            console.log(t.val()), e.connectArrowChangeClicked && e.connectArrowChangeClicked(t.val())
        }), i.change(function() {
            console.log(i.val()), e.borderStyleChangeClicked && e.borderStyleChangeClicked(i.val())
        }), z.on("change", function() {
            var o = parseInt($(this).val(), 10);
            if (isNaN(o)) return;
            if (o < 6) o = 6;
            if (o > 120) o = 120;
            $(this).val(o);
            e.fontSizeChanged && e.fontSizeChanged(o)
        }), l.click(function() {
            e.lineWidthDecreaseButtonClicked && e.lineWidthDecreaseButtonClicked()
        }), a.click(function() {
            e.lineWidthIncreaseButtonClicked && e.lineWidthIncreaseButtonClicked()
        }), u.click(function() {
            if (e.fontBoldCheckboxClicked) {
                var o = $(this).prop("checked");
                e.fontBoldCheckboxClicked(o)
            }
        }), C.click(function() {
            if (e.fontItalicCheckboxClicked) {
                var o = $(this).prop("checked");
                e.fontItalicCheckboxClicked(o)
            }
        }), h.click(function() {
            if (e.fontUnderlineCheckboxClicked) {
                var o = $(this).prop("checked");
                e.fontUnderlineCheckboxClicked(o)
            }
        }), f.click(function() {
            if (e.fontLinethroughCheckboxClicked) {
                var o = $(this).prop("checked");
                e.fontLinethroughCheckboxClicked(o)
            }
        }), F.click(function() {
            if (e.mapGridCheckboxClicked) {
                var o = $(this).prop("checked");
                e.mapGridCheckboxClicked(o)
            }
        });
        var O = mindmaps.Util.getColorThemeNames();
        T.empty();
        O.forEach(function(o) {
            var n = mindmaps.Util.getColorThemeLabel(o);
            T.append($("<option />", {
                value: o,
                text: n
            }))
        });
        T.val(mindmaps.Util.getActiveColorTheme());
        T.change(function() {
            var o = $(this).val();
            o && e.colorThemeChanged && e.colorThemeChanged(o)
        });
        e.refreshColorPickers(), v.click(function() {
            e.backgroundColorChildrenButtonClicked && e.backgroundColorChildrenButtonClicked()
        }), g.click(function() {
            e.borderColorChildrenButtonClicked && e.borderColorChildrenButtonClicked()
        }), k.click(function() {
            e.branchColorChildrenButtonClicked && e.branchColorChildrenButtonClicked()
        }), b.click(function() {
            e.fontColorChildrenButtonClicked && e.fontColorChildrenButtonClicked()
        }), p.click(function() {
            e.fontStyleChildrenButtonClicked && e.fontStyleChildrenButtonClicked()
        }), m.click(function() {
            e.fontFaceChildrenButtonClicked && e.fontFaceChildrenButtonClicked()
        }), A.click(function() {
            e.connectNodeButtonClicked && e.connectNodeButtonClicked()
        }), N.click(function() {
            e.connectNodeRemoveButtonClicked && e.connectNodeRemoveButtonClicked()
        }), _.chain(mindmaps.plugins).sortBy("startOrder").each(function(e) {
            e.inspectorAdviser && e.inspectorAdviser.onInit && e.inspectorAdviser.onInit($("#inspector-table", o))
        }), R(), I()
    }
}, mindmaps.InspectorPresenter = function(e, o, n, t) {
    function M(e) {
        return "solid" === e || "dashed" === e || "none" === e ? e : "dashed"
    }

    function c(e, o) {
        var n = mindmaps.getConnectedNodes().filter(function(n) {
            return n.from == e.id && n.to == o.id || n.from == o.id && n.to == e.id
        });
        n.length && (cfnode = n[0], t.setConnectStyle(cfnode.style), t.setConnectArrow(cfnode.arrow), t.setConnectColorPickerColor(cfnode.color))
    }

    function i(e) {
        var o = e.getPluginData("style", "font"),
            n = e.getPluginData("style", "border") || {
                visible: !1,
                style: "none",
                color: "#ffffff",
                background: "#ffffff"
            };
        n.style = M(n.style);
        if (!n.visible || "none" === n.style) {
            n.style = "none"
        }
        n.visible = "none" !== n.style;
        t.setBorderStyle(n.style), t.setBorderText(n.visible ? !0 : !1), t.setBoldCheckboxState("bold" === o.weight), t.setFontFace(o.fontfamily), t.setFontSize(o.size), t.setItalicCheckboxState("italic" === o.style), t.setUnderlineCheckboxState("underline" === o.decoration), t.setLinethroughCheckboxState("line-through" === o.decoration), t.setFontColorPickerColor(o.color), t.setBorderColorPickerColor(n.color), t.setBorderBackgroundColorPickerColor(n.background), t.setBranchColorPickerColor(e.getPluginData("style", "branchColor"))
    }

    function r() {
        var e = o.getMindMap();
        if (!e || !e.root) {
            return {
                gridEnabled: !1,
                color: "#ffffff"
            }
        }
        var n = e.root.getPluginData("canvas", "background") || {};
        return {
            gridEnabled: !!n.gridEnabled,
            color: n.color || "#ffffff"
        }
    }

    function s() {
        var e = r();
        t.setMapGridEnabled(e.gridEnabled);
        t.setMapBackgroundColorPickerColor(e.color)
    }
    t.fontfaceChangeClicked = function(e) {
        var n = new mindmaps.action.ChangeNodeFontFaceAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.connectStyleChangeClicked = function(e) {
        var n = new mindmaps.action.SetConnectStyleAction(o.selectedNode, mindmaps.connectStartNode, e);
        o.executeAction(n)
    }, t.connectArrowChangeClicked = function(e) {
        console.log("arrow is " + e);
        var n = new mindmaps.action.SetConnectArrowAction(o.selectedNode, mindmaps.connectStartNode, e);
        o.executeAction(n)
    }, t.borderStyleChangeClicked = function(e) {
        var n = new mindmaps.action.ChangeNodeBorderStyleAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.fontSizeChanged = function(e) {
        var n = new mindmaps.action.SetNodeFontSizeAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.fontSizeDecreaseButtonClicked = function() {
        var e = new mindmaps.action.DecreaseNodeFontSizeAction(o.selectedNode);
        o.executeAction(e)
    }, t.lineWidthDecreaseButtonClicked = function() {
        var e = new mindmaps.action.DecreaseNodeLineWidthAction(o.selectedNode);
        o.executeAction(e)
    }, t.lineWidthIncreaseButtonClicked = function() {
        var e = new mindmaps.action.IncreaseNodeLineWidthAction(o.selectedNode);
        o.executeAction(e)
    }, t.fontBoldCheckboxClicked = function(e) {
        var n = new mindmaps.action.SetFontWeightAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.fontItalicCheckboxClicked = function(e) {
        var n = new mindmaps.action.SetFontStyleAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.fontUnderlineCheckboxClicked = function(e) {
        var n = new mindmaps.action.SetFontDecorationAction(o.selectedNode, e ? "underline" : "none");
        o.executeAction(n)
    }, t.fontLinethroughCheckboxClicked = function(e) {
        var n = new mindmaps.action.SetFontDecorationAction(o.selectedNode, e ? "line-through" : "none");
        o.executeAction(n)
    }, t.branchColorPicked = function(e) {
        var n = new mindmaps.action.SetBranchColorAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.branchColorPreview = function(n) {
        e.publish(mindmaps.Event.NODE_BRANCH_COLOR_PREVIEW, o.selectedNode, n)
    }, t.fontColorPicked = function(e) {
        var n = new mindmaps.action.SetFontColorAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.borderBackgroundColorPicked = function(e) {
        var n = new mindmaps.action.SetBorderBackgroundColorAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.borderColorPicked = function(e) {
        var n = new mindmaps.action.SetBorderColorAction(o.selectedNode, e);
        o.executeAction(n)
    }, t.connectColorPicked = function(e) {
        var n = new mindmaps.action.SetConnectColorAction(o.selectedNode, mindmaps.connectStartNode, e);
        o.executeAction(n)
    }, t.mapGridCheckboxClicked = function(e) {
        var n = o.getMindMap();
        if (!n || !n.root) {
            return
        }
        var t = new mindmaps.action.SetMapGridEnabledAction(n.root, e);
        o.executeAction(t)
    }, t.mapBackgroundColorPicked = function(e) {
        var n = o.getMindMap();
        if (!n || !n.root) {
            return
        }
        var t = new mindmaps.action.SetMapBackgroundColorAction(n.root, e);
        o.executeAction(t)
    }, t.colorThemeChanged = function(n) {
        var r = mindmaps.Util.setColorTheme(n);
        var i = o.getMindMap();
        if (i) {
            mindmaps.Util.applyThemeToMindMap(i, function(n) {
                e.publish(mindmaps.Event.NODE_BRANCH_COLOR_CHANGED, n)
            });
            mindmaps.isMapLoadingConfirmationRequired = !0
        }
        t.refreshColorPickers();
        t.setCurrentTheme(r)
    }, t.fontColorPreview = function(n) {
        e.publish(mindmaps.Event.NODE_FONT_COLOR_PREVIEW, o.selectedNode, n)
    }, t.branchColorChildrenButtonClicked = function() {
        var e = new mindmaps.action.SetChildrenBranchColorAction(o.selectedNode);
        o.executeAction(e)
    }, t.backgroundColorChildrenButtonClicked = function() {
        var e = new mindmaps.action.SetChildrenBackgroundColorAction(o.selectedNode);
        o.executeAction(e)
    }, t.borderColorChildrenButtonClicked = function() {
        var e = new mindmaps.action.CompositeAction;
        e.addAction(new mindmaps.action.SetChildrenBorderStyleAction(o.selectedNode));
        e.addAction(new mindmaps.action.SetChildrenBorderColorAction(o.selectedNode));
        o.executeAction(e)
    }, t.borderStyleChildrenButtonClicked = function() {
        var e = new mindmaps.action.SetChildrenBorderStyleAction(o.selectedNode);
        o.executeAction(e)
    }, t.fontColorChildrenButtonClicked = function() {
        var e = new mindmaps.action.SetChildrenFontColorAction(o.selectedNode);
        o.executeAction(e)
    }, t.fontStyleChildrenButtonClicked = function() {
        var e = new mindmaps.action.SetChildrenFontStyleAction(o.selectedNode);
        o.executeAction(e)
    }, t.fontFaceChildrenButtonClicked = function() {
        var e = new mindmaps.action.SetChildrenFontFaceAction(o.selectedNode);
        o.executeAction(e)
    }, t.connectNodeButtonClicked = function() {
        var e = new mindmaps.action.ConnectNodeClickAction(o.selectedNode, !0);
        o.executeAction(e)
    }, t.connectNodeRemoveButtonClicked = function() {
        var e = new mindmaps.action.ConnectNodeRemoveClickAction(o.selectedNode, mindmaps.connectStartNode);
        o.executeAction(e)
    }, e.subscribe(mindmaps.Event.NODE_FONT_CHANGED, function(e) {
        o.selectedNode === e && i(e)
    }), e.subscribe(mindmaps.Event.NODE_BRANCH_COLOR_CHANGED, function(e) {
        o.selectedNode === e && i(e)
    }), e.subscribe(mindmaps.Event.NODE_SELECTED, function(o) {
        mindmaps.connectMode ? (e.publish(mindmaps.Event.CONNECTED_TWO_NODES, mindmaps.connectStartNode, o), mindmaps.connectSelected = !0, c(mindmaps.connectStartNode, o)) : (mindmaps.connectSelected = !1, $("#node-connect-styles-row").hide(), $("#inspector-button-connect-node-remove").hide()), i(o), mindmaps.connectMode = !1
    }), e.subscribe(mindmaps.Event.DOCUMENT_OPENED, function() {
        t.setControlsEnabled(!0), s()
    }), e.subscribe(mindmaps.Event.DOCUMENT_CLOSED, function() {
        t.setControlsEnabled(!1)
    }), e.subscribe(mindmaps.Event.MAP_BACKGROUND_CHANGED, function() {
        s()
    }), this.go = function() {
        t.init()
    }
};
mindmaps.LevelStylesPresenter = function(eventBus, mindmapModel, $container) {
    var depthSelect    = $container.find("#level-style-depth-select");
    var fontFaceSelect = $container.find("#level-style-font-face");
    var fontSizeInput  = $container.find("#level-style-font-size");
    var fontBold       = $container.find("#level-style-font-bold");
    var fontItalic     = $container.find("#level-style-font-italic");
    var fontUnderline  = $container.find("#level-style-font-underline");
    var fontLinethrough = $container.find("#level-style-font-linethrough");

    var _syncing = false;

    var _defaults = [
        { fontfamily: 'Sans-serif', size: 20, weight: 'bold',   style: 'normal', decoration: 'none' },
        { fontfamily: 'Sans-serif', size: 15, weight: 'normal', style: 'normal', decoration: 'none' },
        { fontfamily: 'Sans-serif', size: 13, weight: 'normal', style: 'normal', decoration: 'none' },
        { fontfamily: 'Sans-serif', size: 13, weight: 'normal', style: 'normal', decoration: 'none' },
        { fontfamily: 'Sans-serif', size: 13, weight: 'normal', style: 'normal', decoration: 'none' }
    ];

    function getDepth() { return parseInt(depthSelect.val(), 10); }

    function effectiveStyle(depth) {
        var mm = mindmapModel.getMindMap();
        if (!mm) return _defaults[depth] || _defaults[4];
        return mm.getLevelStyle(depth) || _defaults[depth] || _defaults[4];
    }

    function syncUI() {
        var ls = effectiveStyle(getDepth());
        _syncing = true;
        fontFaceSelect.val(ls.fontfamily);
        fontSizeInput.val(ls.size);
        fontBold.prop('checked', ls.weight === 'bold').button('refresh');
        fontItalic.prop('checked', ls.style === 'italic').button('refresh');
        fontUnderline.prop('checked', ls.decoration === 'underline').button('refresh');
        fontLinethrough.prop('checked', ls.decoration === 'line-through').button('refresh');
        _syncing = false;
    }

    function applyPatch(patch) {
        if (_syncing) return;
        var mm = mindmapModel.getMindMap();
        if (!mm) return;
        var depth = getDepth();
        mm.setLevelStyle(depth, patch);
        mindmaps.isMapLoadingConfirmationRequired = true;
        mm.root.forEachDescendant(function(node) {
            var nd = node.getDepth();
            var matches = (depth < 4 && nd === depth) || (depth === 4 && nd >= 4);
            if (matches) {
                var font = node.getPluginData("style", "font");
                $.extend(font, patch);
                node.setPluginData("style", "font", font);
                eventBus.publish(mindmaps.Event.NODE_FONT_CHANGED, node);
            }
        });
        if (depth === 0) {
            var font = mm.root.getPluginData("style", "font");
            $.extend(font, patch);
            mm.root.setPluginData("style", "font", font);
            eventBus.publish(mindmaps.Event.NODE_FONT_CHANGED, mm.root);
        }
    }

    this.go = function() {
        $container.find('.inspector-section-levelstyle .buttonset').buttonset();

        depthSelect.change(function() { syncUI(); });

        fontFaceSelect.change(function() {
            if (_syncing) return;
            applyPatch({ fontfamily: fontFaceSelect.val() });
        });

        fontSizeInput.on('change', function() {
            if (_syncing) return;
            var val = parseInt(fontSizeInput.val(), 10);
            if (!isNaN(val) && val >= 6 && val <= 120) applyPatch({ size: val });
        });

        fontBold.click(function() {
            if (_syncing) return;
            applyPatch({ weight: $(this).prop('checked') ? 'bold' : 'normal' });
        });

        fontItalic.click(function() {
            if (_syncing) return;
            applyPatch({ style: $(this).prop('checked') ? 'italic' : 'normal' });
        });

        fontUnderline.click(function() {
            if (_syncing) return;
            applyPatch({ decoration: $(this).prop('checked') ? 'underline' : 'none' });
        });

        fontLinethrough.click(function() {
            if (_syncing) return;
            applyPatch({ decoration: $(this).prop('checked') ? 'line-through' : 'none' });
        });

        eventBus.subscribe(mindmaps.Event.DOCUMENT_OPENED, function() {
            depthSelect.val('0');
            syncUI();
        });
    };
};