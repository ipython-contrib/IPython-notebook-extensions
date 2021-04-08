define([
  "base/js/namespace",
  "jquery",
  "./font_control",
  "./font_spacing",
  "./color_control",
  "./predefined_styles"
], function(
  Jupyter,
  $,
  Font_control,
  Font_spacing,
  Color_control,
  Predefined_styles
) {
  "use strict";

  // Font style manage class
  var font_style = function() {
    var fs_flag = false;
    var fc_obj = new Font_control();
    var fsp_obj = new Font_spacing();
    var cc_obj = new Color_control();
    var ps_obj = new Predefined_styles(fc_obj, fsp_obj, cc_obj);

    font_style.prototype.fs_initial = function() {
      //find Customise font button on the page
      var fs = $('button[title="Customise font"]');
      fs.addClass("dropdown-toggle main-btn");
      fs.attr("data-toggle", "dropdown");
      fs.attr("id", "fs");
      var fsdiv = $("<div>", { style: "display:inline", class: "btn-group" });
      fs.parent().append(fsdiv);
      fsdiv.append(fs);
      this.fs_dropdown_initial(fs);
    };

    font_style.prototype.fs_dropdown_initial = async function(fs) {
      var that = this;

      //Create the dropdown menu
      var dropMenu = $("<ul/>")
        .addClass("dropdown-menu dropdown-menu-style")
        .attr("id", "fs_dropdown");
      fs.parent().append(dropMenu);
      $(document).on("click", "#fs", function(e) {
        e.stopPropagation();
      });
      $(document).on("click", "#fs_dropdown", function(e) {
        e.stopPropagation();
      });
      //Create the contents of dropdown menu
      //Predefined style
      await ps_obj.create_menus(dropMenu, fs);

      //font color
      var font_color = $("<li/>").attr("id", "font_color");
      var colorpicker2 = $("<a/>")
        .attr("href", "#")
        .addClass("font-select-box")
        .attr("id", "color-picker")
        .text("Text font color")
        .attr("data-toggle", "dropdown")
        .attr("aria-haspopup", "true")
        .attr("aria-label", "font color");
      var fs_font_color = cc_obj.font_color();
      font_color.append(fs_font_color);
      font_color.append(colorpicker2);
      dropMenu.append(font_color);

      //cell Background color
      var background_color = $("<li/>").attr("id", "cell_back_color");
      var colorpicker1 = $("<a/>")
        .attr("href", "#")
        .addClass("font-select-box")
        .attr("id", "color-picker-background")
        .text(" Cell background color")
        .attr("data-toggle", "dropdown")
        .attr("aria-haspopup", "true")
        .attr("aria-label", "text background color")
        .attr("data-toggle", "dropdown")
        .attr("aria-haspopup", "true");

      var fs_background_color = cc_obj.background_color();
      background_color.append(colorpicker1);
      background_color.append(fs_background_color);
      dropMenu.append(background_color);

      //page Background color
      var page_background_color = $("<li/>").attr("id", "page_back_color");
      var colorpicker3 = $("<a/>")
        .attr("href", "#")
        .addClass("font-select-box")
        .attr("id", "color-picker-page-background")
        .text("Page background color")
        .attr("data-toggle", "dropdown")
        .attr("aria-haspopup", "true")
        .attr("aria-label", "page background color")
        .attr("data-toggle", "dropdown")
        .attr("aria-haspopup", "true");
      var fs_page_background_color = cc_obj.page_background_color();
      page_background_color.append(colorpicker3);
      page_background_color.append(fs_page_background_color);
      dropMenu.append(page_background_color);

      //Font name
      var font_name = $("<li/>")
        .attr("id", "f_name")
        .addClass("font-select-box")
        .text("Font name")
        .attr("title", "select a font style");
      var fs_font_name = fc_obj.font_name();
      font_name.append(fs_font_name);
      dropMenu.append(font_name);

      //Font size
      var font_size = $("<li/>")
        .attr("id", "f_size")
        .addClass("font-select-box")
        .text("Font size")
        .attr("title", "select a font size");
      var fs_font_size = fc_obj.font_size();
      fc_obj.font_change();
      font_size.append(fs_font_size);
      dropMenu.append(font_size);

      //Line height
      var line_height = $("<li/>")
        .attr("id", "height_elem")
        .text("Line height");
      var zoom_div = `
                <div class="zoom btn-group" id="line_height_buttons" style="float:right">
                    <button class="btn icon-button" id="reduce_line_height" title="Reduce line height">
                    <i class="fa fa-minus"></i></button>
                    <button class="btn icon-button" id="increase_line_height" title="Increase line height">
                    <i class="fa fa-plus"></i></button>
                </div>`;
      line_height.append(zoom_div);
      dropMenu.append(line_height);

      //Letter spacing
      var letter_spacing = $("<li/>")
        .attr("id", "space_elem")
        .text("Letter Spacing");
      var zoom_div = `
                <div class="zoom btn-group" id="letter_space_buttons" style="float:right">
                    <button class="btn icon-button" id="reduce_letter_space" title="Reduce letter spacing">
                    <i class="fa fa-minus"></i></button>
                    <button class="btn icon-button" id="increase_letter_space" title="Increase letter spacing">
                    <i class="fa fa-plus"></i></button>
                </div>
            </div>`;
      letter_spacing.append(zoom_div);
      dropMenu.append(letter_spacing);

      //Toggle button
      dropMenu.append(this.create_toggle_button());

      // Store default values for future use
      this.save_default_values();

      fsp_obj.initialise_font_spacing();

      // Set the previously used styles from localStorage
      this.set_saved_style();
    };

    // Create the styles toggle button
    font_style.prototype.create_toggle_button = function() {
      var that = this;

      var toggle_switch = $("<li/>")
        .attr("id", "switch")
        .addClass("switch text-center")
        .text("OFF\xa0\xa0");
      var fs_switch = $("<input/>", {
        type: "checkbox",
        id: "fs_switch",
        "data-toggle": "toggle",
        "data-style": "ios",
        "data-onstyle": "warning",
        "data-offstyle": "default",
        "data-width": "58",
        "data-on": " ",
        "data-off": " "
      });
      var offText = $("<p>", { style: "display:inline" }).text("\xa0\xa0ON");
      this.disable_options();

      // Save/reload previous state of toggle
      $(document).ready(function() {
        var toggle_status = localStorage.getItem("toggle");
        if (toggle_status != null) {
          if (toggle_status == "true") {
            $("#fs_switch").trigger("click");
          } else {
            that.disable_options();
            that.set_default_styles();
          }
        }
      });

      fs_switch.on("change", function() {
        fs_flag = fs_flag ? false : true;
        if (!fs_flag) {
          that.disable_options();
          that.set_default_styles();
        } else {
          that.enable_options();
          that.set_saved_style();
        }
        localStorage.setItem("toggle", fs_flag);
      });

      toggle_switch.append(fs_switch);
      toggle_switch.append(offText);

      return toggle_switch;
    };

    //disable dropdown options
    font_style.prototype.disable_options = function() {
      var buttons = [
        "#predefined_styles",
        "#font_color",
        "#f_name",
        "#f_size",
        "#back_color",
        "#height_elem",
        "#space_elem",
        "#page_back_color",
        "#cell_back_color"
      ];
      $.each(buttons, function(key, value) {
        $(value).addClass("disabled");
      });
    };

    //enable dropdown options
    font_style.prototype.enable_options = function() {
      var buttons = [
        "#predefined_styles",
        "#font_color",
        "#f_name",
        "#f_size",
        "#back_color",
        "#height_elem",
        "#space_elem",
        "#page_back_color",
        "#cell_back_color"
      ];
      $.each(buttons, function(key, value) {
        $(value).removeClass("disabled");
      });
    };

    font_style.prototype.set_default_styles = function() {
      fc_obj.set_default_font_size();
      fc_obj.set_default_font_name();
      fsp_obj.set_default_letter_spacing();
      fsp_obj.set_default_line_height();
      cc_obj.set_background_color(cc_obj.background_color_reset(), true);
      cc_obj.set_background_input_color(
        cc_obj.input_background_color_reset(),
        true
      );
      cc_obj.set_font_color(cc_obj.font_color_reset(), true);
      cc_obj.set_page_color(cc_obj.page_color_reset(), true);
    };

    // Set the styles to those saved in localStorage
    font_style.prototype.set_saved_style = function() {
      var saved_line_height = localStorage.getItem("line_height");
      var saved_letter_space = localStorage.getItem("letter_spacing");
      var saved_font_size = localStorage.getItem("font_size");
      var saved_font_name = localStorage.getItem("font_name");
      var saved_background_color = localStorage.getItem("background_color");
      var saved_background_input_color = localStorage.getItem(
        "background_input_color"
      );
      var saved_font_color = localStorage.getItem("font_color");
      var saved_page_color = localStorage.getItem("page_color");

      saved_font_name != null
        ? fc_obj.load_font_name_change(JSON.parse(saved_font_name), false)
        : fc_obj.set_default_font_name();
      saved_font_size != null
        ? fc_obj.load_font_size_change(JSON.parse(saved_font_size), false)
        : fc_obj.set_default_font_size();

      saved_line_height != null
        ? fsp_obj.set_line_height(JSON.parse(saved_line_height), false)
        : fsp_obj.set_default_line_height();

      saved_letter_space != null
        ? fsp_obj.set_letter_spacing(JSON.parse(saved_letter_space), false)
        : fsp_obj.set_default_letter_spacing();

      saved_background_color != null
        ? cc_obj.set_background_color(JSON.parse(saved_background_color))
        : cc_obj.background_color_reset();
      saved_background_input_color != null
        ? cc_obj.set_background_input_color(
            JSON.parse(saved_background_input_color)
          )
        : cc_obj.input_background_color_reset();
      saved_font_color != null
        ? cc_obj.set_font_color(JSON.parse(saved_font_color))
        : cc_obj.font_color_reset();
      saved_page_color != null
        ? cc_obj.set_page_color(JSON.parse(saved_page_color))
        : cc_obj.page_color_reset();
    };

    font_style.prototype.save_default_values = function() {
      localStorage.setItem(
        "default_font",
        JSON.stringify($(".cell").css("font-family"))
      );
      localStorage.setItem(
        "default_size",
        JSON.stringify(
          $(".CodeMirror pre")
            .css("font-size")
            .slice(0, -2)
        )
      );
      localStorage.setItem(
        "default_letter_spacing",
        JSON.stringify($(".cell").css("letter-spacing"))
      );
      localStorage.setItem(
        "default_line_height",
        JSON.stringify($(".cell").css("line-height"))
      );
      localStorage.setItem(
        "default_background_color",
        JSON.stringify(cc_obj.background_color_reset())
      );
      localStorage.setItem(
        "default_background_input_color",
        JSON.stringify(cc_obj.input_background_color_reset())
      );
      localStorage.setItem(
        "default_font_color",
        JSON.stringify(cc_obj.font_color_reset())
      );
      localStorage.setItem(
        "default_page_color",
        JSON.stringify(cc_obj.page_color_reset())
      );
    };
  };
  return font_style;
});
