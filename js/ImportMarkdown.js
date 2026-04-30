mindmaps.autoLayout = {
    NODE_HEIGHT: 50,
    CHILD_GAP: 30,
    ROOT_X: 300,
    LEVEL_X: 260,

    COMPACT_NODE_HEIGHT: 28,
    COMPACT_CHILD_GAP: 8,
    COMPACT_ROOT_X: 180,
    COMPACT_LEVEL_X: 160,

    estimateNodeHeight: function(node, compact) {
        var nodeHeight = compact ? this.COMPACT_NODE_HEIGHT : this.NODE_HEIGHT;
        var caption = (node.getCaption && node.getCaption()) || '';
        var charsPerLine = compact ? 22 : 18;
        var lineHeight = compact ? 18 : 22;
        var padding = compact ? 6 : 12;
        var lines = Math.max(1, Math.ceil(caption.length / charsPerLine));
        return Math.max(nodeHeight, lines * lineHeight + padding);
    },

    estimateNodeWidth: function(node) {
        var caption = (node.getCaption && node.getCaption()) || '';
        // ~9px per character for sans-serif 15px; min 60px
        return Math.max(60, caption.length * 9);
    },

    getSubtreeHeight: function(node, compact) {
        var children = node.getChildren();
        if (!children.length) return this.estimateNodeHeight(node, compact);
        var total = 0;
        var self = this;
        children.forEach(function(child) {
            total += self.getSubtreeHeight(child, compact);
        });
        var childGap = compact ? this.COMPACT_CHILD_GAP : this.CHILD_GAP;
        total += childGap * (children.length - 1);
        return total;
    },

    computePositions: function(rootNode, compact) {
        var positions = [];
        var self = this;
        var childGap = compact ? this.COMPACT_CHILD_GAP : this.CHILD_GAP;
        var levelX = compact ? this.COMPACT_LEVEL_X : this.LEVEL_X;
        var rootX = compact ? this.COMPACT_ROOT_X : this.ROOT_X;
        // Minimum gap between a node's edge and its child's near edge (in pixels).
        var branchGap = compact ? 10 : 20;

        // Returns the x-offset to use for a child given the layout direction.
        // Branch line length is equal on both sides:
        //   right: child left edge at rightX, branch = rightX - parentWidth
        //   left:  child right edge at same distance from parent left edge → childX = parentWidth - rightX - childWidth
        function xOffset(parentNode, childNode, direction, baseX) {
            var parentWidth = self.estimateNodeWidth(parentNode);
            var rightX = Math.max(baseX, parentWidth + branchGap);
            if (direction > 0) {
                return rightX;
            } else {
                return parentWidth - rightX - self.estimateNodeWidth(childNode);
            }
        }

        function layoutSubtree(node, direction) {
            var children = node.getChildren();
            if (!children.length) return;
            var heights = children.map(function(child) {
                return self.getSubtreeHeight(child, compact);
            });
            var total = heights.reduce(function(a, b) { return a + b; }, 0) + childGap * (children.length - 1);
            var y = -total / 2;
            children.forEach(function(child, i) {
                var center = y + heights[i] / 2;
                positions.push({ node: child, point: new mindmaps.Point(xOffset(node, child, direction, levelX), center) });
                y += heights[i] + childGap;
                layoutSubtree(child, direction);
            });
        }

        var children = rootNode.getChildren();
        var rightGroup = [];
        var leftGroup = [];
        var half = Math.ceil(children.length / 2);
        children.forEach(function(child, i) {
            if (i < half) rightGroup.push(child);
            else leftGroup.push(child);
        });
        // Reverse left group so placement goes bottom-to-top, continuing clockwise from right side.
        leftGroup.reverse();

        function placeGroup(group, direction) {
            if (!group.length) return;
            var heights = group.map(function(child) {
                return self.getSubtreeHeight(child, compact);
            });
            var total = heights.reduce(function(a, b) { return a + b; }, 0) + childGap * (group.length - 1);
            var y = -total / 2;
            group.forEach(function(child, i) {
                var center = y + heights[i] / 2;
                positions.push({ node: child, point: new mindmaps.Point(xOffset(rootNode, child, direction, rootX), center) });
                y += heights[i] + childGap;
                layoutSubtree(child, direction);
            });
        }

        placeGroup(rightGroup, 1);
        placeGroup(leftGroup, -1);

        return positions;
    }
};

mindmaps.MarkdownImportParser = {
    parse: function(markdownText) {
        var parsed = this.parseHeadings(markdownText || "");
        var document = new mindmaps.Document;
        var mindmap = document.mindmap;
        var root = mindmap.getRoot();

        root.setCaption(parsed.rootCaption);
        root.setPluginData("layout", "offset", new mindmaps.Point(0, 0));

        var stack = {
            1: root
        };

        parsed.headings.forEach(function(entry) {
            var level = entry.level;

            // Additional level-1 headings are treated as root children.
            if (level === 1) {
                level = 2
            }
            if (level < 2) {
                level = 2
            }

            var parentLevel = level - 1;
            while (parentLevel >= 1 && !stack[parentLevel]) {
                parentLevel--
            }

            var parent = stack[parentLevel] || root;
            var node = new mindmaps.Node;
            node.setCaption(entry.caption);

            if (parent.isRoot()) {
                node.setPluginData("style", "branchColor", mindmaps.Util.getNextRootBranchColor(parent))
            } else {
                node.setPluginData("style", "branchColor", parent.getPluginData("style", "branchColor"))
            }

            mindmap.addNode(node);
            parent.addChild(node);

            stack[level] = node;
            for (var clearLevel = level + 1; clearLevel <= 20; clearLevel++) {
                delete stack[clearLevel]
            }
        });

        this.applyDefaultLayout(root);

        document.title = root.getCaption();
        document.cnodes = [];
        return document
    },

    parseHeadings: function(markdownText) {
        var lines = markdownText.replace(/\r\n/g, "\n").split("\n");
        var headings = [];
        var inCodeBlock = false;
        var currentHeadingLevel = null;
        var listIndentStack = [];

        function getIndentWidth(rawIndent) {
            var width = 0;
            for (var i = 0; i < rawIndent.length; i++) {
                width += rawIndent.charAt(i) === "\t" ? 4 : 1
            }
            return width
        }

        lines.forEach(function(line) {
            if (/^\s*```/.test(line)) {
                inCodeBlock = !inCodeBlock;
                return
            }
            if (inCodeBlock) {
                return
            }

            var match = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/);
            if (match) {
                var level = match[1].length;
                var caption = match[2].replace(/\s+#+\s*$/, "").trim();
                if (!caption) {
                    return
                }

                headings.push({
                    level: level,
                    caption: caption
                });

                currentHeadingLevel = level;
                listIndentStack = [];
                return
            }

            // List items below a heading are treated as its subbranches.
            var listMatch = line.match(/^(\s*)(?:[-*+]\s+|\d+[.)]\s+)(.+?)\s*$/);
            if (!listMatch || currentHeadingLevel === null) {
                return
            }

            var listCaption = listMatch[2].trim();
            if (!listCaption) {
                return
            }

            var indentWidth = getIndentWidth(listMatch[1]);
            while (listIndentStack.length && indentWidth < listIndentStack[listIndentStack.length - 1]) {
                listIndentStack.pop()
            }
            if (!listIndentStack.length || indentWidth > listIndentStack[listIndentStack.length - 1]) {
                listIndentStack.push(indentWidth)
            }

            headings.push({
                level: currentHeadingLevel + listIndentStack.length,
                caption: listCaption
            })
        });

        if (!headings.length) {
            throw new Error("No markdown headings were found. Use # for the root, then ##/###/#### for branches.")
        }

        var rootIndex = -1;
        for (var i = 0; i < headings.length; i++) {
            if (headings[i].level === 1) {
                rootIndex = i;
                break
            }
        }

        if (rootIndex === -1) {
            throw new Error("Markdown must include one top-level heading (#) for the central idea.")
        }

        return {
            rootCaption: headings[rootIndex].caption,
            headings: headings.slice(rootIndex + 1)
        }
    },

    applyDefaultLayout: function(rootNode) {
        var positions = mindmaps.autoLayout.computePositions(rootNode);
        positions.forEach(function(p) {
            p.node.setPluginData("layout", "offset", p.point);
            var parent = p.node.getParent();
            if (parent && !parent.isRoot()) {
                p.node.setPluginData("style", "branchColor", parent.getPluginData("style", "branchColor"))
            }
        })
    }
};

mindmaps.ImportMarkdownView = function() {
    var self = this;
    var $dialog = $("#template-import-markdown").tmpl().dialog({
        autoOpen: false,
        modal: true,
        zIndex: 5e3,
        width: 520,
        close: function() {
            $(this).dialog("destroy");
            $(this).remove()
        }
    });

    $dialog.find(".file-chooser input").bind("change", function(event) {
        if (self.importFileClicked) {
            self.importFileClicked(event)
        }
    });

    this.showImportDialog = function() {
        this.showError("");
        $dialog.dialog("open")
    };

    this.hideImportDialog = function() {
        $dialog.dialog("close")
    };

    this.showError = function(message) {
        $dialog.find(".import-markdown-error").text(message || "")
    }
};

mindmaps.ImportMarkdownPresenter = function(eventBus, mindmapModel, view) {
    view.importFileClicked = function(event) {
        var files = event.target.files;
        if (!files || !files.length) {
            return
        }

        var file = files[0];
        var fileName = (file.name || "").toLowerCase();
        if (fileName && !(/\.(md|markdown)$/).test(fileName)) {
            view.showError("Unsupported file type. Please choose a .md or .markdown file.");
            return
        }

        var reader = new FileReader;
        reader.onload = function() {
            try {
                var document = mindmaps.MarkdownImportParser.parse(reader.result || "");
                mindmapModel.setDocument(document);
                mindmaps.currentMapId = "new-import-markdown";
                window.location.hash = "m:new-import-markdown";
                mindmaps.isMapLoadingConfirmationRequired = true;
                mindmaps.ignoreHashChange = true;
                view.hideImportDialog()
            } catch (error) {
                var message = error && error.message ? error.message : "Unable to import markdown file.";
                view.showError(message);
                eventBus.publish(mindmaps.Event.NOTIFICATION_ERROR, message)
            }
        };
        reader.onerror = function() {
            var message = "Unable to read the selected markdown file.";
            view.showError(message);
            eventBus.publish(mindmaps.Event.NOTIFICATION_ERROR, message)
        };

        reader.readAsText(file)
    };

    this.go = function() {
        view.showImportDialog()
    }
};
