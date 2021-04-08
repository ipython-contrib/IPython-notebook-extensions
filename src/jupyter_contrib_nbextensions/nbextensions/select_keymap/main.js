// change the mode of all current and future CodeMirror instances

define([
    "base/js/namespace",
    "notebook/js/cell",
    "codemirror/lib/codemirror",
    "codemirror/keymap/emacs",
    "codemirror/keymap/vim",
    "codemirror/keymap/sublime",
    "codemirror/mode/meta",
    "codemirror/addon/comment/comment",
    "codemirror/addon/dialog/dialog",
    "codemirror/addon/edit/closebrackets",
    "codemirror/addon/edit/matchbrackets",
    "codemirror/addon/search/searchcursor",
    "codemirror/addon/search/search",
], function(
    Jupyter,
    Cell,
    CodeMirror
    // other stuff is loaded, but not used
) {
    "use_strict";

    var previous_mode = "";

    var available_keymaps = [
        "default",
        "emacs",
        "vim",
        "sublime"
    ];

    /* Values to use for config keys that are note defined in server config */
    var default_config = {
        line_wrap: true,
        local_storage: true,
    };

    var starting_state = {
        extraKeys: {},
        edit_shortcuts: {},
        command_shortcuts: {}
    };

    var cm_default = Cell.Cell.options_default.cm_config;
    var edit_shortcuts = Jupyter.keyboard_manager.edit_shortcuts;
    var command_shortcuts = Jupyter.keyboard_manager.command_shortcuts;

    var mods = {
        vim: {
            add: {
                extraKeys: {
                    "Esc": "leave_current_mode",
                    "Ctrl-[": "leave_current_mode"
                },
                command_shortcuts: {
                    "Ctrl-c": "jupyter-notebook:interrupt-kernel",
                    "Ctrl-z": "jupyter-notebook:restart-kernel",

                    "d,d": "jupyter-notebook:cut-cell",
                    "y,y": "jupyter-notebook:copy-cell",
                    "u": "jupyter-notebook:undo-cell-deletion",

                    "p": "jupyter-notebook:paste-cell-below",
                    "Shift-P": "jupyter-notebook:paste-cell-above",

                    "o": "jupyter-notebook:insert-cell-below",
                    "Shift-O": "jupyter-notebook:insert-cell-above",

                    "i": "jupyter-notebook:enter-edit-mode",
                    "Enter": "jupyter-notebook:enter-edit-mode",

                    "Shift-J": "jupyter-notebook:move-cell-down",
                    "Shift-K": "jupyter-notebook:move-cell-up",

                    "Shift-/": "jupyter-notebook:show-keyboard-shortcuts",
                    "h": "jupyter-notebook:toggle-cell-output-collapsed",
                    "Shift-H": "jupyter-notebook:toggle-cell-output-scrolled",

                    "`": "jupyter-notebook:change-cell-to-code",
                    "0": "jupyter-notebook:change-cell-to-markdown"
                },
                edit_shortcuts: {
                    "Shift-Esc": "jupyter-notebook:enter-command-mode"
                }
            },
            remove: {
                edit_shortcuts: ["Esc"]
            },
            custom: function() {
                disable_keyboard_manager_in_dialog(this);
            },
            custom_teardown: function() {
                reenable_keyboard_manager_in_dialog(this);
            }
        },
        emacs: {
            add: {
                keyMap: {
                    "Ctrl-Shift-Z": "redo",
                },
                extraKeys: {
                    "Ctrl-Y": "yank_no_selection",
                },
                command_shortcuts: {
                    "Ctrl-N": "jupyter-notebook:select-next-cell",
                    "Ctrl-P": "jupyter-notebook:select-previous-cell",
                    "Alt-X": "jupyter-notebook:show-command-palette"

                },
                edit_shortcuts: {
                    "Alt-X": "jupyter-notebook:show-command-palette"
                }
            },
            remove: {
                edit_shortcuts: ["Ctrl-Shift-Minus"],
                keyMap: ["Ctrl-V"]
            },
            custom: function() {
                disable_keyboard_manager_in_dialog(this);
            },
            custom_teardown: function() {
                reenable_keyboard_manager_in_dialog(this);
            }
        }
    };

    function disable_keyboard_manager_in_dialog(_this) {
        // Disable keyboard manager for code mirror dialogs, handles ':'
        // triggered ex-mode dialog box in vim mode.
        // Manager is re-enabled by re-entry into notebook edit mode +
        // cell normal mode after dialog closes
        _this.openDialog = CodeMirror.prototype.openDialog;

        function openDialog_keymap_wrapper(target, template, callback, options) {
            Jupyter.keyboard_manager.disable();
            return target.call(this, template, callback, options);
        }

        CodeMirror.defineExtension("openDialog", _.wrap(_this.openDialog,
            openDialog_keymap_wrapper));
    }

    function reenable_keyboard_manager_in_dialog(_this) {
        CodeMirror.defineExtension("openDialog", _this.openDialog);
    }

    var server_config = Jupyter.notebook.config;
    // make sure config is loaded before making initial changes
    var initialize = function() {
        save_starting_state();
        // initialize last stored value or default
        switch_keymap(get_stored_keymap());
    };

    function get_config(key) {
        if (server_config.data.hasOwnProperty("select_keymap_" + key)) {
            return server_config.data["select_keymap_" + key];
        }
        return default_config[key];
    }

    function get_stored_keymap() {
        var keymap;
        if (get_config("local_storage")) {
            keymap = window.localStorage.getItem("jupyter_keymap");
        } else {
            keymap = server_config.data.stored_keymap;
        }
        return keymap || "default";
    }

    function store_keymap(mode) {
        if (get_config("local_storage")) {
            window.localStorage.setItem("jupyter_keymap", mode);
        } else {
            server_config.update({
                stored_keymap: mode
            });
        }
    }

    function flatten_shortcuts(shortcut_tree) {
        var result = {};
        for (var p in shortcut_tree) {
            if (typeof(shortcut_tree[p]) == "string") {
                result[p] = shortcut_tree[p];
            } else {
                var subresult = flatten_shortcuts(shortcut_tree[p]);
                for (var subp in subresult) {
                    result[p + "," + subp] = subresult[subp];
                }
            }
        }
        return result;
    }

    function update_shortcuts(shortcut_manager, updated_shortcuts) {
        var current_shortcuts = _.invert(flatten_shortcuts(shortcut_manager._shortcuts));

        for (var shortcut_action in _.invert(updated_shortcuts)) {
            if (_.has(current_shortcuts, shortcut_action) &&
                shortcut_manager.get_shortcut(current_shortcuts[shortcut_action])) {

                shortcut_manager.remove_shortcut(current_shortcuts[shortcut_action]);
            }
        }

        shortcut_manager.add_shortcuts(updated_shortcuts);
    }

    // start custom CodeMirror command definitions
    function leave_current_mode(cm) {
        if (cm.state.vim.insertMode) {
            // Move from insert mode into command mode.
            CodeMirror.keyMap["vim-insert"].call("Esc", cm);
        } else if (cm.state.vim.visualMode) {
            // Move from visual mode to command mode.
            CodeMirror.keyMap["vim"].call("Esc", cm);
        } else {
            // Move to notebook command mode.
            Jupyter.notebook.command_mode();
            Jupyter.notebook.focus_cell();
        }
    };

    var orig_ctrl_y = CodeMirror.keyMap.emacs["Ctrl-Y"];

    function yank_no_selection(cm) {
        orig_ctrl_y(cm);
        // remove selection after yank
        cm.setSelection(cm.getCursor(), cm.getCursor());
    };

    CodeMirror.commands.yank_no_selection = yank_no_selection;
    CodeMirror.commands.leave_current_mode = leave_current_mode;
    // end custom CodeMirror command definitions

    function create_menu() {
        var menu = [
            "<li class='divider''></li>",
            "<li class='dropdown-submenu'>",
            "<a href='#'>Keymaps</a>",
            "<ul class='dropdown-menu'' id='keymap_menu'>"
        ];

        available_keymaps.forEach(function(keymap) {
            menu.push(`<li><a id="keymap-${keymap}" href="#" title="Toggle ${keymap} keybindings" onClick="switch_keymap('${keymap}')" style="text-transform: capitalize;">${keymap}</a></li>`);
        });

        menu.push("</ul></li>");

        $("#move_cell_down").after(menu.join("\n"));
    }

    function update_cm_instance_to_defaults(cell) {
        var cm = cell.code_mirror;
        cm.setOption("vimMode", cm_default["vimMode"]);
        cm.setOption("lineWrapping", cm_default["lineWrapping"]);
        cm.setOption("keyMap", cm_default["keyMap"]);
        cm.setOption("extraKeys", cm_default["extraKeys"]);
    };

    function highlight_selection(mode) {
        $("[id^=keymap]").css("font-weight", "normal");
        $("[id=keymap-" + mode + "]").css("font-weight", "bold");
    }

    function reset_state() {
        // FIXME: if this extension loads before other extensions that alter
        // key shortcuts, this will probably reset those as well
        cm_default.extraKeys = _.clone(starting_state.extraKeys);
        update_shortcuts(edit_shortcuts, starting_state.edit_shortcuts);
        update_shortcuts(command_shortcuts, starting_state.command_shortcuts);

        // if changing from another mode, run the teardown function
        var prev_mode_mods = mods[previous_mode];
        if (prev_mode_mods && prev_mode_mods.custom_teardown) {
            prev_mode_mods.custom_teardown();
        }
    }

    function save_starting_state() {
        starting_state.extraKeys = _.clone(cm_default.extraKeys);
        starting_state.edit_shortcuts = flatten_shortcuts(edit_shortcuts._shortcuts);
        starting_state.command_shortcuts = flatten_shortcuts(command_shortcuts._shortcuts);
    }

    function add_bindings(add, mode) {
        _.extend(CodeMirror.keyMap[mode], CodeMirror.normalizeKeyMap(add.keyMap));
        _.extend(cm_default.extraKeys, CodeMirror.normalizeKeyMap(add.extraKeys));

        if (add.command_shortcuts) {
            update_shortcuts(command_shortcuts, add.command_shortcuts);
        }

        if (add.edit_shortcuts) {
            update_shortcuts(edit_shortcuts, add.edit_shortcuts);
        }
    }

    function remove_bindings(remove, mode) {
        _.forEach(remove.keyMap, function(key) {
            delete CodeMirror.keyMap[mode][key];
        });

        _.forEach(remove.extraKeys, function(key) {
            delete cm_default.extraKeys[key];
        });

        _.forEach(remove.edit_shortcuts, function(key) {
            edit_shortcuts.remove_shortcut(key);
        });

        _.forEach(remove.command_shortcuts, function(key) {
            command_shortcuts.remove_shortcut(key);
        });
    }

    function change_notebook_defaults(mode) {
        // make changes to cm defaults
        cm_default.keyMap = mode;
        cm_default.vimMode = mode == "vim";
        cm_default.lineWrapping = get_config('line_wrap');

        var mode_mods = mods[mode];
        if (mode_mods) {
            if (mode_mods.add) {
                add_bindings(mode_mods.add, mode);
            }

            if (mode_mods.remove) {
                remove_bindings(mode_mods.remove, mode);
            }

            if (mode_mods.custom) {
                mode_mods.custom();
            }
        }
    }

    function change_cells_to_defaults() {
        Jupyter.notebook.get_cells().map(update_cm_instance_to_defaults);
    }

    function switch_keymap(mode) {
        // don't run if selecting currently selected mode
        if (mode == previous_mode) return;

        // store selection only when it changes
        if (previous_mode) store_keymap(mode);

        reset_state();

        change_notebook_defaults(mode);

        change_cells_to_defaults();

        highlight_selection(mode);

        previous_mode = mode;
    }

    window.switch_keymap = switch_keymap;

    return {
        load_ipython_extension: function() {
            return Jupyter.notebook.config.loaded
                .then(initialize)
                .then(create_menu);
        }
    };
});