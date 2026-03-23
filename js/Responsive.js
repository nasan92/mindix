mindmaps.Responsive = function() {
    var e = this;
    this.isTouchDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
    this.getToolbarMode = function() {
        var t = $(window).width();
        if (t <= 860) {
            return "icon-only"
        }
        return e.inEm(t) < 117 ? "compact" : "full"
    };
    this.isMiddleDevice = function() {
        return "full" !== e.getToolbarMode()
    };
    this.font_size = parseFloat($("body").css("font-size"));
    this.inEm = function(e) {
        return e / this.font_size
    }
};
mindmaps.responsive = new mindmaps.Responsive