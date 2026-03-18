function timeit(f, c) {
    var t = (new Date).getTime();
    f();
    t = (new Date).getTime() - t;
    console.log(c || "", t, "ms")
}
mindmaps.Util = mindmaps.Util || {};
mindmaps.Util.colorThemeStorageKey = "mindmaps.color.theme";
mindmaps.Util.colorThemes = {
    classic: {
        label: "Classic",
        branch: ["#333399", "#008080", "#33cccc", "#000080", "#008000", "#c0c0c0", "#ccffff", "#ffff99", "#ffcc99", "#666699", "#3366ff", "#00ffff", "#ff6600", "#993366", "#993300", "#99cc00", "#ffcc00", "#ff99cc", "#808080", "#800080", "#00ccff", "#ffff00", "#ff00ff", "#800000", "#ff0000", "#00ff00", "#0000ff", "#ffa500", "#000000", "#ffffff"],
        border: ["#264653", "#2a9d8f", "#1d3557", "#2b2d42", "#386641", "#6c757d", "#577590", "#8d99ae", "#8c564b", "#495057", "#3a86ff", "#0077b6", "#e76f51", "#7b2cbf", "#9c6644", "#6a994e", "#b08900", "#b56576", "#6d6875", "#5a189a"],
        background: ["#ffffff", "#f8f9fa", "#f1faee", "#fefae0", "#fff1e6", "#edf6f9", "#e9f5db", "#fdf0d5", "#f8edeb", "#faf3dd", "#eef7f2", "#eef4ff"],
        connect: ["#1d3557", "#457b9d", "#2a9d8f", "#6a994e", "#bc6c25", "#e76f51", "#9d4edd", "#7f5539", "#6d597a", "#3a86ff"],
        font: ["#111111", "#1d3557", "#264653", "#3d405b", "#4a4e69", "#5f0f40", "#6b705c", "#2b2d42", "#003049", "#2d3142"]
    },
    rainbow: {
        label: "Rainbow",
        branch: ["#e63946", "#ff7f11", "#ffbe0b", "#8ac926", "#2ec4b6", "#00bbf9", "#3a86ff", "#8338ec", "#ff006e", "#ef476f", "#06d6a0", "#118ab2", "#f72585", "#7209b7", "#4361ee", "#4cc9f0", "#f3722c", "#90be6d", "#43aa8b", "#577590"],
        border: ["#b5172f", "#c05621", "#b08900", "#5a8f29", "#1d8a85", "#0077b6", "#1d4ed8", "#6d28d9", "#be185d", "#a4133c", "#0c7a66", "#0b5f7a", "#b40e61", "#560bad", "#2643b8", "#0ea5e9", "#c2410c", "#5f8a3f", "#2d6a4f", "#3a5a7a"],
        background: ["#fff5f5", "#fff7ed", "#fffbeb", "#f7fee7", "#ecfeff", "#eff6ff", "#f5f3ff", "#fdf2f8", "#f0fdf4", "#eef2ff"],
        connect: ["#e63946", "#ff7f11", "#8ac926", "#2ec4b6", "#3a86ff", "#8338ec", "#ff006e", "#06d6a0", "#f3722c", "#577590"],
        font: ["#111111", "#9b2226", "#7f4f24", "#386641", "#0f766e", "#1d4ed8", "#5b21b6", "#be185d", "#1f2937", "#334155"]
    },
    usefulcharts: {
        label: "UsefulCharts",
        branch: ["#0b3954", "#087e8b", "#bfd7ea", "#ff5a5f", "#c81d25", "#7d4f50", "#588157", "#a98467", "#6b705c", "#bc6c25", "#3d405b", "#7f5539", "#1d3557", "#52796f", "#8d99ae", "#9a8c98", "#6d597a", "#2f3e46", "#264653", "#4a4e69"],
        border: ["#072b3f", "#065c66", "#6c8ca1", "#c73d43", "#8b1a1f", "#5b3a3b", "#3e5c3f", "#7e624e", "#4f554c", "#8f4e1f", "#2b2d42", "#5a3e2b", "#102a43", "#3f6b62", "#64748b", "#6b6572", "#51445a", "#1f2d33", "#1c3d46", "#34364f"],
        background: ["#f8fafc", "#f1f5f9", "#f8f9fa", "#fef2f2", "#fff7ed", "#f7f7f7", "#f2f8f2", "#f8f3ef", "#f6f4f1", "#fff8f1"],
        connect: ["#0b3954", "#087e8b", "#ff5a5f", "#c81d25", "#588157", "#bc6c25", "#3d405b", "#52796f", "#6d597a", "#2f3e46"],
        font: ["#111111", "#0b3954", "#3d405b", "#2f3e46", "#4a4e69", "#5a3e2b", "#102a43", "#34364f", "#1f2937", "#334155"]
    }
};
mindmaps.Util.activeColorTheme = "classic";
mindmaps.Util.getColorThemeNames = function() {
    var names = [];
    for (var name in mindmaps.Util.colorThemes) {
        if (mindmaps.Util.colorThemes.hasOwnProperty(name)) {
            names.push(name)
        }
    }
    return names
};
mindmaps.Util.getColorThemeLabel = function(name) {
    var theme = mindmaps.Util.colorThemes[name];
    return theme ? theme.label : name
};
mindmaps.Util.getActiveColorTheme = function() {
    return mindmaps.Util.activeColorTheme
};
mindmaps.Util.applyColorTheme = function(name) {
    var theme = mindmaps.Util.colorThemes[name] || mindmaps.Util.colorThemes.classic;
    var selectedName = mindmaps.Util.colorThemes[name] ? name : "classic";
    mindmaps.Util.activeColorTheme = selectedName;
    mindmaps.Util.colors10 = theme.branch.slice(0);
    mindmaps.Util.colors20 = theme.branch.slice(0);
    mindmaps.Util.colors20b = (theme.border || theme.branch).slice(0);
    mindmaps.Util.colors20c = (theme.background || theme.branch).slice(0);
    mindmaps.Util.colors20d = (theme.connect || theme.branch).slice(0);
    mindmaps.Util.fontColors = (theme.font || theme.branch).slice(0)
};
mindmaps.Util.setColorTheme = function(name) {
    mindmaps.Util.applyColorTheme(name);
    try {
        localStorage.setItem(mindmaps.Util.colorThemeStorageKey, mindmaps.Util.activeColorTheme)
    } catch (e) {}
    return mindmaps.Util.activeColorTheme
};
mindmaps.Util.loadPersistedColorTheme = function() {
    var savedTheme = null;
    try {
        savedTheme = localStorage.getItem(mindmaps.Util.colorThemeStorageKey)
    } catch (e) {}
    mindmaps.Util.applyColorTheme(savedTheme || "classic")
};
mindmaps.Util.getColorByIndex = function(colors, index) {
    if (!colors || !colors.length) {
        return "#000000"
    }
    var i = index % colors.length;
    if (i < 0) {
        i += colors.length
    }
    return colors[i]
};
mindmaps.Util.getThemeBranchColor = function(index) {
    return mindmaps.Util.getColorByIndex(mindmaps.Util.colors20, index || 0)
};
mindmaps.Util.getOrderedChildren = function(node) {
    if (!node || !node.children || !node.children.indexes || !node.children.nodes) {
        return node && node.getChildren ? node.getChildren() : []
    }
    return node.children.indexes.map(function(id) {
        return node.children.nodes[id]
    }).filter(function(child) {
        return !!child
    })
};
mindmaps.Util.getNextRootBranchColor = function(rootNode) {
    var index = 0;
    if (rootNode && rootNode.isRoot && rootNode.isRoot()) {
        index = mindmaps.Util.getOrderedChildren(rootNode).length
    }
    return mindmaps.Util.getThemeBranchColor(index)
};
mindmaps.Util.applyBranchColorToSubtree = function(node, color, onNodeColorChanged) {
    if (!node) {
        return
    }
    node.setPluginData("style", "branchColor", color);
    if (onNodeColorChanged) {
        onNodeColorChanged(node, color)
    }
    node.forEachChild(function(child) {
        mindmaps.Util.applyBranchColorToSubtree(child, color, onNodeColorChanged)
    })
};
mindmaps.Util.applyThemeToMindMap = function(mindMap, onNodeColorChanged) {
    if (!mindMap || !mindMap.getRoot) {
        return
    }
    var root = mindMap.getRoot();
    var topLevel = mindmaps.Util.getOrderedChildren(root);
    topLevel.forEach(function(child, index) {
        var color = mindmaps.Util.getThemeBranchColor(index);
        mindmaps.Util.applyBranchColorToSubtree(child, color, onNodeColorChanged)
    })
};
mindmaps.Util.loadPersistedColorTheme();
mindmaps.Util.touchHandler = function(f) {
    var c = f.changedTouches[0],
        t = "";
    switch (f.type) {
        case "touchstart":
            t = "mousedown";
            break;
        case "touchmove":
            t = "mousemove";
            break;
        case "touchend":
            t = "mouseup";
            break;
        default:
            return
    }
    var n = document.createEvent("MouseEvent");
    n.initMouseEvent(t, !0, !0, window, 1, c.screenX, c.screenY, c.clientX, c.clientY, !1, !1, !1, !1, 0, null), c.target.dispatchEvent(n), f.preventDefault()
}, mindmaps.Util.trackEvent = function(f, c, t) {}, mindmaps.Util.createUUID = function() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(f) {
        var c = 16 * Math.random() | 0;
        return ("x" == f ? c : 3 & c | 8).toString(16)
    })
}, mindmaps.Util.getId = function() {
    return mindmaps.Util.createUUID()
}, mindmaps.Util.randomColor = function() {
    return mindmaps.Util.getThemeBranchColor(0)
}, mindmaps.Util.getUrlParams = function() {
    function f(f) {
        return decodeURIComponent(f.replace(n, " "))
    }
    for (var c, t = {}, n = /\+/g, e = /([^&=]+)=?([^&]*)/g, a = window.location.search.substring(1); c = e.exec(a);) t[f(c[1])] = f(c[2]);
    return t
}, mindmaps.Util.distance = function(f, c) {
    return Math.sqrt(f * f + c * c)
};