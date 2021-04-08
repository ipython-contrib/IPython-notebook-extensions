define([
  "base/js/namespace",
  "jquery",
  "https://cdnjs.cloudflare.com/ajax/libs/annyang/2.6.0/annyang.min.js"
], function(Jupyter, $, annyang) {
  "use strict";

  var Voice_control = function() {
    Voice_control.prototype.setup_voice_control = function() {
      // Create the dropdown menu
      this.create_menu();

      if (annyang) {
        // Setup the predefined commands
        let commands = {
          "view commands": function() {
            $("#view_commands").click();
          },
          "hide planner": function() {
            if ($("#nbextension-planner").css("display") !== "none") {
              $('button[title="Planner"]').click();
            }
          },
          "show planner": function() {
            if ($("#nbextension-planner").css("display") === "none") {
              $('button[title="Planner"]').click();
            }
          },
          "Dark Mode": function() {
            $("#highToggle")
              .prop("checked", false)
              .trigger("change");
            $("#darkToggle")
              .prop("checked", true)
              .trigger("change");
          },
          "High Contrast Mode": function() {
            $("#darkToggle")
              .prop("checked", false)
              .trigger("change");
            $("#highToggle")
              .prop("checked", true)
              .trigger("change");
          },
          "Default Mode": function() {
            $("#darkToggle")
              .prop("checked", false)
              .trigger("change");
            $("#highToggle")
              .prop("checked", false)
              .trigger("change");
          },
          "spell checker on": function() {
            if (!$("#spc_switch").prop("checked")) {
              $("#spc_switch")
                .prop("checked", true)
                .trigger("click");
            }
          },
          "spell checker off": function() {
            if ($("#spc_switch").prop("checked")) {
              $("#spc_switch")
                .prop("checked", false)
                .trigger("click");
            }
          },
          run: function() {
            Jupyter.notebook.execute_cell();
          },
          "run all": function() {
            Jupyter.notebook.execute_all_cells();
          },
          "restart kernel": function() {
            Jupyter.notebook.kernel.restart();
          },
          "shutdown kernel": function() {
            Jupyter.notebook.shutdown_kernel();
          },
          "stop voice control": function() {
            $("#voice_toggle")
              .prop("checked", false)
              .trigger("change");
          }
        };
        annyang.addCommands(commands);
      } else {
        // Adds case where voice control not supported
        $("#vc_menu")
          .prop("disabled", true)
          .attr(
            "title",
            "Voice Control Disabled - This feature is only available in Google Chrome"
          );
      }

      // Keep track of toggle changes
      $("#voice_toggle").change(function(e) {
        if ($(this).prop("checked")) {
          annyang.start();
          $("#vc_menu").addClass("voice-control-on");
        } else {
          annyang.abort();
          $("#vc_menu").removeClass("voice-control-on");
        }
      });
      $(document).on("click", "#vc_menu", function(e) {
        e.stopPropagation();
      });
      $(document).on("click", "#vc_dropdown", function(e) {
        e.stopPropagation();
      });
    };

    Voice_control.prototype.create_menu = function() {
      var div = $("<div/>").addClass("btn-group");

      var node = $('button[title="Voice Control"]')
        .addClass("dropdown-toggle main-btn")
        .attr("data-toggle", "dropdown")
        .attr("id", "vc_menu")
        .attr("aria-haspopup", "true")
        .attr("aria-controls", "vc_dropdown");

      div.appendTo(node.parent());
      node.appendTo(div);
      this.popup = $("<ul/>")
        .addClass("dropdown-menu dropdown-menu-style")
        .attr("id", "vc_dropdown")
        .attr("role", "menu")
        .attr("aria-labelledby", "vc_menu")
        .appendTo(node.parent());

      var button_li = $("<li/>")
        .attr("role", "none")
        .appendTo(this.popup);

      $("<a/>")
        .attr("href", "#")
        .attr("data-toggle", "modal")
        .attr("data-target", "#view_commands_div")
        .attr("data-backdrop", "false")
        .attr("id", "view_commands")
        .text("View commands")
        .attr("role", "menuitem")
        .appendTo(button_li);

      // Create view commands modal to display available commands
      let view_commands = $("<div>", {
        id: "view_commands_div",
        tabindex: "-1",
        class: "modal fade",
        role: "dialog"
      });

      let view_commands_modal = `
                <div id="view_commands_modal" class="modal-dialog" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                    </button>
                    <h4 class="modal-title">View all voice control commands</h4>
                </div>
                <div class="modal-body">
                  <div class="table-wrapper-scroll-y voice-scrollbar">
                    <table class="table table-bordered">
                      <thead>
                        <tr>
                          <th>Command Phrase</th>
                          <th>Action</th> 
                        </tr>                      
                      </thead>
                      <tbody>
                        <tr>
                          <td>Run</td>
                          <td>Run Selected Cell</td> 
                        </tr>
                        <tr>
                          <td>Run all</td>
                          <td>Run all Cells</td> 
                        </tr>
                        <tr>
                          <td>Restart Kernel</td>
                          <td>Restart the Kernel</td> 
                        </tr>
                        <tr>
                          <td>Shutdown Kernel</td>
                          <td>Shutdown the kernel</td> 
                        </tr>  
                        <tr>
                          <td>Spell Checker on</td>
                          <td>Turns on the spell checking feature of the accessibility toolbar</td> 
                        </tr>                           
                        <tr>
                          <td>Spell Checker off</td>
                          <td>Turns off the spell checking feature of the accessibility toolbar</td> 
                        </tr>                        
                        <tr>
                          <td>View Commands</td>
                          <td>Show the table of available commands</td> 
                        </tr>
                        <tr>
                          <td>Stop Voice control</td>
                          <td>Turns off the voice control feature of the accessibility toolbar</td> 
                        </tr>                           
                        <tr>
                          <td>Show Planner</td>
                          <td>Opens the planner provided by the accessibility toolbar</td> 
                        </tr>
                        <tr>
                          <td>Hide Planner</td>
                          <td>Minimises the planner provided by the accessibility toolbar</td> 
                        </tr>                        
                        <tr>
                          <td>Dark Mode</td>
                          <td>Activates the dark theme  provided by the accessibility toolbar</td> 
                        </tr> 
                        <tr>
                          <td>High Contrast Mode</td>
                          <td>Activates the high contrast theme provided by the accessibility toolbar</td> 
                        </tr>  
                        <tr>
                          <td>Default Mode</td>
                          <td>Reverts the notebook to the default theme</td> 
                        </tr>                                                                                        
                      </tbody>                                                                                             
                    </table>
                  </div>
                </div>
                </div>
                </div>`;

      view_commands.append(view_commands_modal);
      div.append(view_commands);
      var voice_toggle = $("<li/>")
        .addClass("text-center switch")
        .attr("id", "voice_toggle_switch")
        .attr("role", "none")
        .text("OFF\xa0\xa0")
        .appendTo(this.popup);

      var input_sw = $("<input/>")
        .attr("role", "menuitem")
        .attr("id", "voice_toggle")
        .attr("title", "Voice control switch")
        .attr("type", "checkbox")
        .attr("data-toggle", "toggle")
        .attr("data-style", "ios")
        .attr("data-onstyle", "warning")
        .attr("data-width", "58")
        .attr("data-on", " ")
        .attr("data-off", " ")
        .appendTo(voice_toggle);
      var offText = $("<p>", { style: "display:inline" }).text("\xa0\xa0ON");
      voice_toggle.append(offText);
    };
  };
  return Voice_control;
});
