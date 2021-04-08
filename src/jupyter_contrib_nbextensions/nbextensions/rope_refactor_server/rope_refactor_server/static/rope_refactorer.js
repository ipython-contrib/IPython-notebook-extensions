// Copyright (c) Jupyter-Contrib Team.
// Distributed under the terms of the Modified BSD License.

define([
    'jquery',
    'base/js/namespace',
    'notebook/js/codecell',
], function (
    $,
    Jupyter,
    codecell
) {
        'use strict';

    const CodeCell = codecell.CodeCell;

    class RopeRefactorer {
            constructor(mod_name) {
                this.mod_name = mod_name;
                this.mod_log_prefix = '[' + this.mod_name + ']';

                // gives default settings
                this.cfg = {
                    add_toolbar_buttons: false,
                    hotkeys: {
                        rename: 'shift-F6',
                        extract_variable: 'alt-meta-v',
                        extract_method: 'alt-meta-m',
                        inline: 'alt-meta-;',
                    },
                    actions: {
                        extract_variable: {
                            help: 'Extract variable',
                            label: 'Extract variable',
                            icon: ''
                        },
                        rename: {
                            label: 'Rename',
                            help: 'Rename',
                            icon: ''
                        },
                        extract_method: {
                            label: 'Extract method',
                            help: 'Extract method',
                            icon: ''
                        },
                        inline: {
                            label: 'Inline',
                            help: 'Inline',
                            icon: ''
                        },
                    },
                    register_hotkey: true,
                    show_alerts_for_errors: true,
                };
            }

            initialize_plugin() {
                const that = this;
                // first, load config
                Jupyter.notebook.config.loaded
                    // now update default config with that loaded from server
                    .then(function on_success() {
                        $.extend(true, that.cfg, Jupyter.notebook.config.data[that.mod_name]);
                        Object.keys(that.cfg.actions).forEach(actionName => {
                            that.cfg.actions[actionName].help += " (" + that.cfg.hotkeys[actionName] + ")"
                        });

                    }, function on_error(err) {
                        console.warn(that.mod_log_prefix, 'error loading config:', err);
                    })
                    // now do things which require the config to be loaded
                    .then(function on_success() {
                        that.register_actions(); // register actions
                        that.setup_for_new_kernel();
                    }).catch(function on_error(err) {
                        console.error(that.mod_log_prefix, 'error loading:', err);
                    });
            }

            register_actions() {
                /*
                 *  it's important that the actions created by registering keyboard
                 *  shortcuts get different names, as otherwise a default action is
                 *  created, whose name is a string representation of the handler
                 *  function.
                 *  Since this library uses the same handler function for all plugins,
                 *  just with different contexts (different values of cfg), their
                 *  string representations are the same, and the last one to be
                 *  registered overwrites all previous versions.
                 *  This is essentially an issue with notebook, but it encourages us to
                 *  use actions, which is where notebook is going anyway.
                 */
                const that = this;
                let actions = this.cfg.actions;
                actions.extract_variable.handler = function (evt) {
                    that.extract_variable();
                };
                actions.rename.handler = function (evt) {
                    that.rename();
                };
                actions.extract_method.handler = function (evt) {
                    that.extract_method();
                };
                actions.inline.handler = function (evt) {
                    that.inline();
                };
                Object.keys(actions).forEach(actionName => {
                    actions[actionName].name = Jupyter.keyboard_manager.actions.register(actions[actionName], actionName + "_action", that.mod_name);
                });
            }

            setup_for_new_kernel() {
                if (this.cfg.add_toolbar_buttons) {
                    this.add_toolbar_buttons();
                }
                if (this.cfg.register_hotkey) {
                    this.add_keyboard_shortcuts();
                }
            }


            add_toolbar_buttons() {
                let button_tag = this.mod_name + '_button';
                if ($('#' + button_tag).length < 1) {
                    let list = [];
                    Object.keys(this.cfg.actions).forEach(actionName => {
                        list.push({
                            action: this.cfg.actions[actionName].name,
                            label: this.cfg.actions[actionName].label
                        })
                    });
                    Jupyter.toolbar.add_buttons_group(list, button_tag);
                }
            }

            add_keyboard_shortcuts() {
                const new_shortcuts = {};
                Object.keys(this.cfg.actions).forEach(actionName => {
                    new_shortcuts[this.cfg.hotkeys[actionName]] = this.cfg.actions[actionName].name;
                });
                Jupyter.keyboard_manager.edit_shortcuts.add_shortcuts(new_shortcuts);
            }



            /**
             * Performs the "extract variable" refactoring in the selected cell with the selected text
             */
            extract_variable() {
                this.perform_refactoring("extract_variable", "Variable name: ");
            }

            /**
             * Performs the "rename" refactoring in the selected cell with the selected text/cursor position
             */
            rename() {
                this.perform_refactoring("rename", "New name: ");
            }

            /**
             * Performs the "extract_method" refactoring in the selected cell with the selected text
             */
            extract_method() {
                this.perform_refactoring("extract_method", "Method name: ");
            }

            /**
             * Performs the "inline" refactoring in the selected cell with the selected text/cursor position
             */
            inline() {
                this.perform_refactoring("inline", undefined);
            }

            /**
             * 
             * @param {string} refactoring_action_name one of the actions that are supported. See cfg
             * @param {string} user_prompt the message with which to prompt the user for 
             * entry. if undefined, the user will not be prompted.
             */
            perform_refactoring(refactoring_action_name, user_prompt) {
                let cell = Jupyter.notebook.get_selected_cell();
                if (cell === undefined) {
                    alert("No cell selected");
                    return;
                }
                if (!(cell instanceof CodeCell)) {
                    alert("Selected cell is not a code cell");
                    return;
                }
                let selections = cell.code_mirror.listSelections();
                if (selections.length > 1) {
                    alert("Only single selections are supported");
                    return;
                }
                if (selections.length === 0) {
                    alert("No text selected");
                    return;
                }
                let selection = selections[0];
                let start = selection.anchor;
                let end = selection.head;
                let new_variable_name;
                if (user_prompt !== undefined) {
                    new_variable_name = prompt(user_prompt);
                    if (new_variable_name === null) return; //user cancelled
                }
                let callbacks = this.construct_cell_callbacks(cell);
                this.send_request_to_server(refactoring_action_name,
                    JSON.stringify(cell.get_text()), start, end, new_variable_name)
                    .then(callbacks[0], callbacks[1]);
            }

            /**
             * construct functions as callbacks for the cell promise. This
             * is necessary because javascript lacks loop scoping, so if we don't use
             * this IIFE pattern, cell_index & cell are passed by reference, and every
             * callback ends up using the same value
             * @param {CodeCell} cell 
             * @returns array with two callback functions (success and failure), each taking a string.
             */
            construct_cell_callbacks(cell) {
                const that = this;
                const on_success = function (refactored_code) {
                    cell.set_text(refactored_code);
                };
                const on_failure = function (reason) {
                    console.warn(that.mod_log_prefix, 'error processing cell:\n', reason);
                    if (that.cfg.show_alerts_for_errors) {
                        alert(reason);
                    }
                };
                return [on_success, on_failure];
            }

            /**
             * Contact rope_refactor_server serverextension to perform refactoring with the given arguments.
             * @param {string} action the name of the refactoring action to request from rope
             * @param {string} code_to_refactor the entire code cell's contents
             * @param {Object} start the start of the selected text that should serve as input for refactoring. Should contain nodes 'line' and 'ch' which contain the line number of the position as well as the character position within the line. (code_mirror.Pos)
             * @param {Object} end the end of the selected text that should serve as input for refactoring. Same structure as start.
             * @param {string} new_variable_name name for the new variable, if applicable. If not supplied but required, a default name will be chosen
             * @returns a promise for the server response:
             *      - resolving will return the refactored code as string
             *      - rejecting will return the error as string
             */
            send_request_to_server(action, code_to_refactor, start, end, new_variable_name) {
                const that = this;
                return new Promise(function (resolve, reject) {
                    $.getJSON('/rope_refactoring', {
                        "start": {
                            "line": start.line,
                            "ch": start.ch
                        },
                        "end": {
                            "line": end.line,
                            "ch": end.ch
                        },
                        "code_to_refactor": code_to_refactor,
                        "new_variable_name": new_variable_name,
                        "action": action
                    }, function (msg) {
                        return resolve(that.convert_error_msg_to_broken_promise(msg).then(function on_success(msg) {
                            // print goes to stream text => msg.content.text
                            // but for some kernels (eg nodejs) can be called as result of exec
                            let refactored_code = msg.refactored_code;
                            let kernel_config = that.cfg;
                            if (kernel_config.trim_formatted_text) {
                                refactored_code = refactored_code.trim();
                            }
                            return refactored_code;
                        }));
                    });
                });
            }

            /**
             * Determine whether the message contains an error 
             * @param {Object} msg containing nodes error and refactored_code (both strings). 
             * @returns The returned promise will be
             *   - resolved with string message if the message was not an error
             *   - rejected with string error if the message is undefined or contains an error
             */
            convert_error_msg_to_broken_promise(msg) {
                const that = this;
                return new Promise(function (resolve, reject) {
                    if (msg !== undefined) {
                        if (msg.error !== undefined && msg.error !== "") {
                            return reject(that.mod_log_prefix + '\n Error: ' + msg.error);
                        }
                        return resolve(msg);
                    }
                    return reject(that.mod_log_prefix + '\n Error: Unknown server error (no response from server).');
                });
            }

        }

        return { RopeRefactorer: RopeRefactorer };
    });
