mindmaps.AutoSaveController = function(e, t) {
    function i() {
        console.debug("Autosaving...");
        t.saveToLocalStorage().then(function() {
            if (t.getLinkedFileHandle()) {
                return t.saveToLinkedFile()
            }
        })
    }

    function s() {
        if (!r) {
            r = setInterval(i, n)
        }
    }

    function o() {
        if (r) {
            clearInterval(r);
            r = null
        }
    }

    // Debounced save: fires 1.5 s after the last change event
    function onMapChanged() {
        if (!t.getDocument || !t.getDocument()) {
            return;
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(i, debounceDelay)
    }

    var n = 1e3 * 60;
    var r = null;
    var debounceDelay = 1500;
    var debounceTimer = null;

    var changeEvents = [
        mindmaps.Event.NODE_CREATED,
        mindmaps.Event.NODE_DELETED,
        mindmaps.Event.NODE_MOVED,
        mindmaps.Event.NODE_TEXT_CAPTION_CHANGED,
        mindmaps.Event.NODE_BORDER_CHANGED,
        mindmaps.Event.NODE_FONT_CHANGED,
        mindmaps.Event.NODE_LINE_WIDTH_CHANGED,
        mindmaps.Event.NODE_BRANCH_COLOR_CHANGED,
        mindmaps.Event.TWO_NODES_CONNECTED,
        mindmaps.Event.TWO_NODES_DISCONNECTED,
        mindmaps.Event.CONNECTION_COLOR_CHANGED
    ];

    this.enable = function() {
        s();
        t.getDocument().setAutoSave(true)
    };
    this.disable = function() {
        o();
        t.getDocument().setAutoSave(false)
    };
    this.isEnabled = function() {
        return t.getDocument().isAutoSave()
    };
    this.init = function() {
        e.subscribe(mindmaps.Event.DOCUMENT_OPENED, this.documentOpened.bind(this));
        e.subscribe(mindmaps.Event.DOCUMENT_CLOSED, this.documentClosed.bind(this));
        for (var idx = 0; idx < changeEvents.length; idx++) {
            e.subscribe(changeEvents[idx], onMapChanged)
        }
    };
    this.documentOpened = function(e) {
        if (this.isEnabled()) {
            s()
        }
    };
    this.documentClosed = function() {
        o();
        clearTimeout(debounceTimer)
    };
    this.init()
}