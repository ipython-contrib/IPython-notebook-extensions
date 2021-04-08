define(["base/js/namespace", "jquery"], function(Jupyter, $) {
  "use strict";
  var fs_style;
  var style_file;

  var Font_spacing = function() {
    // set default, min and max space and height values
    this.max_lh = 70;
    this.min_lh = 10;
    this.max_ls = 10;
    this.min_ls = 0;
    this.default_ls = $(".cell").css("letter-spacing");
    this.default_lh = $(".cell").css("line-height");
  };

  Font_spacing.prototype.initialise_font_spacing = function() {
    var that = this;
    for (var i = 0; i < document.styleSheets.length; i++) {
      if (/.*\/custom\/custom\.css/.test(document.styleSheets[i].href)) {
        style_file = document.styleSheets[i];
        break;
      }
    }
    for (i = 0; i < style_file.cssRules.length; i++) {
      if (/\.cell/.test(style_file.cssRules[i].selectorText)) {
        fs_style = style_file.cssRules[i].style;
        break;
      }
    }
    if (fs_style == null) {
      style_file.insertRule(".cell { letter-spacing: 0; }", 0);
      style_file.insertRule(
        ".cell, .text_cell_render, .CodeMirror-code, .CodeMirror-line { line-height: " +
          that.default_lh +
          "; }",
        1
      );
      fs_style = style_file.cssRules;
      // add event listeners to the the control buttons
      that.reduce_line_height();
      that.increase_line_height();
      that.reduce_letter_space();
      that.increase_letter_space();
    }
  };

  // reduce line height function
  Font_spacing.prototype.reduce_line_height = function() {
    var that = this;
    // add event listener to reduce line height button
    $("#reduce_line_height").click(function() {
      var current_lh = parseInt(
        $(".cell")
          .css("line-height")
          .replace(/[^\d.-]/g, "")
      );
      if (current_lh - 2 < that.min_lh) {
        $(this).attr("disabled", true);
        return false;
      }
      var new_value = current_lh - 2 + "px";
      that.set_line_height(new_value, false);
      localStorage.setItem("line_height", JSON.stringify(new_value));
      if (current_lh - 2 == that.min_lh) {
        $(this).attr("disabled", true);
        return false;
      }
      // disable when min value is reached
      if (
        $("#increase_line_height").is(":disabled") &&
        current_lh - 2 < that.max_lh
      ) {
        $("#increase_line_height").attr("disabled", false);
        return false;
      }
    });
    let lh = localStorage.getItem("line_height")
      ? localStorage.getItem("line_height")
      : localStorage.getItem("default_line_height");
    if (parseInt(JSON.parse(lh).replace(/[^\d.-]/g, "")) - 2 < that.min_lh) {
      $("#reduce_line_height").attr("disabled", true);
    }
  };

  // increase line height function
  Font_spacing.prototype.increase_line_height = function() {
    var that = this;
    // add event listener to increase line height button
    $("#increase_line_height").click(function() {
      var current_lh = parseInt(
        $(".cell")
          .css("line-height")
          .replace(/[^\d.-]/g, "")
      );
      var new_value = current_lh + 2 + "px";
      that.set_line_height(new_value, false);
      localStorage.setItem("line_height", JSON.stringify(new_value));
      // disable button when max value is reached
      if (current_lh + 2 >= that.max_lh) {
        $(this).attr("disabled", true);
        return false;
      }
      if (
        $("#reduce_line_height").is(":disabled") &&
        current_lh + 2 > that.min_lh
      ) {
        $("#reduce_line_height").attr("disabled", false);
        return false;
      }
    });
    let lh = localStorage.getItem("line_height")
      ? localStorage.getItem("line_height")
      : localStorage.getItem("default_line_height");
    if (parseInt(JSON.parse(lh).replace(/[^\d.-]/g, "")) + 2 > that.max_lh) {
      $("#increase_line_height").attr("disabled", true);
    }
  };

  // reduce letter spacing function
  Font_spacing.prototype.reduce_letter_space = function() {
    var that = this;
    // add event listener to reduce letter spacing button
    $("#reduce_letter_space").click(function() {
      var current = parseInt(
        $(".cell")
          .css("letter-spacing")
          .replace(/[^\d.-]/g, "")
      );
      if (current - 2 < that.min_ls) {
        $(this).attr("disabled", true);
        return false;
      }
      var new_value = current - 2 + "px";
      that.set_letter_spacing(new_value, false);
      localStorage.setItem("letter_spacing", JSON.stringify(new_value));
      // disable button if minimum value is reached
      if (current - 2 == that.min_ls) {
        $(this).attr("disabled", true);
        return false;
      }
      if (
        $("#increase_letter_space").is(":disabled") &&
        current - 2 < that.max_ls
      ) {
        $("#increase_letter_space").attr("disabled", false);
        return false;
      }
    });
    let ls = localStorage.getItem("letter_spacing")
      ? localStorage.getItem("letter_spacing")
      : localStorage.getItem("default_letter_spacing");
    if (parseInt(JSON.parse(ls).replace(/[^\d.-]/g, "")) - 2 < that.min_ls) {
      $("#reduce_letter_space").attr("disabled", true);
    }
  };

  // increase letter spacing function
  Font_spacing.prototype.increase_letter_space = function() {
    var that = this;
    // add event listener to increase letter spacing button
    $("#increase_letter_space").click(function() {
      var current = parseInt(
        $(".cell")
          .css("letter-spacing")
          .replace(/[^\d.-]/g, "")
      );
      var new_value = current + 2 + "px";
      that.set_letter_spacing(new_value, false);
      localStorage.setItem("letter_spacing", JSON.stringify(new_value));
      // disable button when max value is reached
      if (current + 2 == that.max_ls) {
        $(this).attr("disabled", true);
        return false;
      }
      if (
        $("#reduce_letter_space").is(":disabled") &&
        current + 2 > that.min_ls
      ) {
        $("#reduce_letter_space").attr("disabled", false);
        return false;
      }
    });
    let ls = localStorage.getItem("letter_spacing")
      ? localStorage.getItem("letter_spacing")
      : localStorage.getItem("default_letter_spacing");
    if (parseInt(JSON.parse(ls).replace(/[^\d.-]/g, "")) + 2 > that.max_ls) {
      $("#increase_letter_space").attr("disabled", true);
    }
  };

  // Set line height function parameters: size and boolean default
  Font_spacing.prototype.set_line_height = function(size, def) {
    // set value in local storage if not default
    if (!def) localStorage.setItem("line_height", JSON.stringify(size));
    // find index of style rule and modify it
    for (var i = 0; i < fs_style.length; i++) {
      if (/line\-height/.test(fs_style[i].cssText)) {
        var index = i;
      }
    }
    style_file.deleteRule(index);
    style_file.insertRule(
      ".cell, .text_cell_render, .CodeMirror-code, .CodeMirror-line, div.output_area pre{ line-height:" +
        size +
        "; }",
      1
    );
  };

  // Set letter spacing function parameters: value and boolean default
  Font_spacing.prototype.set_letter_spacing = function(size, def) {
    // set value in local storage if not default
    if (!def) localStorage.setItem("letter_spacing", JSON.stringify(size));
    // find index of style rule and modify it
    for (var i = 0; i < fs_style.length; i++) {
      if (/letter\-spacing/.test(fs_style[i].cssText)) {
        var index = i;
      }
    }
    style_file.deleteRule(index);
    style_file.insertRule(".cell{ letter-spacing:" + size + "; }", 0);
  };

  // get current line height value
  Font_spacing.prototype.get_line_height = function() {
    return $(".cell").css("line-height");
  };

  // get current letter spacing value
  Font_spacing.prototype.get_letter_spacing = function() {
    return $(".cell").css("letter-spacing");
  };

  // set letter spacing back to default values
  Font_spacing.prototype.set_default_letter_spacing = function() {
    this.set_letter_spacing(
      JSON.parse(localStorage.getItem("default_letter_spacing")),
      true
    );
  };

  // set line height to default values
  Font_spacing.prototype.set_default_line_height = function() {
    this.set_line_height(
      JSON.parse(localStorage.getItem("default_line_height")),
      true
    );
  };
  return Font_spacing;
});
