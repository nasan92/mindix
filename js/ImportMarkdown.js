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
            if (level > 4) {
                level = 4
            }

            var parentLevel = level - 1;
            while (parentLevel >= 1 && !stack[parentLevel]) {
                parentLevel--
            }

            var parent = stack[parentLevel] || root;
            var node = new mindmaps.Node;
            node.setCaption(entry.caption);

            if (parent.isRoot()) {
                node.setPluginData("style", "branchColor", mindmaps.Util.randomColor())
            } else {
                node.setPluginData("style", "branchColor", parent.getPluginData("style", "branchColor"))
            }

            mindmap.addNode(node);
            parent.addChild(node);

            stack[level] = node;
            for (var clearLevel = level + 1; clearLevel <= 6; clearLevel++) {
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
        function layoutChildren(node) {
            var children = node.getChildren();
            if (!children.length) {
                return
            }

            if (node.isRoot()) {
                var rightY = -60;
                var leftY = -60;
                var rightColumn = 0;
                var leftColumn = 0;
                var rootSpacingY = 95;

                children.forEach(function(child, index) {
                    var isRight = index % 2 === 0;
                    if (isRight) {
                        child.setPluginData("layout", "offset", new mindmaps.Point(220 + rightColumn * 40, rightY));
                        rightY += rootSpacingY;
                        rightColumn++
                    } else {
                        child.setPluginData("layout", "offset", new mindmaps.Point(-220 - leftColumn * 40, leftY));
                        leftY += rootSpacingY;
                        leftColumn++
                    }
                    layoutChildren(child)
                });
                return
            }

            var direction = node.getPluginData("layout", "offset").x >= 0 ? 1 : -1;
            var childSpacingY = 80;
            var startY = -((children.length - 1) * childSpacingY) / 2;

            children.forEach(function(child, index) {
                child.setPluginData("layout", "offset", new mindmaps.Point(direction * 180, startY + index * childSpacingY));
                child.setPluginData("style", "branchColor", node.getPluginData("style", "branchColor"));
                layoutChildren(child)
            })
        }

        layoutChildren(rootNode)
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
