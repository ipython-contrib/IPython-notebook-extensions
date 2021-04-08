define(["base/js/namespace", "jquery", "./spectrum"], function(
  Jupyter,
  $,
  Spectrum
) {
  "use strict";

  //=============
  var fs_style;
  var style_Sheet;
  var rule;
  var current_backgroundColor = "#fff";
  var current_backgroundColorInput = "#f7f7f7";
  var current_fontColor = "#000";
  var current_page_background_Color = "#fff";
  var palette = [
    ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
    ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
    [
      "#f4cccc",
      "#fce5cd",
      "#fff2cc",
      "#d9ead3",
      "#d0e0e3",
      "#cfe2f3",
      "#d9d2e9",
      "#ead1dc"
    ],
    [
      "#ea9999",
      "#f9cb9c",
      "#ffe599",
      "#b6d7a8",
      "#a2c4c9",
      "#9fc5e8",
      "#b4a7d6",
      "#d5a6bd"
    ],
    [
      "#e06666",
      "#f6b26b",
      "#ffd966",
      "#93c47d",
      "#76a5af",
      "#6fa8dc",
      "#8e7cc3",
      "#c27ba0"
    ],
    [
      "#c00",
      "#e69138",
      "#f1c232",
      "#6aa84f",
      "#45818e",
      "#3d85c6",
      "#674ea7",
      "#a64d79"
    ],
    [
      "#900",
      "#b45f06",
      "#bf9000",
      "#38761d",
      "#134f5c",
      "#0b5394",
      "#351c75",
      "#741b47"
    ],
    [
      "#600",
      "#783f04",
      "#7f6000",
      "#274e13",
      "#0c343d",
      "#073763",
      "#20124d",
      "#4c1130"
    ]
  ];

  // constructor
  var Color_control = function() {
    this.add_focus();
  };

  // Methods to return the default values
  Color_control.prototype.background_color_reset = function() {
    return current_backgroundColor;
  };
  Color_control.prototype.input_background_color_reset = function() {
    return current_backgroundColorInput;
  };

  Color_control.prototype.font_color_reset = function() {
    return current_fontColor;
  };

  Color_control.prototype.page_color_reset = function() {
    return current_page_background_Color;
  };

  // Spectrum used to set the background colour
  Color_control.prototype.background_color = function() {
    var that = this;
    $(function() {
      $("#color-picker-background").spectrum({
        showPaletteOnly: true,
        showSelectionPalette: true,
        togglePaletteOnly: true,
        togglePaletteMoreText: "more",
        togglePaletteLessText: "less",
        showInput: true,
        preferredFormat: "hex",
        showInitial: true,
        palette: palette,

        change: function(color) {
          current_backgroundColor = color.toHexString();
          current_backgroundColorInput = color.toHexString();
          that.set_color();
          localStorage.setItem(
            "background_color",
            JSON.stringify(current_backgroundColor)
          );
          localStorage.setItem(
            "background_input_color",
            JSON.stringify(current_backgroundColor)
          );
        }
      });
    });
  };

  // Sprectrum used to set the page background colour
  Color_control.prototype.page_background_color = function() {
    var that = this;
    $(function() {
      $("#color-picker-page-background").spectrum({
        showPaletteOnly: true,
        togglePaletteOnly: true,
        togglePaletteMoreText: "more",
        togglePaletteLessText: "less",
        showInput: true,
        preferredFormat: "hex",
        showInitial: true,
        palette: palette,

        change: function(color) {
          current_page_background_Color = color.toHexString();
          that.page_set_color();
          localStorage.setItem(
            "page_color",
            JSON.stringify(current_page_background_Color)
          );
        }
      });
    });
  };

  // Spectrum used to set the font colour
  Color_control.prototype.font_color = function() {
    var that = this;
    $(function() {
      $("#color-picker").spectrum({
        showPaletteOnly: true,
        togglePaletteOnly: true,
        togglePaletteMoreText: "more",
        togglePaletteLessText: "less",
        showInput: true,
        preferredFormat: "hex",
        showInitial: true,
        palette: palette,

        change: function(color) {
          current_fontColor = color.toHexString();
          that.set_color();
          localStorage.setItem("font_color", JSON.stringify(current_fontColor));
        }
      });
    });
  };

  // Functionality used to set the specified colours on the page
  Color_control.prototype.set_color = function(def) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      if (/.*\/custom\/custom\.css/.test(document.styleSheets[i].href)) {
        style_Sheet = document.styleSheets[i];
        break;
      }
    }
    rule = style_Sheet.cssRules;
    for (var i = 0; i < rule.length; i++) {
      if (/\.input_area/.test(rule[i].selectorText)) {
        fs_style = rule[i].style;
        break;
      }
    }

    // Define style rules to be changed
    var new_rule_1 =
      ".input_area div { background-color :" +
      current_backgroundColorInput +
      "!important;" +
      " }";
    var new_rule_default_1 =
      ".input_area div { background-color :" +
      current_backgroundColorInput +
      "}";

    var new_rule_2 =
      "div.text_cell_render { background-color :" +
      current_backgroundColor +
      "!important;" +
      "color : " +
      current_fontColor +
      "!important;" +
      " }";

    var new_rule_default_2 =
      "div.text_cell_render { background-color :" +
      current_backgroundColor +
      "color : " +
      current_fontColor +
      "}";

    var new_rule_3 =
      "div.output_area pre { color :" + current_fontColor + "!important; }";
    var new_rule_default_3 =
      "div.output_area pre { color :" + current_fontColor + "; }";

    var new_rule_4 =
      ".CodeMirror-scroll { background-color :" +
      current_backgroundColor +
      "!important;" +
      "color : " +
      current_fontColor +
      "!important;" +
      " }";

    var new_rule_default_4 =
      ".CodeMirror-scroll { background-color :" +
      current_backgroundColor +
      "color : " +
      current_fontColor +
      "}";
    var new_rule_5 =
      ".editor-preview { background-color :" +
      current_backgroundColor +
      "!important;" +
      "color : " +
      current_fontColor +
      "!important;" +
      " }";
    var new_rule_default_5 =
      ".editor-preview { background-color :" +
      current_backgroundColor +
      "color : " +
      current_fontColor +
      "}";

    var new_rule_6 =
      ".rendered_html pre { background-color : " +
      current_backgroundColor +
      " !important }";
    var new_rule_default_6 =
      ".rendered_html pre { background-color : " +
      current_backgroundColor +
      " }";

    var new_rule_7 =
      ".rendered_html pre code { background-color : " +
      current_backgroundColor +
      " !important }";
    var new_rule_default_7 =
      ".rendered_html pre code { background-color : " +
      current_backgroundColor +
      " }";

    if (fs_style == null) {
      style_Sheet.insertRule(def ? new_rule_default_1 : new_rule_1, 0);
      style_Sheet.insertRule(def ? new_rule_default_2 : new_rule_2, 1);
      style_Sheet.insertRule(def ? new_rule_default_3 : new_rule_3, 2);
      style_Sheet.insertRule(def ? new_rule_default_4 : new_rule_4, 3);
      style_Sheet.insertRule(def ? new_rule_default_5 : new_rule_5, 4);
      style_Sheet.insertRule(def ? new_rule_default_6 : new_rule_6, 5);
      style_Sheet.insertRule(def ? new_rule_default_7 : new_rule_7, 6);
    } else {
      // Remove old versions of rules
      this.remove_style_rule(/.input_area div/);
      this.remove_style_rule(/div.text_cell_render { background-color/);
      this.remove_style_rule(/div.output_area pre { color/);
      this.remove_style_rule(/.CodeMirror-scroll/);
      this.remove_style_rule(/.editor-preview/);
      this.remove_style_rule(/.rendered_html pre/);
      this.remove_style_rule(/.rendered_html pre code/);
      style_Sheet.insertRule(def ? new_rule_default_1 : new_rule_1, 0);
      style_Sheet.insertRule(def ? new_rule_default_2 : new_rule_2, 1);
      style_Sheet.insertRule(def ? new_rule_default_3 : new_rule_3, 2);
      style_Sheet.insertRule(def ? new_rule_default_4 : new_rule_4, 3);
      style_Sheet.insertRule(def ? new_rule_default_5 : new_rule_5, 4);
      style_Sheet.insertRule(def ? new_rule_default_6 : new_rule_6, 5);
      style_Sheet.insertRule(def ? new_rule_default_7 : new_rule_7, 6);
    }
    rule = style_Sheet.cssRules;
  };

  // Functionality to set the page background colour
  Color_control.prototype.page_set_color = function(def) {
    for (var i = 0; i < document.styleSheets.length; i++) {
      if (/.*\/custom\/custom\.css/.test(document.styleSheets[i].href)) {
        style_Sheet = document.styleSheets[i];
        break;
      }
    }
    rule = style_Sheet.cssRules;
    for (var i = 0; i < rule.length; i++) {
      if (/notebook-container/.test(rule[i].selectorText)) {
        fs_style = rule[i].style;
        break;
      }
    }

    var new_rule =
      "#notebook-container { background-color :" +
      current_page_background_Color +
      "!important; }";

    var new_rule_default =
      "#notebook-container { background-color :" +
      current_page_background_Color +
      "}";

    if (fs_style == null) {
      style_Sheet.insertRule(def ? new_rule_default : new_rule, 0);
    } else {
      this.remove_style_rule(/#notebook-container/);
      style_Sheet.insertRule(def ? new_rule_default : new_rule, 0);
    }
    rule = style_Sheet.cssRules;
  };

  // Add focus support to the spectrum
  Color_control.prototype.add_focus = function() {
    $("head").append('<style type="text/css"></style>');
    var newStyleElement = $("head").children(":last");
    newStyleElement.html(
      ".sp-palette .sp-thumb-el.sp-thumb-focus {outline: 1px dotted #212121;outline: 5px auto -webkit-focus-ring-color;}"
    );
  };

  Color_control.prototype.get_background_color = function() {
    return current_backgroundColor;
  };

  Color_control.prototype.get_page_color = function() {
    return current_page_background_Color;
  };

  Color_control.prototype.get_font_color = function() {
    return current_fontColor;
  };

  Color_control.prototype.get_input_background_color = function() {
    return current_backgroundColorInput;
  };

  Color_control.prototype.set_background_color = function(background, def) {
    current_backgroundColor = background;
    if (!def) {
      localStorage.setItem("background_color", JSON.stringify(background));
    }
    this.set_color(def);
    $("#color-picker-background").spectrum("set", background);
  };

  Color_control.prototype.set_background_input_color = function(
    background_input,
    def
  ) {
    current_backgroundColorInput = background_input;
    if (!def) {
      localStorage.setItem(
        "background_input_color",
        JSON.stringify(background_input)
      );
    }
    this.set_color(def);
  };

  Color_control.prototype.set_font_color = function(font, def) {
    current_fontColor = font;
    if (!def) {
      localStorage.setItem("font_color", JSON.stringify(font));
    }
    this.set_color(def);
    $("#color-picker").spectrum("set", font);
  };

  Color_control.prototype.set_page_color = function(page, def) {
    current_page_background_Color = page;
    if (!def) {
      localStorage.setItem("page_color", JSON.stringify(page));
    }
    this.set_color(def);
    this.page_set_color(def);
    $("#color-picker-page-background").spectrum("set", page);
  };

  // Remove a style rule from the stylesheet
  Color_control.prototype.remove_style_rule = function(value) {
    for (var j = 0; j < rule.length; j++) {
      if (value.test(rule[j].cssText)) {
        style_Sheet.deleteRule(j);
        rule = style_Sheet.cssRules;
      }
    }
  };

  return Color_control;
});
