define([
    'base/js/namespace',
    'codemirror/lib/codemirror'
], function(Jupyter, CodeMirror) {
    "use strict";

    var prefix = 'auto';

    var action_duplicateLine = Jupyter.keyboard_manager.actions.register(
        {
            icon: 'fa-comment-o',
            help: 'Duplicate Line',
            help_index: 'ec',
            id: 'duplicate-line',
            handler: duplicateLine
        },
        'duplicate-line',
        prefix
    );

    var action_deleteLine = Jupyter.keyboard_manager.actions.register(
        {
            icon: 'fa-comment-o',
            help: 'Delete Line',
            help_index: 'ec',
            id: 'delete-line',
            handler: deleteLine
        },
        'delete-line',
        prefix
    );

    var edit_mode_shortcuts = {
        'Ctrl-Alt-d': action_duplicateLine,
        'Ctrl-Alt-k': action_deleteLine
    };

    var load_extension = function() {
        Jupyter.keyboard_manager.edit_shortcuts.add_shortcuts(edit_mode_shortcuts);
        console.log("[line_edit] loaded");
    };

    function duplicateLine() {
        var cm = Jupyter.notebook.get_selected_cell().code_mirror

        // get current cursor position
        var current_cursor = cm.doc.getCursor();

        // First go to end of line, to avoid the problem where if cursor was at start
        // of indented text, goLineStartSmart would go to very beginning of line,
        // and so we'd get unwanted tabs/spaces in the getRange function.
        CodeMirror.commands.goLineEnd(cm);
        // now we can safely call goLineStartSmart
        CodeMirror.commands.goLineStartSmart(cm);
        var start_cursor = cm.doc.getCursor();
        var start = {'line': start_cursor.line, 'ch': start_cursor.ch};

        // go to the end of line
        CodeMirror.commands.goLineEnd(cm);
        var end_cursor = cm.doc.getCursor();
        var end = {'line': end_cursor.line, 'ch': end_cursor.ch};

        // get content
        var line_content = cm.doc.getRange(start, end);

        // make a break for a new line
        CodeMirror.commands.newlineAndIndent(cm);

        // filled a content of the new line content from line above it
        cm.doc.replaceSelection(line_content);

        // restore position cursor on the new line
        cm.doc.setCursor(current_cursor.line + 1, current_cursor.ch);
    }

    function deleteLine() {
        var cm = Jupyter.notebook.get_selected_cell().code_mirror

        // get current cursor position
        var current_cursor = cm.doc.getCursor();
        CodeMirror.commands.deleteLine(cm);
    }

    return {
        load_ipython_extension: load_extension,
    };

});
