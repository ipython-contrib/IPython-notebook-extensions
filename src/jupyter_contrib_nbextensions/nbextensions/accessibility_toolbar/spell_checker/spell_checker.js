define([
  "base/js/namespace",
  "jquery",
  "codemirror/lib/codemirror",
  "./spc_function"
], function(Jupyter, $, Codemirror, Spc) {
  "use strict";

  var spell_checker = function() {
    var spc_flag =
      localStorage.getItem("spcflag") == null
        ? false
        : localStorage.getItem("spcflag");

    spell_checker.prototype.spc_initial = function() {
      //get spell check button on the page
      var spc = $("[title='Spell Checker']");
      var spcdiv = $("<div>", { display: "inline", class: "btn-group" });
      spc.parent().append(spcdiv);
      spcdiv.append(spc);
      spc.addClass("dropdown-toggle main-btn");
      spc.attr("data-toggle", "dropdown");
      spc.attr("id", "spc");
      this.spc_dropdown_initial(spc);
    };

    spell_checker.prototype.spc_dropdown_initial = function(spc) {
      //Create the dropdown menu
      var dropMenu = $("<ul>", {
        class: "dropdown-menu dropdown-menu-style",
        id: "spc_dropdown"
      });

      //List Item 1: Toggle Switch
      var spc_menuitem1 = $("<li>", {
        id: "lispcswitch",
        class: "switch text-center focus"
      }).text("OFF\xa0\xa0");
      var spc_switch = $("<input>", {
        id: "spc_switch",
        type: "checkbox",
        "data-toggle": "toggle",
        "data-style": "ios",
        "data-onstyle": "warning",
        "data-offstyle": "default",
        "data-width": "58",
        "data-on": " ",
        "data-off": " ",
        tabindex: "0"
      });

      var offText = $("<p>", { style: "display:inline" }).text("\xa0\xa0ON");
      spc_menuitem1.append(spc_switch);
      spc_menuitem1.append(offText);
      dropMenu.append(spc_menuitem1);
      $(document).on("click", "#spc", function(e) {
        e.stopPropagation();
      });
      $(document).on("click", "#spc_dropdown", function(e) {
        e.stopPropagation();
      });

      //List Item 2: Pop-up spell checker dialog button and the pop-up menu
      const m2_template = `<hr><a class='spc-dialog-btn' id='dlg_btn' data-toggle='modal' data-target='#popup_dlg' data-backdrop='false'>Open spell-checker</a>`;
      var spc_menuitem2 = $("<li>", { class: "text-center spc-btn-li" });
      var dlg_template = `
                <div class="modal-dialog modal-xl" role="document" id="spc_main_body">
                <div class="modal-content">
                <div class="modal-header spc-modal">
                    <h3 class="modal-title spc-font" id="exampleModalLabel">Spell Checker</h3>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body spc-modal">
                <form><fieldset>
                    <h3 class="spc-font">Enter or Paste your text below</h3>
                    <div id="textarea1" class="text-input-area"></div>
                    </fieldset></form>
                    <button id="check-btn" class="spc_btn" style="transform:translateY(5px)">Check</button>
                    <h3 class="spc-font">Suggestions</h5>
                    <select id="suggestions" class="suggestions" size="5"></select>
                    <br>
                    <button id="apply-btn" class="spc_btn">Apply Selected word</button>
                    <hr>
                    <h3 class="spc-font">Add new word to dictionary</h3>
                    <input id="new_word" type="text" class="new_word">
                    <button id="add-new-btn" class="spc_btn">Add new word to dictionary</button>
                </div>
                <div class="modal-footer spc-modal">
                <button type="button" class="spc_btn" data-dismiss="modal">Close</button>
                </div>
                </div></div>`;
      spc_menuitem2.append(m2_template);
      var popup_dlg = $("<div>", {
        id: "popup_dlg",
        class: "modal",
        role: "dialog"
      });
      popup_dlg.append(dlg_template);
      var nb_panel = $("#notebook_panel");
      nb_panel.append(popup_dlg);
      spc.parent().append(dropMenu);

      //create codemirror cell
      var editor = Codemirror(document.getElementById("textarea1"));
      editor.setSize("100%", "100%");
      $("#textarea1").click(function() {
        Jupyter.notebook.keyboard_manager.edit_mode();
      });
      $("#new_word").click(function() {
        Jupyter.notebook.keyboard_manager.edit_mode();
      });

      //add new word
      var add_input = $("#new_word");
      $("#add-new-btn").click(function() {
        spc.add_word(add_input.val());
        spc.refresh();
      });

      //get text cell in checker and define spc_function object
      var cell_list = document.querySelectorAll(".CodeMirror");
      var checker_cell = cell_list[cell_list.length - 1];
      var spc = new Spc(checker_cell);
      spc.define_mode();

      //check the text in the box
      $("#check-btn").click(function() {
        spc.default();
        checker_cell.CodeMirror.setOption("mode", "spc");
        spc.get_suggestions();
      });

      //apply selected word
      $("#apply-btn").click(function() {
        spc.apply();
      });

      //List Item 3: Toggle Switch for styling
      var space = $("<hr>");
      var spc_menuitem3 = $("<li>", {
        id: "listyle",
        class: "switch text-center focus"
      }).text("Bold\xa0\xa0");
      var spc_style_switch = $("<input>", {
        id: "spc_style_switch",
        type: "checkbox",
        "data-toggle": "toggle",
        "data-style": "ios",
        "data-onstyle": "warning",
        "data-offstyle": "warning",
        "data-width": "58",
        "data-on": " ",
        "data-off": " ",
        tabindex: "0"
      });
      var offText2 = $("<p>", { style: "display:inline" }).text("\xa0\xa0Line");
      spc_menuitem3.append(spc_style_switch);
      spc_menuitem3.append(offText2);
      dropMenu.append(space);
      dropMenu.append(spc_menuitem3);
      var bold = true;
      spc_style_switch.on("change", function() {
        bold = bold == true ? false : true;
        spc.change_style(bold, spc_flag);
      });

      //toggle switch controller
      var styletoggle;
      if (localStorage.getItem("spcflag") == "true") {
        spc_switch.trigger("click");
        spc.toggle();
        $("#spc").addClass("spc-on");
        $("#listyle").removeClass("disabled");
        styletoggle = true;
      } else {
        $("#listyle").addClass("disabled");
        styletoggle = false;
      }
      spc_switch.on("change", function() {
        spc_flag = spc_flag ? false : true;
        if (!spc_flag) {
          localStorage.setItem("spcflag", false);
          $("#spc").removeClass("spc-on");
          spc.toggle();
        } else {
          localStorage.setItem("spcflag", true);
          $("#spc").addClass("spc-on");
          spc.toggle();
        }

        if (styletoggle) {
          $("#listyle").addClass("disabled");
          styletoggle = false;
        } else {
          $("#listyle").removeClass("disabled");
          styletoggle = true;
        }
      });
      dropMenu.append(spc_menuitem2);
    };
  };
  return spell_checker;
});
