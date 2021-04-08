define(["base/js/namespace", "jquery"], function(Jupyter, $) {
  "use strict";

  var Themes = function() {};

  //create the dropdown menu for themes
  Themes.prototype.createThemeMenu = function() {
    // Get the themes button from the toolbar
    var themeButton = $("[title='Custom themes']");
    var themediv = $("<div>", { style: "display:inline", class: "btn-group" });
    themeButton.parent().append(themediv);
    themediv.append(themeButton);

    themeButton
      .addClass("dropdown-toggle main-btn")
      .attr("data-toggle", "dropdown")
      .attr("id", "theme");

    var dropDownMenu = $("<ul/>").addClass("dropdown-menu dropdown-menu-style");
    dropDownMenu.attr("id", "theme_dropdown");

    // Create the default mode option
    var theme_option1 = $("<li/>");
    var default_mode = $("<a/>")
      .attr("id", "default-mode")
      .addClass("dropdown-item")
      .text("Default Theme")
      .attr("href", "#")
      .attr("role", "menuitem");

    theme_option1.append(default_mode);
    dropDownMenu.append(theme_option1);

    // Create the dark mode option
    var theme_option2 = $("<li/>");
    var dark_mode = $("<a/>")
      .attr("id", "dark-mode")
      .addClass("dropdown-item")
      .text("Dark Mode")
      .attr("href", "#")
      .attr("role", "menuitem");

    theme_option2.append(dark_mode);
    dropDownMenu.append(theme_option2);

    // Create the high contrast mode option
    var theme_option3 = $("<li/>");
    var high_contrast_mode = $("<a/>")
      .attr("id", "contrast-mode")
      .addClass("dropdown-item")
      .text("High Contrast")
      .attr("href", "#")
      .attr("role", "menuitem");

    theme_option3.append(high_contrast_mode);
    dropDownMenu.append(theme_option3);

    themeButton.parent().append(dropDownMenu);

    $(document).on("click", "#theme", function(e) {
      e.stopPropagation();
    });
    $(document).on("click", "#theme_dropdown", function(e) {
      e.stopPropagation();
    });

    // Ensure that a theme has been set in localStorage
    if (localStorage.getItem("theme") == null)
      localStorage.setItem("theme", "default");

    this.theme_change();
  };

  Themes.prototype.theme_change = function() {
    var that = this;
    $(document).ready(function() {
      // Retrieve the current theme
      const currentTheme = localStorage.getItem("theme")
        ? localStorage.getItem("theme")
        : null;

      var on = localStorage.getItem("toggle");

      if (currentTheme) {
        document.documentElement.setAttribute("data-theme", currentTheme);
        switch (currentTheme) {
          case "dark":
            $("#dark-mode").click();
            $("#dark-mode").addClass("dropdown-item-checked");
            break;
          case "contrast":
            $("#contrast-mode").click();
            $("#contrast-mode").addClass("dropdown-item-checked");
            break;
          default:
            document.documentElement.setAttribute("data-theme", "default");
            localStorage.setItem("theme", "default");
            $("#default-mode").addClass("dropdown-item-checked");
        }
      }

      $("#default-mode").click(function() {
        document.documentElement.setAttribute("data-theme", "default");
        localStorage.setItem("theme", "default");
        // Check state of font styles
        if (on === "true") {
          $("#fs_switch")
            .prop("checked", true)
            .trigger("click");
        }
        $("#switch").removeClass("disabled");
        that.clear_ticks();
        $("#default-mode").addClass("dropdown-item-checked");
      });

      $("#dark-mode").click(function() {
        if (localStorage.getItem("theme") !== "dark") {
          document.documentElement.setAttribute("data-theme", "dark");
          localStorage.setItem("theme", "dark");
          // Ensure font styles are off
          if (localStorage.getItem("toggle") === "true") {
            $("#fs_switch")
              .prop("checked", false)
              .trigger("click");
          }
          $("#switch").addClass("disabled");
          that.clear_ticks();
          $("#dark-mode").addClass("dropdown-item-checked");
        }
      });

      $("#contrast-mode").click(function() {
        if (localStorage.getItem("theme") !== "contrast") {
          document.documentElement.setAttribute("data-theme", "contrast");
          localStorage.setItem("theme", "contrast");
          // Ensure font styles are off
          if (localStorage.getItem("toggle") === "true") {
            $("#fs_switch")
              .prop("checked", false)
              .trigger("click");
          }
          $("#switch").addClass("disabled");
          that.clear_ticks();
          $("#contrast-mode").addClass("dropdown-item-checked");
        }
      });
    });
  };

  // Remove ticks from selected options
  Themes.prototype.clear_ticks = function() {
    $("#default-mode").removeClass("dropdown-item-checked");
    $("#dark-mode").removeClass("dropdown-item-checked");
    $("#contrast-mode").removeClass("dropdown-item-checked");
  };

  return Themes;
});
