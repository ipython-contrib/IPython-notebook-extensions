// Copyright (c) Jupyter-Contrib Team.
// Distributed under the terms of the Modified BSD License.
// Authors: @jfbercher and @jcb91

define(['./kernel_exec_on_cell'], function(kernel_exec_on_cell) {
    'use strict';

    var mod_name = 'code_prettify';

    // gives default settings
    var cfg = {
        add_toolbar_button: true,
        hotkeys: {
            process_selected: 'Ctrl-L',
            process_all: 'Ctrl-Shift-L',
        },
        register_hotkey: true,
        show_alerts_for_errors: true,
        button_label: 'Code prettify',
        button_icon: 'fa-legal',
        kbd_shortcut_text: 'Code prettify',
    };

    cfg.kernel_config_map = { // map of parameters for supported kernels
        "python": {
            "library": ["import json",
            "def black_reformat(cell_text):", 
            "    import black",
            "    import re",
            "    cell_text = re.sub('^%', '#%#', cell_text, flags=re.M)",
            "    reformated_text = black.format_str(cell_text, mode=black.FileMode(line_length=88))",
            "    return re.sub('^#%#', '%', reformated_text, flags=re.M)"].join("\n"),
            "prefix": "print(json.dumps(black_reformat(u",
            "postfix": ")))"
        },
        "r": {
            "library": "library(formatR)\nlibrary(jsonlite)",
            "prefix": "cat(toJSON(paste(tidy_source(text=",
            "postfix": ", output=FALSE)[['text.tidy']], collapse='\n')))"
        },
        "javascript": {
            "library": "jsbeautify = require(" + "'js-beautify')",
            // we do this + trick to prevent require.js attempting to load js-beautify when processing the AMI-style load for this module
            "prefix": "console.log(JSON.stringify(jsbeautify.js_beautify(",
            "postfix": ")));"
        }
    };

 
    var prettifier = new kernel_exec_on_cell.define_plugin(mod_name, cfg);
    prettifier.load_ipython_extension = prettifier.initialize_plugin;
    return prettifier;
});
