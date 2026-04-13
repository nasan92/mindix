mindmaps.MarkdownExportSerializer = {
    serialize: function(document) {
        var root = document.mindmap.getRoot();
        var lines = [];

        function visit(node, depth) {
            var caption = node.getCaption().replace(/\n/g, " ").trim();
            if (!caption) return;

            if (depth === 0) {
                lines.push("# " + caption);
            } else if (depth <= 3) {
                if (depth === 1 && lines.length > 0) {
                    lines.push("");
                }
                lines.push("#".repeat(depth + 1) + " " + caption);
            } else {
                // depth 4+ becomes list items (matches import parser behaviour)
                var indent = "  ".repeat(depth - 4);
                lines.push(indent + "- " + caption);
            }

            node.getChildren().forEach(function(child) {
                visit(child, depth + 1);
            });
        }

        visit(root, 0);
        return lines.join("\n");
    }
};

mindmaps.ExportMarkdownView = function() {
    var self = this;
    var $dialog = $("#template-export-markdown").tmpl().dialog({
        autoOpen: false,
        modal: true,
        zIndex: 5000,
        width: 560,
        buttons: {
            "Download .md": function() {
                if (self.downloadClicked) {
                    self.downloadClicked();
                }
            },
            "Close": function() {
                $(this).dialog("close");
            }
        },
        close: function() {
            $(this).dialog("destroy");
            $(this).remove();
        }
    });

    this.showExportDialog = function(markdownText, filename) {
        $dialog.find(".export-markdown-preview").val(markdownText);
        $dialog.find(".export-markdown-filename").text(filename + ".md");
        $dialog.dialog("open");
    };

    this.hideExportDialog = function() {
        $dialog.dialog("close");
    };
};

mindmaps.ExportMarkdownPresenter = function(eventBus, mindmapModel, view) {
    this.go = function() {
        var document = mindmapModel.getDocument();
        if (!document) return;

        var markdownText = mindmaps.MarkdownExportSerializer.serialize(document);
        var filename = (document.title || "mindmap").replace(/[^\w\-. ]/g, "_");

        view.downloadClicked = function() {
            var blob = new Blob([markdownText], {type: "text/markdown;charset=utf-8"});
            saveAs(blob, filename + ".md");
        };

        view.showExportDialog(markdownText, filename);
    };
};
