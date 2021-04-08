define([
    'jquery',
    'base/js/dialog',
    'base/js/events',
    'base/js/namespace',
    'notebook/js/celltoolbar',
    'notebook/js/codecell',
], function (
    $,
    dialog,
    events,
    Jupyter,
    celltoolbar,
    codecell
) {
    "use strict";

    var CellToolbar = celltoolbar.CellToolbar;

    var mod_name = 'init_cell';
    var log_prefix = '[' + mod_name + ']';
    var options = { // updated from server's config & nb metadata
        run_on_kernel_ready: true,
    };

    var toolbar_preset_name = 'Initialization Cell';
    var init_cell_ui_callback = CellToolbar.utils.checkbox_ui_generator(
        toolbar_preset_name,
        function setter (cell, value) {
            if (value) {
                cell.metadata.init_cell = true;
            }
            else {
                delete cell.metadata.init_cell;
            }
        },
        function getter (cell) {
            // if init_cell is undefined, it'll be interpreted as false anyway
            return cell.metadata.init_cell;
        }
    );

    function count_init_cells () {
        console.log(log_prefix, 'counting initialization cells');
        var num = 0;
        var cells = Jupyter.notebook.get_cells();
        for (var ii = 0; ii < cells.length; ii++) {
            var cell = cells[ii];
            if ((cell instanceof codecell.CodeCell) && cell.metadata.init_cell === true ) {
                num++;
            }
        }
        console.log(log_prefix, 'found ' + num + ' initialization cell' + (num !== 1 ? 's' : ''));
        return num
    }

    function run_init_cells () {
        console.log(log_prefix, 'running all initialization cells');
        var num = 0;
        var cells = Jupyter.notebook.get_cells();
        for (var ii = 0; ii < cells.length; ii++) {
            var cell = cells[ii];
            if ((cell instanceof codecell.CodeCell) && cell.metadata.init_cell === true ) {
                cell.execute();
                num++;
            }
        }
        console.log(log_prefix, 'finished running ' + num + ' initialization cell' + (num !== 1 ? 's' : ''));
    }

    var load_ipython_extension = function() {
        // register action
        var prefix = 'auto';
        var action_name = 'run-initialization-cells';
        var action = {
            icon: 'fa-calculator',
            help: 'Run all initialization cells',
            help_index : 'zz',
            handler : run_init_cells
        };
        var action_full_name = Jupyter.notebook.keyboard_manager.actions.register(action, action_name, prefix);

        // add toolbar button
        Jupyter.toolbar.add_buttons_group([action_full_name]);

        // setup things to run on loading config/notebook
        Jupyter.notebook.config.loaded
            .then(function update_options_from_config () {
                $.extend(true, options, Jupyter.notebook.config.data[mod_name]);
            }, function (reason) {
                console.warn(log_prefix, 'error loading config:', reason);
            })
            .then(function () {
                if (Jupyter.notebook._fully_loaded) {
                    callback_notebook_loaded();
                }
                events.on('notebook_loaded.Notebook', callback_notebook_loaded);
            }).catch(function (reason) {
                console.error(log_prefix, 'unhandled error:', reason);
            });
    };

    function callback_notebook_loaded () {
        // update from metadata
        var md_opts = Jupyter.notebook.metadata[mod_name];
        if (md_opts !== undefined) {
            console.log(log_prefix, 'updating options from notebook metadata:', md_opts);
            $.extend(true, options, md_opts);
        }

        // register celltoolbar presets if they haven't been already
        if (CellToolbar.list_presets().indexOf(toolbar_preset_name) < 0) {
            // Register a callback to create a UI element for a cell toolbar.
            CellToolbar.register_callback('init_cell.is_init_cell', init_cell_ui_callback, 'code');
            // Register a preset of UI elements forming a cell toolbar.
            CellToolbar.register_preset(toolbar_preset_name, ['init_cell.is_init_cell'], Jupyter.notebook);
        }

        if (options.run_on_kernel_ready) {
            var num = count_init_cells();
            
            if (num) {
                if (Jupyter.notebook.trusted) {
                    run_init_cells_asap()
                }
                else {
                    dialog.modal({
                        title : 'Untrusted notebook with initialization code',
                        body : num + ' initialization code cell' + (num !== 1 ? 's' : '') + ' was found but not run since this notebook is untrusted.',
                        buttons: {
                            'Trust notebook': {
                                'class' : 'btn-danger',
                                'click' : () => Jupyter.notebook.trust_notebook()
                            },
                            'Do nothing': {'class' : 'btn-primary'}
                        },
                        notebook: Jupyter.notebook,
                        keyboard_manager: Jupyter.keyboard_manager,
                    });
                }
            }
        }
    }

    function run_init_cells_asap () {
        if (Jupyter.notebook && Jupyter.notebook.kernel && Jupyter.notebook.kernel.info_reply.status === 'ok') {
            // kernel is already ready
            run_init_cells();
        }
        else {
            // whenever a (new) kernel  becomes ready, run all initialization cells
            events.on('kernel_ready.Kernel', run_init_cells);
        }
    }

    return {
        load_ipython_extension : load_ipython_extension
    };
});
