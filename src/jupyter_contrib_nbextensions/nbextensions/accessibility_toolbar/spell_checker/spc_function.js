define([
  "base/js/namespace",
  "jquery",
  "codemirror/lib/codemirror",
  "./EN_dictionary",
  "notebook/js/textcell"
], function(Jupyter, $, CodeMirror, Dict, textcell) {
  "use strict";

  var spc = function(editor) {
    var dict_obj = new Dict();
    var dict = dict_obj.Initial_local();
    var spc_name = "spc";
    var style = "spell-bold";
    var typo_list = new Array();
    var default_mode =
      textcell["MarkdownCell"]["options_default"]["cm_config"]["mode"];
    var suggestions = {};

    spc.prototype.default = function() {
      typo_list = [];
      suggestions = {};
      style = "spell-bold";
    };

    //Get current incorrect word styling
    function get_style() {
      return style;
    }

    //Apply mode to all Markdown cells
    spc.prototype.refresh = function() {
      var cell_list = document.querySelectorAll(".CodeMirror");
      for (var i = 0; i < cell_list.length - 1; i++) {
        if (cell_list[i].CodeMirror.getMode()["name"] == spc_name) {
          cell_list[i].CodeMirror.setOption("mode", spc_name);
        }
      }
      textcell["MarkdownCell"]["options_default"]["cm_config"][
        "mode"
      ] = spc_name;
    };

    //Open or Close the spell checker
    spc.prototype.toggle = function() {
      var cell_list = document.querySelectorAll(".CodeMirror");
      for (var i = 0; i < cell_list.length - 1; i++) {
        if (cell_list[i].CodeMirror.getMode()["name"] == "ipythongfm") {
          cell_list[i].CodeMirror.setOption("mode", spc_name);
        } else if (cell_list[i].CodeMirror.getMode()["name"] == spc_name) {
          cell_list[i].CodeMirror.setOption("mode", default_mode);
        }
      }
      var cur_mode =
        textcell["MarkdownCell"]["options_default"]["cm_config"]["mode"];
      textcell["MarkdownCell"]["options_default"]["cm_config"]["mode"] =
        cur_mode == spc_name ? default_mode : spc_name;
    };

    //Check word
    function checker(word) {
      var word_temp = word.toLowerCase();
      var l = 0;
      var r = dict.length - 1;
      var mid;
      var neighbour = new Array();
      while (l <= r) {
        mid = parseInt((l + r) / 2);
        neighbour.push(dict[mid]);
        if (dict[mid] == word_temp) {
          return true;
        } else if (dict[mid] < word_temp) {
          l = mid + 1;
        } else {
          r = mid - 1;
        }
      }
      var sug = new Array();
      sug.push(neighbour[neighbour.length - 1]);
      sug.push(neighbour[neighbour.length - 2]);
      sug.push(neighbour[neighbour.length - 3]);
      suggestions[word] = sug;
      return false;
    }

    //Define a new CodeMirror word to add styling when the word is incorrect
    spc.prototype.define_mode = function() {
      typo_list = [];
      var symbols = ".,!@#$%^&*()_-+=|\\}{][:;'/?<>\" ";
      CodeMirror.defineMode(spc_name, function(config) {
        var spc_mode = {
          name: spc_name,
          token: function(stream) {
            var ch = stream.peek();
            var word = "";
            if (symbols.includes(ch)) {
              stream.next();
              return null;
            }
            while ((ch = stream.peek()) != null && !symbols.includes(ch)) {
              word += ch;
              stream.next();
            }
            if (!checker(word)) {
              typo_list.push(word);
              return get_style();
            }
            return null;
          }
        };
        return CodeMirror.overlayMode(
          CodeMirror.getMode(config, config.backdrop || "text/plain"),
          spc_mode,
          true
        );
      });
      return spc_name;
    };

    //Get suggestions if the word is incorrect
    spc.prototype.get_suggestions = function() {
      $("#suggestions").empty();
      for (var j = 0; j < Object.keys(suggestions).length; j++) {
        var key_temp = Object.keys(suggestions)[j];
        if (typo_list.includes(key_temp)) {
          for (var k = 1; k < 4; k++) {
            var value_temp =
              suggestions[key_temp][suggestions[key_temp].length - k];
            var option = $("<option>", {
              value: JSON.stringify([key_temp, value_temp])
            }).text(key_temp + " --> " + value_temp);
            $("#suggestions").append(option);
          }
        }
      }
      suggestions = {};
    };

    //Add new word to local storage and dictionary
    spc.prototype.add_word = function(word) {
      word = word.toLowerCase();
      this.dict = dict_obj.add_new_word(word);
    };

    //Apply the change to the incorrect word
    spc.prototype.apply = function() {
      var cur_text = editor.CodeMirror.getValue();
      var selected = JSON.parse($("#suggestions").val());
      var origin_word = selected[0];
      var suggest_word = selected[1];
      cur_text = cur_text.split(" ");
      var _text = new Array();
      for (var i = 0; i < cur_text.length; i++) {
        if (cur_text[i].includes("\n")) {
          var temp = cur_text[i].split("\n");
          _text.push(temp[0]);
          _text.push("\n");
          _text.push(temp[1]);
        } else {
          _text.push(cur_text[i]);
        }
      }
      for (var i = 0; i < _text.length; i++) {
        if (_text[i].includes("\n")) {
          _text[i] =
            _text[i] == origin_word + "\n" ? suggest_word + "\n" : _text[i];
        } else {
          _text[i] = _text[i] == origin_word ? suggest_word : _text[i];
        }
      }
      var temp = new Array();
      var res = "";
      for (var i = 0; i < _text.length; i++) {
        if (_text[i] == "\n") {
          res += temp.join(" ");
          res += "\n";
          temp = [];
        } else {
          temp.push(_text[i]);
        }
      }
      if (temp != []) {
        res += temp.join(" ");
      }
      editor.CodeMirror.setValue(res);
    };

    //Select Bold or Underline for incorrect word
    spc.prototype.change_style = function(radio_btn, flag) {
      style = radio_btn == true ? "spell-bold" : "spell-underline";
      if (flag) {
        var cell_list = document.querySelectorAll(".CodeMirror");
        for (var i = 0; i < cell_list.length - 1; i++) {
          if (cell_list[i].CodeMirror.getMode()["name"] == spc_name) {
            cell_list[i].CodeMirror.setOption("mode", spc_name);
          }
        }
        var cur_mode =
          textcell["MarkdownCell"]["options_default"]["cm_config"]["mode"];
        textcell["MarkdownCell"]["options_default"]["cm_config"]["mode"] =
          cur_mode == spc_name ? default_mode : spc_name;
      }
    };
  };
  return spc;
});
