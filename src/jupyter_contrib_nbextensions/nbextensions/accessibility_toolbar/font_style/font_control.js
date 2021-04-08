define(["base/js/namespace", "jquery"], function(Jupyter, $) {
  "use strict";

  var Font_control = function() {
    var paddingBot = 0;
    var paddingTop = 0;
    var fs_style;
    var style_file;
    const font_value_list = [
      "Helvetica Neue, Helvetica, Arial, sans-serif",
      "monospace",
      "Arial, Helvetica, sans-serif",
      "'Arial Black', Gadget, sans-serif",
      "'Comic Sans MS', cursive, sans-serif",
      "Georgia, serif",
      "Impact, Charcoal, sans-serif, cursive, sans-serif",
      "'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
      "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
      "Tahoma, Geneva, sans-serif",
      "'Times New Roman', Times, serif",
      "Verdana, Geneva, sans-serif"
    ];

    const font_name_list = [
      "Default",
      "Monospace",
      "Arial",
      "Arial Black",
      "Comic Sans MS",
      "Georgia",
      "Impact",
      "Lucida Sans Unicode",
      "Palatino Linotype",
      "Tahoma",
      "Times New Roman",
      "Verdana"
    ];
    const font_size_list = [
      "10",
      "12",
      "14",
      "20",
      "28",
      "32",
      "48",
      "56",
      "64",
      "72"
    ];

    //Get the custom.css file from Jupyter notebook and initialize the select-box for font name
    Font_control.prototype.font_name = function() {
      for (i = 0; i < document.styleSheets.length; i++) {
        if (/.*\/custom\/custom\.css/.test(document.styleSheets[i].href)) {
          style_file = document.styleSheets[i];
          break;
        }
      }
      for (i = 0; i < style_file.cssRules.length; i++) {
        if (/\.CodeMirror pre/.test(style_file.cssRules[i].selectorText)) {
          fs_style = style_file.cssRules[i].style;
          break;
        }
      }
      if (fs_style == null) {
        style_file.insertRule(
          ".CodeMirror pre { font-size: 14px; padding-bottom: 0px; padding-top:0px}",
          0
        );
        style_file.insertRule(".CodeMirror span{ font-family: monospace; }", 1);
        style_file.insertRule(
          "div.output_area pre{ font-family: monospace; }",
          2
        );
        style_file.insertRule(
          ".CodeMirror pre span{ font-family: monospace; }",
          3
        );
        fs_style = style_file.cssRules;
      }

      var fs_font_name = $("<select>", {
        id: "font_name",
        class: "select-box",
        style: "float:right"
      });
      for (var i in font_value_list) {
        if (
          font_value_list[i] == "'Helvetica Neue', Helvetica, Arial, sans-serif"
        ) {
          fs_font_name.append(
            $("<option>", {
              value: font_value_list[i],
              class: "select-box-options",
              selected: "selected"
            }).text(font_name_list[i])
          );
        } else {
          fs_font_name.append(
            $("<option>", {
              value: font_value_list[i],
              class: "select-box-options"
            }).text(font_name_list[i])
          );
        }
      }
      return fs_font_name;
    };

    //Initialize the select box for font size
    Font_control.prototype.font_size = function() {
      var fs_font_size = $("<select>", {
        id: "font_size",
        class: "select-box",
        style: "float:right"
      });
      for (var size in font_size_list) {
        if (font_size_list[size] == "14") {
          fs_font_size.append(
            $("<option>", {
              value: font_size_list[size],
              selected: "selected"
            }).text(font_size_list[size])
          );
        } else {
          fs_font_size.append(
            $("<option>", { value: font_size_list[size] }).text(
              font_size_list[size]
            )
          );
        }
      }
      return fs_font_size;
    };

    Font_control.prototype.set_font_name = function(name, def) {
      document.getElementById("notebook").style.fontFamily = name;
      this.remove_style_rule(/font\-family/);
      this.remove_style_rule(/font\-family/);
      this.remove_style_rule(/font\-family/);

      if (def) {
        style_file.insertRule(".CodeMirror span{ font-family: monospace; }", 0);
        style_file.insertRule(
          "div.output_area pre{ font-family: monospace; }",
          1
        );
        style_file.insertRule(
          ".CodeMirror pre span{ font-family: monospace; }",
          2
        );
      } else {
        style_file.insertRule(
          ".CodeMirror span{ font-family:" + name + "; }",
          0
        );
        style_file.insertRule(
          "div.output_area pre{ font-family:" + name + "; }",
          1
        );
        style_file.insertRule(
          ".CodeMirror pre span{ font-family" + name + "; }",
          2
        );
      }
    };

    Font_control.prototype.set_font_size = function(size) {
      document.getElementById("notebook").style.fontSize = size + "px";
      paddingBot = size <= 14 ? 0 : size - 14;
      paddingTop = size <= 14 ? 0 : size - 14;
      this.remove_style_rule(/font\-size/);
      style_file.insertRule(
        ".CodeMirror pre { font-size:" +
          size +
          "px; padding-bottom:" +
          paddingBot +
          "px; padding-top:" +
          paddingTop +
          "px}",
        0
      );
    };

    //Get current font name
    Font_control.prototype.get_font_name = function() {
      return this.fontName;
    };

    //Get current font size
    Font_control.prototype.get_font_size = function() {
      return this.fontSize;
    };

    //Add listener to select box, set the font size and name while value changed
    Font_control.prototype.font_change = function() {
      var that = this;
      $(document).ready(function() {
        $("#font_name").change(function() {
          var selected_font_style = $(this)
            .children("option:selected")
            .val();
          that.set_font_name(selected_font_style, false);
          that.fontName = selected_font_style;
          localStorage.setItem(
            "font_name",
            JSON.stringify(selected_font_style)
          );
        });
        $("#font_size").change(function() {
          var selected_font_size = $(this)
            .children("option:selected")
            .val();
          that.set_font_size(selected_font_size);
          that.fontSize = selected_font_size;
          localStorage.setItem("font_size", JSON.stringify(selected_font_size));
        });
      });
    };

    //Load font size and name from pre-defined style
    Font_control.prototype.load_font_name_change = function(font_name, def) {
      var that = this;
      $(document).ready(function() {
        that.set_font_name(font_name, def);
        that.fontName = font_name;
        $("#font_name")[0].value = font_name;
        if (!def) localStorage.setItem("font_name", JSON.stringify(font_name));
      });
    };

    Font_control.prototype.load_font_size_change = function(font_size, def) {
      var that = this;
      $(document).ready(function() {
        that.set_font_size(font_size);
        that.fontSize = font_size;
        $("#font_size")[0].value = font_size;
        if (!def) localStorage.setItem("font_size", JSON.stringify(font_size));
      });
    };

    //Set default font size and name
    Font_control.prototype.set_default_font_name = function() {
      this.load_font_name_change(
        JSON.parse(localStorage.getItem("default_font")),
        true
      );
    };

    Font_control.prototype.set_default_font_size = function() {
      this.load_font_size_change(
        JSON.parse(localStorage.getItem("default_size")),
        true
      );
    };

    //Remove css rules in custom.css
    Font_control.prototype.remove_style_rule = function(value) {
      for (var j = 0; j < fs_style.length; j++) {
        if (value.test(fs_style[j].cssText)) {
          style_file.deleteRule(j);
        }
      }
    };
  };
  return Font_control;
});
