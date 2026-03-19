/**
 * The canvas container is the area in between the toolbar and the statusbar.
 * Inside the mind map will be drawn and the floating panels are contained
 * within this area.
 *
 * @constructor
 */
mindmaps.CanvasContainer = function () {
    var self = this;
    var $content = $("#canvas-container");

    /**
     * @returns {jQuery}
     */
    this.getContent = function () {
        return $content;
    };

    /**
     * Sets the height of the canvas to fit between header and footer.
     */
    this.setSize = function () {
        var windowHeight = $(window).height();
        var headerHeight = $("#topbar").outerHeight(true);
        var footerHeight = $("#bottombar").outerHeight(true);
        var height = windowHeight - headerHeight - footerHeight;
        $content.height(height);

        var size = new mindmaps.Point($content.width(), height);
        self.publish(mindmaps.CanvasContainer.Event.RESIZED, size);
    };

    /**
     * Set up the container to accept drag and drop of files from the desktop.
     */
    this.acceptFileDrop = function () {
        function ignore(e) {
            e.originalEvent.stopPropagation();
            e.originalEvent.preventDefault();
        }

        function handleDragOver(e) {
            ignore(e);
        }

        function handleDrop(e) {
            ignore(e);

            var files = e.originalEvent.dataTransfer.files;
            var file = files[0];

            var reader = new FileReader();
            reader.onload = function () {
                self.receivedFileDrop(reader.result);
            };
            reader.readAsText(file);
        }

        $content.bind('dragover', handleDragOver);
        $content.bind('drop', handleDrop);
    };

    this.init = function () {
        // recalculate size when window is resized.
        $(window).resize(function () {
            self.setSize();
        });

        this.setSize();
        this.acceptFileDrop();
    };

    /**
     * Callback for when a file was dropped onto the container.
     *
     * @event
     * @param {String} result
     */
    this.receivedFileDrop = function (result) {
    };

};
EventEmitter.mixin(mindmaps.CanvasContainer);

/**
 * Events fired by the container.
 *
 * @namespace
 */
mindmaps.CanvasContainer.Event = {
    /**
     * Fired when the container has been resized.
     *
     * @event
     * @param {mindmaps.Point} point the new size
     */
    RESIZED: "ResizedEvent"
};

/**
 * Creates a new MainViewController. The controller is responsible for creating
 * all main ui elements.
 *
 * @constructor
 * @param {mindmaps.EventBus} eventBus
 * @param {mindmaps.MindMapModel} mindmapModel
 * @param {mindmaps.InspectorView} view
 */
mindmaps.MainViewController = function (eventBus, mindmapModel, commandRegistry) {
    var zoomController = new mindmaps.ZoomController(eventBus, commandRegistry);
    var canvasContainer = new mindmaps.CanvasContainer();
    var sidebarState = {
        $root: null
    };

    function ensureFormatSidebar() {
        if (sidebarState.$root) {
            return sidebarState.$root;
        }

        var $container = canvasContainer.getContent();
        var $sidebar = $container.children("#format-sidebar").first();
        if (!$sidebar.length) {
            $sidebar = $("<div/>", {
                id: "format-sidebar"
            }).appendTo($container);
        }

        sidebarState.$root = $sidebar;
        return $sidebar;
    }

    function createSidebarSection(title, $content) {
        return $("<section/>", {
            "class": "format-sidebar-section"
        }).append(
            $("<h3/>", {
                "class": "format-sidebar-title",
                text: title
            }),
            $("<div/>", {
                "class": "format-sidebar-body"
            }).append($content)
        );
    }

    /**
     * When a file was dropped on the canvas container try to open it.
     */
    canvasContainer.receivedFileDrop = function (result) {
        try {
            var doc = mindmaps.Document.fromJSON(result);
			
			if(mindmaps.isMapLoadingConfirmationRequired)
			{
			$( "#dialog-confirm" ).dialog({
      resizable: false,
      height:140,
      modal: true,
      buttons: {
        "Proceed": function() {
			mindmapModel.setDocument(doc);
			mindmaps.currentMapId = 'new-import-file';
			window.location.hash = 'm:new-import-file';
			mindmaps.isMapLoadingConfirmationRequired = false;
			mindmaps.ignoreHashChange = true;
          $( this ).dialog( "close" );
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        }
      }
    });
			}
			else 
			{
			 mindmapModel.setDocument(doc);
			mindmaps.currentMapId = 'new-import-file';
			window.location.hash = 'm:new-import-file';
			mindmaps.isMapLoadingConfirmationRequired = false;
			mindmaps.ignoreHashChange = true;
			
			}
			
			
        } catch (e) {
            eventBus.publish(mindmaps.Event.NOTIFICATION_ERROR, "Could not read the file.");
            console.warn("Could not open the mind map via drag and drop.");
        }
    };

    this.go = function () {
        canvasContainer.init();

        // init all presenters

        // toolbar
        var toolbar = new mindmaps.ToolBarView();
        mindmaps.ui.toolbarView=toolbar
        var toolbarPresenter = new mindmaps.ToolBarPresenter(eventBus,
            commandRegistry, toolbar, mindmapModel, canvasContainer);
        toolbarPresenter.go();

        // canvas
        var canvas = new mindmaps.DefaultCanvasView();
        var canvasPresenter = new mindmaps.CanvasPresenter(eventBus,
            commandRegistry, mindmapModel, canvas, zoomController);
        canvasPresenter.go();

        mindmaps.ui.canvasView=canvas

        // statusbar
        var statusbar = new mindmaps.StatusBarView();
        var statusbarPresenter = new mindmaps.StatusBarPresenter(eventBus,
            statusbar);
        statusbarPresenter.go();

        mindmaps.ui.statusbarPresenter=statusbarPresenter


        // inspector
        var inspectorView = new mindmaps.InspectorView();
        var inspectorPresenter = new mindmaps.InspectorPresenter(eventBus,
            mindmapModel, commandRegistry, inspectorView);
        inspectorPresenter.go();

        // navigator
        var naviView = new mindmaps.NavigatorView();
        var naviPresenter = new mindmaps.NavigatorPresenter(eventBus, naviView,
            canvasContainer, zoomController);
        naviPresenter.go();

        var $sidebar = ensureFormatSidebar();
        $sidebar.empty().append(
            createSidebarSection("Inspector", inspectorView.getContent()),
            createSidebarSection("Navigator", naviView.getContent())
        );




    };
};
