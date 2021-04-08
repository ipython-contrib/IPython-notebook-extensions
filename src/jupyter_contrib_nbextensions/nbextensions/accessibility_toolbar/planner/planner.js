define([
  "base/js/namespace",
  "jquery",
  "require",
  "base/js/utils",
  "https://unpkg.com/easymde/dist/easymde.min.js"
], function(Jupyter, $, requirejs, utils, EasyMDE) {
  //constructor
  var Planner = function() {
    this.create_planner_folder();
    this.last_saved = this.get_current_time();
  };

  Planner.prototype.initialise_planner = function() {
    // Find the planner button on the toolbar
    var planner_button = $("[title='Planner']").addClass("main-btn");
    var planner_button_div = $("<div/>").addClass("btn-group");

    planner_button_div.appendTo(planner_button.parent());
    planner_button_div.append(planner_button);
    this.open = false;

    // Create a planner div at the side of the page
    this.planner = $("<div id='nbextension-planner'>").addClass("col-md-4");
    const text_area = $("<textarea id='text_area'/>");

    // Ensure that edit mode is enabled when planner is used
    this.planner.click(function() {
      Jupyter.keyboard_manager.edit_mode();
    });

    this.planner.append(text_area);

    $("#notebook")
      .addClass("row")
      .append(this.planner);

    this.planner.hide();
    this.setup_planner_ui();

    // Load the saved contents of the planner for the notebook
    this.load_planner_file($("#notebook_name").text());

    // Find the saved state of the planner
    var planner_state = localStorage.getItem("planner_state");
    if (planner_state != null) {
      if (planner_state === "true") {
        this.toggle_planner();
      }
    }
  };

  Planner.prototype.open_planner = function() {
    this.open = true;
    var site_height = $("#site").height();
    this.planner.css("height", site_height);
    this.planner.show();
    $("#notebook-container").addClass("col-md-8");
    var that = this;

    // Auto-save the planner every minute
    this.timer = setInterval(async function() {
      await that.create_planner_file();
    }, 60 * 1000);

    // Store the time that the planner was opened
    this.last_saved = this.get_current_time();
    this.easymde.codemirror.refresh();
    Jupyter.keyboard_manager.edit_mode();
  };

  Planner.prototype.close_planner = function() {
    this.open = false;
    this.planner.hide();
    $("#notebook-container").removeClass("col-md-8");

    // Stop saving
    clearInterval(this.timer);
    Jupyter.keyboard_manager.command_mode();
  };

  Planner.prototype.toggle_planner = function() {
    this.open ? this.close_planner() : this.open_planner();
    localStorage.setItem("planner_state", this.open);
  };

  Planner.prototype.setup_planner_ui = function() {
    var that = this;
    //Initialise EasyMDE editor
    this.easymde = new EasyMDE({
      autofocus: true,
      element: document.getElementById("text_area"),
      forceSync: true,
      indentWithTabs: false,
      insertTexts: {
        horizontalRule: ["", "\n\n-----\n\n"],
        image: ["!['Image label' imagewidth=planner-50](https://", ")"],
        link: ["[", "](https://)"],
        table: [
          "",
          "\n\n| Column 1 | Column 2 | Column 3 |\n| -------- | -------- | -------- |\n| Text     | Text      | Text     |\n\n"
        ]
      },
      lineWrapping: false,
      parsingConfig: {
        allowAtxHeaderWithoutSpace: true,
        strikethrough: false,
        underscoresBreakWords: true
      },
      placeholder: "Type here...",
      promptURLs: false,
      renderingConfig: {
        singleLineBreaks: false,
        codeSyntaxHighlighting: true
      },
      shortcuts: {
        drawTable: "Cmd-Alt-T"
      },
      showIcons: ["code", "table"],
      spellChecker: true,
      status: false,
      status: ["lines", "words", "cursor"], // Optional usage
      status: [
        {
          className: "lastsaved",
          defaultValue: function(el) {
            el.innerHTML = "last saved at: " + that.last_saved;
          },
          onUpdate: function(el) {
            el.innerHTML = "last saved at: " + that.last_saved;
          }
        },
        "lines",
        "words",
        "cursor"
      ],
      styleSelectedText: false,
      tabSize: 4,
      toolbarTips: true,
      toolbar: [
        {
          name: "save",
          action: async function customFunction() {
            await that.create_planner_file();
            that.last_saved = that.get_current_time();
          },
          className: "fa fa-save",
          title: "Save Button"
        },
        "bold",
        "italic",
        "heading",
        "code",
        "unordered-list",
        "ordered-list",
        "link",
        "image",
        "table",
        "preview",
        "guide",
        {
          name: "close",
          action: async function customFunction() {
            that.toggle_planner();
          },
          className: "fa fa-close",
          title: "close Button"
        }
      ]
    });
    this.easymde.render();
  };

  // Create folder to save planner files in
  Planner.prototype.create_planner_folder = function() {
    var data = JSON.stringify({
      ext: "text",
      type: "directory"
    });

    var url = Jupyter.notebook.contents.api_url("/planner/");

    var settings = {
      processData: false,
      type: "PUT",
      data: data,
      dataType: "json"
    };
    utils.promising_ajax(url, settings);
  };

  // Create planner files to save planner content in
  Planner.prototype.create_planner_file = async function() {
    var data = JSON.stringify({
      ext: "text",
      type: "file",
      content: this.easymde.value(),
      format: "text"
    });

    var url = Jupyter.notebook.contents.api_url(
      "/planner/" + $("#notebook_name").text() + ".planner"
    );

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

  // Retrieve a list of existing planners
  Planner.prototype.get_planner_list = async function() {
    var planners = await Jupyter.notebook.contents
      .list_contents("/planner")
      .catch(function() {
        return [];
      });
    var planner_list = [];
    $.each(planners.content, function(key, value) {
      planner_list.push(value.name.slice(0, -8));
    });
    return planner_list;
  };

  // Load the specified planner file to the page
  Planner.prototype.load_planner_file = async function(planner_name) {
    var planner_list = await this.get_planner_list();
    if (planner_list.includes(planner_name)) {
      var planner = await Jupyter.notebook.contents.get(
        "/planner/" + planner_name + ".planner",
        { type: "file" }
      );
      this.easymde.codemirror.setValue(planner.content);
    } else {
      this.create_planner_file();
    }
  };

  Planner.prototype.get_current_time = function() {
    var time_now = new Date();
    return (
      ("0" + time_now.getHours()).slice(-2) +
      ":" +
      ("0" + time_now.getMinutes()).slice(-2) +
      ":" +
      ("0" + time_now.getSeconds()).slice(-2)
    );
  };

  return Planner;
});
