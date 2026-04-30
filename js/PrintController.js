mindmaps.PrintController = function(e, t, n) {
    function s() {
        var svgRenderer = new mindmaps.StaticSVGRenderer;
        var svgString = svgRenderer.render(n.getDocument());
        var svgContent = svgString.replace(/^<\?xml[^]*?\?>\s*/, '');
        $("#print-area").html(svgContent);
        setTimeout(function() {
            window.print();
        }, 250);
    }
    var r = t.get(mindmaps.PrintCommand);
    r.setHandler(s);
    e.subscribe(mindmaps.Event.DOCUMENT_CLOSED, function() {
        r.setEnabled(false)
    });
    e.subscribe(mindmaps.Event.DOCUMENT_OPENED, function() {
        r.setEnabled(true)
    })
}
