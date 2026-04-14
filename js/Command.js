mindmaps.Command = function() {
    this.id = "BASE_COMMAND";
    this.shortcut = null;
    this.handler = null;
    this.label = null;
    this.description = null;
    this.enabled = false
};
mindmaps.Command.Event = {
    HANDLER_REGISTERED: "HandlerRegisteredCommandEvent",
    HANDLER_REMOVED: "HandlerRemovedCommandEvent",
    ENABLED_CHANGED: "EnabledChangedCommandEvent"
};
mindmaps.Command.prototype = {
    execute: function() {
        if (this.handler) {
            this.handler()
        } else {}
    },
    setHandler: function(e) {
        this.removeHandler();
        this.handler = e;
        this.publish(mindmaps.Command.Event.HANDLER_REGISTERED)
    },
    removeHandler: function() {
        this.handler = null;
        this.publish(mindmaps.Command.Event.HANDLER_REMOVED)
    },
    setEnabled: function(e) {
        this.enabled = e;
        this.publish(mindmaps.Command.Event.ENABLED_CHANGED, e)
    }
};
EventEmitter.mixin(mindmaps.Command);
mindmaps.CreateNodeCommand = function() {
    this.id = "CREATE_NODE_COMMAND";
    this.shortcut = ["tab", "insert"];
    this.label = "Child";
    this.icon = "ui-icon-plus";
    this.description = "Creates a new node"
};
mindmaps.CreateNodeCommand.prototype = new mindmaps.Command;
mindmaps.CreateSiblingNodeCommand = function() {
    this.id = "CREATE_SIBLING_NODE_COMMAND";
    this.shortcut = "return";
    this.label = "Sibling";
    this.icon = "ui-icon-plus";
    this.description = "Creates a new sibling node"
};
mindmaps.CreateSiblingNodeCommand.prototype = new mindmaps.Command;
mindmaps.SelectParentNodeCommand = function() {
    this.id = "SELECT_PARENT_NODE_COMMAND";
    this.label = "Parent";
    this.icon = "ui-icon-arrowthick-1-w";
    this.description = "Go to parent"
};
mindmaps.SelectParentNodeCommand.prototype = new mindmaps.Command;
mindmaps.SelectChildFirstNodeCommand = function() {
    this.id = "SELECT_CHILD_FIRST_NODE_COMMAND";
    this.label = "First";
    this.icon = "ui-icon-arrowthick-1-e";
    this.description = "Go to first child"
};
mindmaps.SelectChildFirstNodeCommand.prototype = new mindmaps.Command;
mindmaps.SelectSiblingNextNodeCommand = function() {
    this.id = "SELECT_SIBLING_NEXT_NODE_COMMAND";
    this.label = "Next";
    this.icon = "ui-icon-arrowthick-1-s";
    this.description = "Go to next sibling"
};
mindmaps.SelectSiblingNextNodeCommand.prototype = new mindmaps.Command;
mindmaps.SelectSiblingPrevNodeCommand = function() {
    this.id = "SELECT_SIBLING_PREV_NODE_COMMAND";
    this.label = "Prev";
    this.icon = "ui-icon-arrowthick-1-n";
    this.description = "Go to prev sibling"
};
mindmaps.SelectSiblingPrevNodeCommand.prototype = new mindmaps.Command;
mindmaps.DeleteNodeCommand = function() {
    this.id = "DELETE_NODE_COMMAND";
    this.shortcut = ["del", "backspace"];
    this.label = "Node";
    this.icon = "ui-icon-minus";
    this.description = "Deletes a new node"
};
mindmaps.DeleteNodeCommand.prototype = new mindmaps.Command;
mindmaps.ConnectNodeCommand = function() {
    this.id = "CONNECT_NODE_COMMAND";
    this.label = "Connect";
    this.icon = "ui-icon-arrow-1-ne";
    this.description = "Connect selected node to another node"
};
mindmaps.ConnectNodeCommand.prototype = new mindmaps.Command;
mindmaps.EditNodeCaptionCommand = function() {
    this.id = "EDIT_NODE_CAPTION_COMMAND";
    this.shortcut = ["F2"];
    this.label = "Edit node caption";
    this.description = "Edits the node text"
};
mindmaps.EditNodeCaptionCommand.prototype = new mindmaps.Command;
mindmaps.ToggleNodeFoldedCommand = function() {
    this.id = "TOGGLE_NODE_FOLDED_COMMAND";
    this.shortcut = "space";
    this.description = "Show or hide the node's children"
};
mindmaps.ToggleNodeFoldedCommand.prototype = new mindmaps.Command;
mindmaps.UndoCommand = function() {
    this.id = "UNDO_COMMAND";
    this.shortcut = ["ctrl+z", "meta+z"];
    this.label = "Undo";
    this.icon = "ui-icon-arrowreturnthick-1-w";
    this.description = "Undo"
};
mindmaps.UndoCommand.prototype = new mindmaps.Command;
mindmaps.RedoCommand = function() {
    this.id = "REDO_COMMAND";
    this.shortcut = ["ctrl+y", "meta+shift+z"];
    this.label = "Redo";
    this.icon = "ui-icon-arrowreturnthick-1-e";
    this.description = "Redo"
};
mindmaps.RedoCommand.prototype = new mindmaps.Command;
mindmaps.CopyNodeCommand = function() {
    this.id = "COPY_COMMAND";
    this.shortcut = ["ctrl+c", "meta+c"];
    this.label = "Copy";
    this.icon = "ui-icon-copy";
    this.description = "Copy a branch"
};
mindmaps.CopyNodeCommand.prototype = new mindmaps.Command;
mindmaps.CutNodeCommand = function() {
    this.id = "CUT_COMMAND";
    this.shortcut = ["ctrl+x", "meta+x"];
    this.label = "Cut";
    this.icon = "ui-icon-scissors";
    this.description = "Cut a branch"
};
mindmaps.CutNodeCommand.prototype = new mindmaps.Command;
mindmaps.PasteNodeCommand = function() {
    this.id = "PASTE_COMMAND";
    this.shortcut = ["ctrl+v", "meta+v"];
    this.label = "Paste";
    this.icon = "ui-icon-clipboard";
    this.description = "Paste a branch"
};
mindmaps.PasteNodeCommand.prototype = new mindmaps.Command;
mindmaps.NewDocumentCommand = function() {
    this.id = "NEW_DOCUMENT_COMMAND";
    this.label = "New";
    this.icon = "ui-icon-document-b";
    this.description = "Start working on a new mind map"
};
mindmaps.NewDocumentCommand.prototype = new mindmaps.Command;
mindmaps.SaveInstantDocumentCommand = function() {
    this.id = "SAVE_INSTANT_DOCUMENT_COMMAND";
    this.label = "Save";
    this.shortcut = ["ctrl+s", "meta+s"];
    this.icon = "ui-icon-disk";
    this.description = "Save the mind map"
};
mindmaps.SaveInstantDocumentCommand.prototype = new mindmaps.Command;
mindmaps.ImportMarkdownCommand = function() {
    this.id = "IMPORT_MARKDOWN_COMMAND";
    this.label = "Import";
    this.icon = "ui-icon-arrowthick-1-s";
    this.description = "Import a markdown file as mind map"
};
mindmaps.ImportMarkdownCommand.prototype = new mindmaps.Command;
mindmaps.ExportMarkdownCommand = function() {
    this.id = "EXPORT_MARKDOWN_COMMAND";
    this.label = "Export As Markdown...";
    this.icon = "ui-icon-arrowthick-1-n";
    this.description = "Export the mind map as a markdown file"
};
mindmaps.ExportMarkdownCommand.prototype = new mindmaps.Command;
mindmaps.OpenDocumentCommand = function() {
    this.id = "OPEN_DOCUMENT_COMMAND";
    this.label = "Open...";
    this.shortcut = ["ctrl+o", "meta+o"];
    this.icon = "ui-icon-folder-open";
    this.description = "Open an existing mind map"
};
mindmaps.OpenDocumentCommand.prototype = new mindmaps.Command;
mindmaps.SaveDocumentCommand = function() {
    this.id = "SAVE_DOCUMENT_COMMAND";
    this.label = "Save As...";
    this.shortcut = ["ctrl+a", "meta+a"];
    this.icon = "ui-icon-disk";
    this.description = "Save the mind map"
};
mindmaps.SaveDocumentCommand.prototype = new mindmaps.Command;
mindmaps.CloseDocumentCommand = function() {
    this.id = "CLOSE_DOCUMENT_COMMAND";
    this.label = "Close";
    this.icon = "ui-icon-close";
    this.description = "Close the mind map"
};
mindmaps.CloseDocumentCommand.prototype = new mindmaps.Command;
mindmaps.FormatSidebarCommand = function() {
    this.id = "FORMAT_SIDEBAR_COMMAND";
    this.enabled = true;
    this.icon = "ui-icon-wrench";
    this.label = "Format";
    this.description = "Show or hide the format sidebar"
};
mindmaps.FormatSidebarCommand.prototype = new mindmaps.Command;
mindmaps.PrintCommand = function() {
    this.id = "PRINT_COMMAND";
    this.icon = "ui-icon-print";
    this.label = "Print";
    this.shortcut = ["ctrl+p", "meta+p"];
    this.description = "Print the mind map"
};
mindmaps.PrintCommand.prototype = new mindmaps.Command;
mindmaps.ExportCommand = function() {
    this.id = "EXPORT_COMMAND";
    this.icon = "ui-icon-image";
    this.label = "Export As Image...";
    this.description = "Export the mind map"
};
mindmaps.ExportCommand.prototype = new mindmaps.Command;
mindmaps.ToggleFontBoldCommand = function() {
    this.id = "TOGGLE_FONT_BOLD_COMMAND";
    this.shortcut = ["ctrl+b", "meta+b"];
    this.label = "Bold";
    this.description = "Toggle bold on selected node(s)"
};
mindmaps.ToggleFontBoldCommand.prototype = new mindmaps.Command;
mindmaps.ToggleFontItalicCommand = function() {
    this.id = "TOGGLE_FONT_ITALIC_COMMAND";
    this.shortcut = ["ctrl+i", "meta+i"];
    this.label = "Italic";
    this.description = "Toggle italic on selected node(s)"
};
mindmaps.ToggleFontItalicCommand.prototype = new mindmaps.Command;
mindmaps.ToggleFontUnderlineCommand = function() {
    this.id = "TOGGLE_FONT_UNDERLINE_COMMAND";
    this.shortcut = ["ctrl+u", "meta+u"];
    this.label = "Underline";
    this.description = "Toggle underline on selected node(s)"
};
mindmaps.ToggleFontUnderlineCommand.prototype = new mindmaps.Command;
mindmaps.ToggleFontLinethroughCommand = function() {
    this.id = "TOGGLE_FONT_LINETHROUGH_COMMAND";
    this.shortcut = ["ctrl+shift+x", "meta+shift+x"];
    this.label = "Strikethrough";
    this.description = "Toggle strikethrough on selected node(s)"
};
mindmaps.ToggleFontLinethroughCommand.prototype = new mindmaps.Command