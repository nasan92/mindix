(function($) {
    var currentTrigger, currentPalette;
    var instanceCount = 0;

    var COMMON_COLORS = [
        // Row 1: Whites & Grays
        "#ffffff", "#f2f2f2", "#d9d9d9", "#bfbfbf", "#808080", "#595959", "#262626", "#000000",
        // Row 2: Yellows & Oranges
        "#fff2cc", "#ffe599", "#ffd966", "#ffc000", "#ff9900", "#ff6600", "#e04000", "#a32000",
        // Row 3: Reds & Pinks
        "#fce4d6", "#f4b183", "#e07060", "#e63946", "#c0392b", "#922b21", "#d63384", "#880e4f",
        // Row 4: Purples
        "#f3e5f5", "#ce93d8", "#ab47bc", "#9c27b0", "#8338ec", "#6a0dad", "#5c1b9e", "#311b92",
        // Row 5: Blues
        "#e3f2fd", "#90caf9", "#42a5f5", "#2196f3", "#1565c0", "#0d47a1", "#3a86ff", "#001064",
        // Row 6: Teals & Cyans
        "#e0f7fa", "#80deea", "#26c6da", "#00acc1", "#00838f", "#006064", "#00bcd4", "#0097a7",
        // Row 7: Greens
        "#e8f5e9", "#a5d6a7", "#66bb6a", "#4caf50", "#2e7d32", "#1b5e20", "#06d6a0", "#00695c"
    ];

    var RECENT_KEY = "mindmaps.colorpicker.recent";
    var MAX_RECENT = 10;

    function getRecentColors() {
        try {
            var stored = localStorage.getItem(RECENT_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    function addRecentColor(hex) {
        if (!hex || hex === "transparent") return;
        var norm = hex.toLowerCase();
        var colors = getRecentColors().filter(function(c) {
            return c.toLowerCase() !== norm;
        });
        colors.unshift(norm);
        colors = colors.slice(0, MAX_RECENT);
        try {
            localStorage.setItem(RECENT_KEY, JSON.stringify(colors));
        } catch (e) {}
    }

    function createSwatch(color) {
        var swatch = $('<div class="colorPicker-swatch">&nbsp;</div>');
        swatch.css("background-color", color);
        swatch.on({
            click: function() {
                $.fn.colorPicker.changeColor(color);
            },
            mouseover: function() {
                $(this).css("border-color", "#598FEF");
                $.fn.colorPicker.previewColor(color);
            },
            mouseout: function() {
                $(this).css("border-color", "");
                if (currentTrigger) {
                    $.fn.colorPicker.previewColor(currentTrigger.css("background-color"));
                }
            }
        });
        return swatch;
    }

    function buildRecentGrid() {
        var grid = $('<div class="cp-color-grid cp-recent-grid"></div>');
        var recentColors = getRecentColors();
        if (recentColors.length === 0) {
            grid.append($('<span class="cp-empty-label">No recent colors</span>'));
        } else {
            $.each(recentColors, function(idx, color) {
                grid.append(createSwatch(color));
            });
        }
        return grid;
    }

    function buildCollapsibleSection(title, contentEl) {
        var section = $('<div class="cp-section"></div>');
        var header = $('<div class="cp-section-header"><span class="cp-arrow">&#9660;</span>' + title + '</div>');
        var body = $('<div class="cp-section-body"></div>');
        body.append(contentEl);
        header.on("click", function() {
            body.toggle();
            header.find(".cp-arrow").html(body.is(":visible") ? "&#9660;" : "&#9654;");
        });
        section.append(header).append(body);
        return section;
    }

    function buildPalette(id, themeColors) {
        var palette = $('<div class="colorPicker-palette inspector"></div>').attr("id", id);

        // Common colors grid
        var commonGrid = $('<div class="cp-color-grid"></div>');
        $.each(COMMON_COLORS, function(idx, color) {
            commonGrid.append(createSwatch(color));
        });
        palette.append(commonGrid);

        // Hex input row
        var hexRow = $('<div class="cp-hex-row"></div>');
        var hexWrap = $('<div class="cp-hex-wrap"></div>');
        var hashSpan = $('<span class="cp-hash">#</span>');
        var hexInput = $('<input type="text" class="cp-hex-input" maxlength="6" spellcheck="false" />');
        var previewSwatch = $('<div class="cp-preview-swatch"></div>');
        var nativeInput = $('<input type="color" class="cp-native-hidden" tabindex="-1" />');
        var wheelBtn = $('<button type="button" class="cp-wheel-btn" title="Open color picker"></button>');

        hexInput.on("keydown", function(e) {
            if (e.keyCode === 13) {
                var hex = $.fn.colorPicker.toHex("#" + $(this).val().replace("#", ""));
                if (hex) $.fn.colorPicker.changeColor(hex);
            }
            if (e.keyCode === 27) $.fn.colorPicker.hidePalette();
        });
        hexInput.on("input", function() {
            var val = $(this).val().replace("#", "");
            var hex = $.fn.colorPicker.toHex("#" + val);
            if (hex) {
                previewSwatch.css("background-color", hex);
                $.fn.colorPicker.previewColor(hex);
            }
        });

        wheelBtn.on("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            nativeInput[0].click();
        });
        nativeInput.on("input change", function() {
            var hex = $(this).val();
            hexInput.val(hex.replace("#", ""));
            previewSwatch.css("background-color", hex);
            $.fn.colorPicker.changeColor(hex);
        });

        hexWrap.append(hashSpan).append(hexInput);
        hexRow.append(hexWrap).append(previewSwatch).append(wheelBtn).append(nativeInput);
        palette.append(hexRow);

        palette.data("hexInput", hexInput);
        palette.data("previewSwatch", previewSwatch);
        palette.data("nativeInput", nativeInput);

        // Current theme section
        var themeGrid = $('<div class="cp-color-grid"></div>');
        $.each(themeColors, function(idx, color) {
            var hex = color.charAt(0) === "#" ? color : "#" + color;
            themeGrid.append(createSwatch(hex));
        });
        palette.append(buildCollapsibleSection("Current Theme", themeGrid));

        // Recently used section
        var recentSection = buildCollapsibleSection("Recently Used", buildRecentGrid());
        palette.data("recentSection", recentSection);
        palette.append(recentSection);

        return palette;
    }

    $.fn.colorPicker = function(options) {
        return this.each(function() {
            var inputEl = $(this);
            var opts = $.extend({}, $.fn.colorPicker.defaults, options);
            var initialColor = $.fn.colorPicker.toHex(
                inputEl.val().length > 0 ? inputEl.val() : opts.pickerDefault
            ) || "#ffffff";

            // Clean up any prior instance for this input
            var oldPaletteId = inputEl.data("cp-palette-id");
            if (oldPaletteId) {
                $("#" + oldPaletteId).remove();
            }

            var paletteId = "colorPicker_palette-" + instanceCount;
            inputEl.data("cp-palette-id", paletteId);

            var trigger = $('<div class="colorPicker-picker">&nbsp;</div>');
            var palette = buildPalette(paletteId, opts.colors || []);

            $("body").append(palette);
            palette.hide();

            trigger.css("background-color", initialColor);
            trigger.on("click", function() {
                if (currentPalette && currentPalette.attr("id") === paletteId && currentPalette.is(":visible")) {
                    $.fn.colorPicker.hidePalette();
                } else {
                    $.fn.colorPicker.showPalette(palette, trigger);
                }
            });

            inputEl.after(trigger);
            inputEl.off("change.cp").on("change.cp", function() {
                var hex = $.fn.colorPicker.toHex($(this).val());
                if (hex) trigger.css("background-color", hex);
            });
            inputEl.val(initialColor).hide();

            instanceCount++;
        });
    };

    $.extend(true, $.fn.colorPicker, {
        toHex: function(e) {
            if (!e) return false;
            if (e.match(/[0-9A-F]{6}|[0-9A-F]{3}$/i)) {
                return e.charAt(0) === "#" ? e : "#" + e;
            } else if (e.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/)) {
                var rgb = [parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10), parseInt(RegExp.$3, 10)];
                var pad = function(s) { while (s.length < 2) s = "0" + s; return s; };
                return "#" + pad(rgb[0].toString(16)) + pad(rgb[1].toString(16)) + pad(rgb[2].toString(16));
            }
            return false;
        },
        checkMouse: function(e) {
            if (!currentPalette) return;
            var inPalette = $(e.target).closest("#" + currentPalette.attr("id")).length > 0;
            var onTrigger = currentTrigger && (e.target === currentTrigger[0]);
            if (!inPalette && !onTrigger) {
                $.fn.colorPicker.hidePalette();
            }
        },
        hidePalette: function() {
            $(document).off("mousedown.cp", $.fn.colorPicker.checkMouse);
            $(".colorPicker-palette").hide();
            currentPalette = null;
            currentTrigger = null;
        },
        showPalette: function(palette, trigger) {
            // Hide any currently open palette first
            $(".colorPicker-palette").hide();
            $(document).off("mousedown.cp", $.fn.colorPicker.checkMouse);

            currentTrigger = trigger;
            currentPalette = palette;

            // Sync hex input and preview with current trigger color
            var currentColor = $.fn.colorPicker.toHex(trigger.css("background-color")) || "#ffffff";
            var hexInput = palette.data("hexInput");
            var previewSwatch = palette.data("previewSwatch");
            var nativeInput = palette.data("nativeInput");

            if (hexInput) hexInput.val(currentColor.replace("#", ""));
            if (previewSwatch) previewSwatch.css("background-color", currentColor);
            if (nativeInput) nativeInput.val(currentColor);

            // Refresh recently used
            var recentSection = palette.data("recentSection");
            if (recentSection) {
                recentSection.find(".cp-section-body").empty().append(buildRecentGrid());
            }

            // Measure and position the palette
            palette.css({ visibility: "hidden", display: "block", top: -9999, left: -9999 });
            var paletteH = palette.outerHeight();
            var paletteW = palette.outerWidth();
            palette.css({ display: "none", visibility: "" });

            var offset = trigger.offset();
            var top = offset.top - paletteH - 4;
            if (top < 4) top = offset.top + trigger.outerHeight() + 4;

            var left = offset.left;
            var winW = $(window).width();
            if (left + paletteW > winW - 8) left = winW - paletteW - 8;
            if (left < 4) left = 4;

            palette.css({ top: top, left: left }).show();
            $(document).on("mousedown.cp", $.fn.colorPicker.checkMouse);
        },
        changeColor: function(color) {
            if (!color || !currentTrigger) return;
            currentTrigger.css("background-color", color);
            currentTrigger.prev("input").val(color).change();
            addRecentColor(color);
            $.fn.colorPicker.hidePalette();
        },
        previewColor: function(color) {
            if (currentTrigger) currentTrigger.css("background-color", color);
        },
        // Kept for backward compatibility
        bindPalette: function(hexField, swatch, color) {
            var effectiveColor = color || $.fn.colorPicker.toHex(swatch.css("background-color"));
            swatch.on({
                click: function() { $.fn.colorPicker.changeColor(effectiveColor); },
                mouseover: function() {
                    $(this).css("border-color", "#598FEF");
                    $.fn.colorPicker.previewColor(effectiveColor);
                },
                mouseout: function() {
                    $(this).css("border-color", "");
                    if (currentTrigger) $.fn.colorPicker.previewColor(currentTrigger.css("background-color"));
                }
            });
        }
    });

    $.fn.colorPicker.defaults = {
        pickerDefault: "FFFFFF",
        colors: [],
        addColors: []
    };
})(jQuery);
