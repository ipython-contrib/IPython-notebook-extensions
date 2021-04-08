define(["base/js/namespace", "jquery", "base/js/utils"], function(
  Jupyter,
  $,
  utils
) {
  "use strict";

  var selected_style = "";
  var styles_list = [];
  //constructor
  var predefined_styles = function(fc_obj, fsp_obj, cc_obj) {
    this.create_styles_folder();
    this.fc_obj = fc_obj;
    this.fsp_obj = fsp_obj;
    this.cc_obj = cc_obj;
  };

  //create the predefined styles menu
  predefined_styles.prototype.create_menus = async function(dropMenu, fs) {
    var fs_menuitem1 = $("<li/>")
      .attr("role", "none")

      .addClass("menu_focus_highlight dropdown dropdown-submenu")
      .attr("title", "select a predefined style")
      .attr("aria-label", "select a predefined style")
      .attr("id", "predefined_styles");
    var fs_predefined_styles = $("<a/>")
      .text("Predefined styles")
      .attr("tabindex", 0);

    var style_options = $("<ul/>")
      .addClass("dropdown-menu dropdown-menu-style")
      .attr("role", "menu");

    var sub_option1 = this.new_style_creator(fs);

    var sub_option2 = await this.delete_style_creator(fs);

    var sub_option3 = this.default_style_creator(fs);

    style_options.append(sub_option1);
    style_options.append(sub_option2);
    style_options.append(sub_option3);

    await this.create_styles_dropdown(style_options);

    fs_menuitem1.append(fs_predefined_styles);
    fs_menuitem1.append(style_options);

    dropMenu.append(fs_menuitem1);
  };

  //create the modal that allows creation of new styles
  predefined_styles.prototype.new_style_creator = function(fs) {
    var ps_obj = this;

    var sub_option1 = $("<li/>");
    var new_style_button = $("<a/>")
      .attr("id", "new_style_button")
      .text("Add new style...")
      .attr("href", "#")
      .attr("data-toggle", "modal")
      .attr("data-target", "#new_style")
      .attr("data-backdrop", "false")
      .attr("role", "menuitem");
    sub_option1.append(new_style_button);

    new_style_button.click(function() {
      Jupyter.keyboard_manager.edit_mode();
    });

    var new_style_modal = `
                <div id="style_modal" class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title" id="exampleModalLabel">Create a new predefined style</h4>
                </div>
                <div class="modal-body">
                    <form method="post" id="new_style_form">
                        <input id="style_name" type="text" class="form-control input-sm" placeholder="New style name"/>
                        <p id="invalid-char">*The character you entered is not permitted</p>
                        <p id="invalid-name">*The predefined style name you have entered already exists, please try again</p>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button id="save-button" type="submit" class="btn btn-default btn-sm btn-primary"
                        data-dismiss="modal">Save current format settings</button>
                </div>
                </div>
                </div>`;

    // Sanitise input
    $(document).ready(function() {
      $("#invalid-name").addClass("hidden");
      $("#invalid-char").addClass("hidden");
      $("#style_name").keypress(function(key) {
        var valid_chars = /^[\w-_.]*$/;
        if (!valid_chars.test(String.fromCharCode(key.charCode))) {
          $("#invalid-char").removeClass("hidden");
          return false;
        } else {
          $("#invalid-char").addClass("hidden");
          return true;
        }
      });

      // Check if chosen name already exists
      $("#style_name").on("change paste keyup", function() {
        if (styles_list.includes($("#style_name").val())) {
          $("#invalid-name").removeClass("hidden");
          $("#save-button").addClass("disabled");
        } else {
          $("#invalid-name").addClass("hidden");
          $("#save-button").removeClass("disabled");
        }
      });
    });

    // Save the predefined style
    $(document).on("click", "#save-button", async function() {
      var style_name = $("#style_name").val();
      await ps_obj.save_current_styles(style_name);
      localStorage.setItem("selected_style", style_name);
      location.reload();
    });

    var new_style = $("<div>", {
      id: "new_style",
      tabindex: "-1",
      class: "modal fade",
      role: "dialog"
    });
    new_style.append(new_style_modal);

    fs.parent().append(new_style);

    return sub_option1;
  };

  //create the modal that allows deletion of new styles
  predefined_styles.prototype.delete_style_creator = async function(fs) {
    var ps_obj = this;
    var sub_option2 = $("<li/>");
    var edit_style = $("<a/>")
      .text("Delete a style...")
      .attr("id", "delete_style_button")
      .attr("href", "#")
      .attr("data-toggle", "modal")
      .attr("data-target", "#delete_style")
      .attr("data-backdrop", "false")
      .attr("role", "menuitem");
    sub_option2.append(edit_style);

    var delete_style_modal = `
                <div id="delete_style_modal" class="modal-dialog" role="document">
                <div class="modal-content pre-modal">
                <div class="modal-header pre-modal">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                    <h3 class="modal-title" id="exampleModalLabel">Select a predefined style to delete</h3>
                </div>
                <div id='modal_body' class="modal-body" style="text-align:center">
                    <form method="post" id="delete_style_form">
                        <select id="style-list" class="custom-select" multiple>
                        </select>
                    </form>
                </div>
                <div class="modal-footer pre-modal">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal" style="font-size:18px">Cancel</button>
                    <button id="delete-button" type="submit" class="btn btn-default btn-sm btn-primary"
                        data-dismiss="modal" style="font-size:18px">Delete selected style</button>
                </div>
                </div>
                </div>`;

    var delete_style = $("<div>", {
      id: "delete_style",
      tabindex: "-1",
      class: "modal fade",
      role: "dialog"
    });

    var select = $("<select multiple/>").addClass("custom-select");

    var style_list = await this.get_style_list();

    //Create the list of styles
    $(document).ready(function() {
      $.each(style_list, function(key, value) {
        var style = $("<option></option>")
          .text(value)
          .attr("value", value);
        $("#style-list").append(style);
      });
    });

    // Adds the ability to delete multiple styles
    $(document).on("click", "#delete-button", async function() {
      var selected = $("#style-list option:selected");
      for (var i = 0; i < selected.length; i++) {
        await ps_obj.delete_style(selected[i].text);
      }
      location.reload();
      Jupyter.keyboard_manager.command_mode();
    });

    $(".modal-body #modal_body").append(select);

    delete_style.append(delete_style_modal);
    fs.parent().append(delete_style);

    return sub_option2;
  };

  // reset styles to default values
  predefined_styles.prototype.default_style_creator = function(fs) {
    var that = this;
    var sub_option3 = $("<li/>");

    var default_style = $("<a/>")
      .attr("id", "default_style")
      .text("Default style")
      .addClass("dropdown-item")
      .attr("href", "#")
      .attr("data-toggle", "modal")
      .attr("data-target", "#reset_style")
      .attr("data-backdrop", "false")
      .attr("role", "menuitem");
    selected_style = default_style;

    sub_option3.append(default_style);

    var default_style_modal = `
                <div id="style_modal" class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title" id="exampleModalLabel">Are you sure you want to reset the styles? </h4>
                </div>
               <div class="modal-body">
                    <p>Are you sure you want to reset styles to default? If not saved as predefined styles all style 
                    changes will be lost</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button id="reset_style_button" type="submit" class="btn btn-default btn-sm btn-primary"
                        data-dismiss="modal">Reset styles</button>
                </div>
                </div>
                </div>`;

    var reset_style = $("<div>", {
      id: "reset_style",
      tabindex: "-1",
      class: "modal fade",
      role: "dialog"
    });
    reset_style.append(default_style_modal);

    fs.parent().append(reset_style);

    $("#reset_style_button").click(async function(event) {
      event.preventDefault();
      selected_style.removeClass("dropdown-item-checked");
      selected_style = default_style;
      localStorage.setItem("selected_style", selected_style.text());
      that.reset_stored_values();
      location.reload();
    });
    return sub_option3;
  };

  //create the dropdown list of predefined styles
  predefined_styles.prototype.create_styles_dropdown = async function(
    style_options
  ) {
    var ps_obj = this;
    styles_list = await this.get_style_list();
    var set_style = localStorage.getItem("selected_style");
    $.each(styles_list, function(key, value) {
      var style_option = $("<li/>");
      var style = $("<a/>")
        .addClass("dropdown-item")
        .text(value)
        .attr("href", "#")
        .attr("role", "menuitem");

      if (set_style != null && set_style !== "Default style") {
        if (style.text() === set_style) {
          selected_style.removeClass("dropdown-item-checked");
          selected_style = style;
          style.addClass("dropdown-item-checked");
        }
      } else {
        selected_style = $("#default_style");
        selected_style.addClass("dropdown-item-checked");
      }
      style_option.append(style);
      style_options.append(style_option);

      // Add a tick to the selected styles
      style.click(async function(event) {
        await ps_obj.set_style_values(value);
        event.preventDefault();
        selected_style.removeClass("dropdown-item-checked");
        selected_style = style;
        localStorage.setItem("selected_style", selected_style.text());
        $(this).addClass("dropdown-item-checked");
      });
    });
  };

  //Create folder to store predefined style values
  predefined_styles.prototype.create_styles_folder = function() {
    var data = JSON.stringify({
      ext: "text",
      type: "directory"
    });

    var url = Jupyter.notebook.contents.api_url("/styles/");

    var settings = {
      processData: false,
      type: "PUT",
      data: data,
      dataType: "json"
    };
    utils.promising_ajax(url, settings);
  };

  //Create a json file to store style values
  predefined_styles.prototype.create_style_file = async function(
    style_name,
    style_data
  ) {
    var data = JSON.stringify({
      ext: "text",
      type: "file",
      content: JSON.stringify(style_data),
      format: "text"
    });

    var url = Jupyter.notebook.contents.api_url("/styles/" + style_name);

    var settings = {
      processData: false,
      type: "PUT",
      data: data,
      contentType: "application/json",
      format: "text",
      dataType: "json"
    };
    utils.promising_ajax(url, settings);
  };

  //Get list of saved predefined styles
  predefined_styles.prototype.get_style_list = async function() {
    var styles = await Jupyter.notebook.contents
      .list_contents("/styles")
      .catch(function() {
        return [];
      });

    var style_list = [];
    $.each(styles.content, function(key, value) {
      if (value.name.substr(value.name.length - 5) === ".json") {
        style_list.push(value.name.slice(0, -5));
      }
    });

    return style_list.sort();
  };

  //Set the styles based on the specified predefined style
  predefined_styles.prototype.set_style_values = async function(style_name) {
    var styles = await Jupyter.notebook.contents.get(
      "/styles/" + style_name + ".json",
      { type: "file" }
    );

    var font_name = JSON.parse(styles.content).font_name;
    var font_size = JSON.parse(styles.content).font_size;
    this.fc_obj.load_font_name_change(font_name);
    this.fc_obj.load_font_size_change(font_size);

    var font_color = JSON.parse(styles.content).font_color;
    var background_color = JSON.parse(styles.content).background_color;
    var page_color = JSON.parse(styles.content).page_color;
    var input_color = JSON.parse(styles.content).background_input_color;
    this.cc_obj.set_font_color(font_color, false);
    this.cc_obj.set_background_color(background_color, false);
    this.cc_obj.set_page_color(page_color, false);
    this.cc_obj.set_background_input_color(input_color, false);

    var line_height = JSON.parse(styles.content).line_height;
    this.fsp_obj.set_line_height(line_height);

    var letter_spacing = JSON.parse(styles.content).letter_spacing;
    this.fsp_obj.set_letter_spacing(letter_spacing);
  };

  //Save the current styles as a predefined style
  predefined_styles.prototype.save_current_styles = async function(style_name) {
    var style_data = {
      style_name: style_name,
      font_color: this.cc_obj.get_font_color(),
      font_name: this.fc_obj.get_font_name(),
      font_size: this.fc_obj.get_font_size(),
      background_color: this.cc_obj.get_background_color(),
      background_input_color: this.cc_obj.get_input_background_color(),
      page_color: this.cc_obj.get_page_color(),
      line_height: this.fsp_obj.get_line_height(),
      letter_spacing: this.fsp_obj.get_letter_spacing()
    };
    await this.create_style_file(style_name + ".json", style_data);
  };

  //Delete the selected style
  predefined_styles.prototype.delete_style = async function(style_name) {
    await Jupyter.notebook.contents.delete("/styles/" + style_name + ".json");
  };

  // Reset the stored style values in localStorage
  predefined_styles.prototype.reset_stored_values = function() {
    localStorage.removeItem("background_color");
    localStorage.removeItem("background_input_color");
    localStorage.removeItem("font_color");
    localStorage.removeItem("font_name");
    localStorage.removeItem("font_size");
    localStorage.removeItem("letter_spacing");
    localStorage.removeItem("line_height");
    localStorage.removeItem("page_color");
  };

  return predefined_styles;
});
