mindmaps.ToolBarView = function() {
    var e = this;
    this.buttons = [];
    this.menus = [];
    this.init = function() {};
    this.ensureResponsive = function() {
        var t = mindmaps.responsive.getToolbarMode();

        function n(t) {
            e.buttons.forEach(function(e) {
                e.setResponsiveMode(t)
            });
            e.menus.forEach(function(e) {
                e.setResponsiveMode(t)
            })
        }

        function r() {
            var e = $("#toolbar .buttons .ui-button:visible");
            var t = false;
            e.each(function() {
                var e = $(this);
                var n = e.find(".ui-button-text").first();
                if (!n.length || !n.text().trim()) {
                    return
                }

                var r = n[0].getBoundingClientRect();
                var i = e.find(".ui-button-icon-primary").first();
                if (i.length) {
                    var s = i[0].getBoundingClientRect();
                    if (s.right >= r.left - 1) {
                        t = true;
                        return false
                    }
                }

                var o = e.find(".ui-button-icon-secondary").first();
                if (o.length) {
                    var a = o[0].getBoundingClientRect();
                    if (a.left <= r.right + 1) {
                        t = true;
                        return false
                    }
                }
            });
            return t
        }
        n(t);

        if ("compact" === t) {
            var i = $("#toolbar .buttons").get(0);
            if (i && (i.scrollWidth > i.clientWidth + 1 || r())) {
                n("icon-only")
            }
        }
    };
    this.addButton = function(t, n) {
        e.buttons.push(t);
        n(t.asJquery())
    };
    this.addButtonGroup = function(t, n) {
        var r = $("<span/>");
        t.forEach(function(t) {
            e.buttons.push(t);
            r.append(t.asJquery())
        });
        r.buttonset();
        n(r)
    };
    this.addMenu = function(e) {
        this.menus.push(e);
        this.alignLeft(e.getContent())
    };
    this.alignLeft = function(e) {
        e.appendTo("#toolbar .buttons-left")
    };
    this.alignCenter = function(e) {
        var t = $("#toolbar .buttons-middle");
        if (!t.length) {
            t = $("<span/>", {
                "class": "buttons-middle"
            }).appendTo("#toolbar .buttons")
        }
        e.appendTo(t)
    };
    this.alignRight = function(e) {
        e.appendTo("#toolbar .buttons-right")
    }
};
mindmaps.ToolBarButton = function(e) {
    this.command = e;
    var t = this;
    e.subscribe(mindmaps.Command.Event.ENABLED_CHANGED, function(e) {
        if (t.setEnabled) {
            t.setEnabled(e)
        }
    })
};
mindmaps.ToolBarButton.prototype.isEnabled = function() {
    return this.command.enabled
};
mindmaps.ToolBarButton.prototype.click = function() {
    this.command.execute()
};
mindmaps.ToolBarButton.prototype.getTitle = function() {
    return this.command.label
};
mindmaps.ToolBarButton.prototype.getToolTip = function() {
    var e = this.command.description;
    var t = this.command.shortcut;
    if (t) {
        if (Array.isArray(t)) {
            t = t.join(", ")
        }
        e += " [" + t.toUpperCase() + "]"
    }
    return e
};
mindmaps.ToolBarButton.prototype.getId = function() {
    return "button-" + this.command.id
};
mindmaps.ToolBarButton.prototype.asJquery = function() {
    var e = this;
    var n = this.command.icon;
    var t = $("<button/>", {
        id: this.getId(),
        title: this.getToolTip()
    }).click(function() {
        e.click()
    }).button({
        label: this.getTitle(),
        disabled: !this.isEnabled()
    });
    if (n) {
        t.button({
            icons: {
                primary: n
            }
        })
    }
    this.setEnabled = function(e) {
        t.button(e ? "enable" : "disable")
    };
    this.setResponsiveMode = function(r) {
        var i = this.getTitle();
        var s = "compact" === r ? i.substr(0, 1) : i;
        var o = "icon-only" === r && !!n;
        var l = "menu-text-only" === r;
        var a = {
            label: o ? i : s,
            text: !o
        };
        if (l) {
            a.icons = {
                primary: null,
                secondary: null
            }
        } else if (n) {
            a.icons = {
                primary: n
            }
        }
        t.button(a)
    };
    this.setSmall = this.setResponsiveMode;
    return t
};
mindmaps.ToolBarMenu = function(e, t) {
    this.title = e;
    var n = this;
    this.buttons = [];
    this.$menuWrapper = $("<span/>", {
        "class": "menu-wrapper"
    }).hover(function() {
        n.$menu.show()
    }, function() {
        n.$menu.hide()
    });
    this.setResponsiveMode = function(r) {
        var i = "compact" === r ? e.substr(0, 1) : e;
        var s = "icon-only" === r;
        n.$menuButton.button({
            label: s ? e : i,
            text: !s,
            icons: {
                primary: t,
                secondary: "ui-icon-triangle-1-s"
            }
        });
        n.buttons.forEach(function(e) {
            e.setResponsiveMode("full" === r ? "full" : "menu-text-only")
        })
    };
    this.setSmall = this.setResponsiveMode;
    this.$menuButton = $("<button/>").button({
        label: e,
        icons: {
            primary: t,
            secondary: "ui-icon-triangle-1-s"
        }
    }).appendTo(this.$menuWrapper);
    this.$menu = $("<div/>", {
        "class": "menu"
    }).click(function() {
        n.$menu.hide()
    }).appendTo(this.$menuWrapper);
    this.add = function(e) {
        if (!Array.isArray(e)) {
            e = [e]
        }
        e.forEach(function(e) {
            var t = e.asJquery().removeClass("ui-corner-all").addClass("menu-item");
            this.$menu.append(t);
            this.buttons.push(e)
        }, this);
        this.$menu.children().last().addClass("ui-corner-bottom").prev().removeClass("ui-corner-bottom")
    };
    this.getContent = function() {
        return this.$menuWrapper
    }
};
mindmaps.ToolBarPresenter = function(e, t, n, r, i) {
    function s(e) {
        var n = t.get(e);
        return new mindmaps.ToolBarButton(n)
    }

    function o(e) {
        return e.map(s)
    }

    function S() {
        $(window).off("resize.toolbarResponsive").on("resize.toolbarResponsive", function() {
            n.ensureResponsive()
        });
        i.subscribe(mindmaps.CanvasContainer.Event.RESIZED, function() {
            n.ensureResponsive()
        })
    }
    var b = new mindmaps.ToolBarMenu("File", "ui-icon-document");
    var w = [mindmaps.NewDocumentCommand, mindmaps.OpenDocumentCommand, mindmaps.SaveDocumentCommand, mindmaps.ImportMarkdownCommand, mindmaps.ExportCommand, mindmaps.ExportMarkdownCommand, mindmaps.PrintCommand, mindmaps.CloseDocumentCommand];
    var E = o(w);
    b.add(E);
    n.addMenu(b);
    var m = new mindmaps.ToolBarMenu("Edit", "ui-icon-pencil");
    var g = [mindmaps.UndoCommand, mindmaps.RedoCommand, mindmaps.CopyNodeCommand, mindmaps.CutNodeCommand, mindmaps.PasteNodeCommand];
    var y = o(g);
    m.add(y);
    n.addMenu(m);
    var u = [mindmaps.CreateNodeCommand, mindmaps.CreateSiblingNodeCommand, mindmaps.DeleteNodeCommand, mindmaps.ConnectNodeCommand];
    var a = o(u);
    n.addButtonGroup(a, n.alignCenter);
    n.addButton(s(mindmaps.FormatSidebarCommand), n.alignRight);
    this.go = function() {
        n.init();
        n.ensureResponsive()
    };
    S()
}