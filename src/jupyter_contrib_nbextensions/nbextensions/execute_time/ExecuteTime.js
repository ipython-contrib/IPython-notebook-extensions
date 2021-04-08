
//  Copyright (C) 2014  Jean-Christophe Jaskula
//                2015  joshuacookebarnes@gmail.com
//
//  Distributed under the terms of the BSD License.
// ---------------------------------------------------------------------------
//
// Execution timings:
// display when a cell was last executed, and how long it took to run
// A double click on the timing box makes it disappear

define([
    'require',
    'jquery',
    'moment',
    'base/js/namespace',
    'base/js/events',
    'notebook/js/codecell'
], function (
    requirejs,
    $,
    moment,
    Jupyter,
    events,
    codecell
) {
    'use strict';

    var mod_name = 'ExecuteTime';
    var log_prefix = '[' + mod_name + ']';

    var CodeCell = codecell.CodeCell;

    // defaults, overridden by server's config
    var options = {
        clear_timings_on_clear_output: false,
        clear_timings_on_kernel_restart: false,
        default_kernel_to_utc: true,
        display_absolute_format: 'HH:mm:ss YYYY-MM-DD',
        display_absolute_timings: true,
        display_in_utc: false,
        display_right_aligned: false,
        highlight: {
            use: true,
            color: '#00bb00',
        },
        relative_timing_update_period: 10,
        template: {
            executed: 'executed in ${duration}, finished ${end_time}',
            queued: 'execution queued ${start_time}',
        },
        hide_shorter_than_threshold_in_ms: 0,
    };

    function patch_CodeCell_get_callbacks () {
        console.log(log_prefix, 'patching CodeCell.prototype.get_callbacks');
        var old_get_callbacks = CodeCell.prototype.get_callbacks;
        CodeCell.prototype.get_callbacks = function () {
            var callbacks = old_get_callbacks.apply(this, arguments);

            var cell = this;
            var prev_reply_callback = callbacks.shell.reply;
            callbacks.shell.reply = function (msg) {
                if (msg.msg_type === 'execute_reply') {
                    $.extend(true, cell.metadata, {
                        ExecuteTime: {
                            start_time: add_utc_offset(msg.metadata.started),
                            end_time: add_utc_offset(msg.header.date),
                        }
                    });
                    var timing_area = update_timing_area(cell);
                    if ($.ui !== undefined && options.highlight.use) {
                        timing_area.stop(true, true).show(0).effect('highlight', {color: options.highlight.color});
                    }
                }
                else {
                    console.log('msg_type', msg.msg_type);
                }
                return prev_reply_callback(msg);
            };
            return callbacks;
        };
    }

    function patch_CodeCell_clear_output () {
        console.log(log_prefix, 'Patching CodeCell.prototype.clear_output to clear timings also.');
        var orig_clear_output = CodeCell.prototype.clear_output;
        CodeCell.prototype.clear_output = function () {
            var ret = orig_clear_output.apply(this, arguments);
            clear_timing_data([this]);
            return ret;
        };
    }

    function toggle_timing_display (cells, vis) {
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            if (cell instanceof CodeCell) {
                var ce = cell.element;
                var timing_area = ce.find('.timing_area');
                if (timing_area.length > 0) {
                    if (vis === undefined) {
                        vis = !timing_area.is(':visible');
                    }
                    timing_area.toggle(vis);
                }
            }
        }
        return vis;
    }

    function clear_timing_data (cells) {
        cells.forEach(function (cell, idx, arr) {
            delete cell.metadata.ExecuteTime;
            cell.element.find('.timing_area').remove();
        });
        events.trigger('set_dirty.Notebook', {value: true});
    }

    function clear_timing_data_all () {
        console.log(log_prefix, 'Clearing all timing data');
        clear_timing_data(Jupyter.notebook.get_cells());
    }

    function create_menu () {
        var timings_menu_item = $('<li/>')
            .addClass('dropdown-submenu')
            .append(
                $('<a href="#">')
                    .text('Execution Timings')
                    .on('click', function (evt) { evt.preventDefault(); })
            )
            .appendTo($('#cell_menu'));

        var timings_submenu = $('<ul/>')
            .addClass('dropdown-menu')
            .appendTo(timings_menu_item);

        $('<li/>')
            .attr('title', 'Toggle the timing box for the selected cell(s)')
            .append(
                $('<a href="#">')
                    .text('Toggle visibility (selected)')
                    .on('click', function (evt) {
                        evt.preventDefault();
                        toggle_timing_display(Jupyter.notebook.get_selected_cells());
                    })
            )
            .appendTo(timings_submenu);

        $('<li/>')
            .attr('title', 'Toggle the timing box for all cells')
            .append(
                $('<a href="#">')
                    .text('Toggle visibility (all)')
                    .on('click', function (evt) {
                        evt.preventDefault();
                        toggle_timing_display(Jupyter.notebook.get_cells());
                    })
            )
            .appendTo(timings_submenu);

        $('<li/>')
            .attr('title', 'Clear the selected cell(s) timing data')
            .append(
                $('<a href="#">')
                    .text('Clear (selected)')
                    .on('click', function (evt) {
                        evt.preventDefault();
                        clear_timing_data(Jupyter.notebook.get_selected_cells());
                    })
            )
            .appendTo(timings_submenu);

        $('<li/>')
            .attr('title', 'Clear the timing data from all cells')
            .append(
                $('<a href="#">')
                    .text('Clear (all)')
                    .on('click', function (evt) {
                        evt.preventDefault();
                        clear_timing_data(Jupyter.notebook.get_cells());
                    })
            )
            .appendTo(timings_submenu);
    }

    function excute_codecell_callback (evt, data) {
        var cell = data.cell;
        cell.metadata.ExecuteTime = {start_time: moment().toISOString()};

        update_timing_area(cell);
    }

    function humanized_duration (duration_ms, item_count) {
        if (duration_ms < 1000) { // < 1s, show ms directly
            return Math.round(duration_ms) + 'ms';
        }

        var humanized = '';

        var days = Math.floor(duration_ms / 86400000);
        if (days) {
            humanized += days + 'd ';
        }
        duration_ms %= 86400000;

        var hours = Math.floor(duration_ms / 3600000);
        if (days || hours) {
            humanized += hours + 'h ';
        }
        duration_ms %= 3600000;

        var mins = Math.floor(duration_ms / 60000);
        if (days || hours || mins) {
            humanized += mins + 'm';
        }
        duration_ms %= 60000;

        var secs = duration_ms / 1000; // don't round!
        if (!days) {
            var decimals = (hours || mins > 1) ? 0 : (secs > 10 ? 1 : 2);
            humanized += (humanized ? ' ' : '') + secs.toFixed(decimals) + 's';
        }

        return humanized;
    }

    // ISO8601 UTC offset is in format ±[hh]:[mm], ±[hh][mm], or ±[hh]
    var rgx_has_timezone = new RegExp('Z|[\\-+\u2212]\\d\\d(?::?\\d\\d)?$');
    function add_utc_offset (timestamp) {
        if (options.default_kernel_to_utc && timestamp !== undefined && !rgx_has_timezone.test(timestamp)) {
            return timestamp + 'Z';
        }
        return timestamp;
    }

    function format_moment (when) {
        if (options.display_in_utc) {
            when.utc();
        }
        if (options.display_absolute_timings) {
            return when.format(options.display_absolute_format);
        }
        return when.fromNow();
    }

    function update_timing_area (cell) {
        if (! (cell instanceof CodeCell) ||
                 !cell.metadata.ExecuteTime ||
                 !cell.metadata.ExecuteTime.start_time) {
            return $();
        }

        var timing_area = cell.element.find('.timing_area');
        if (timing_area.length < 1) {
            timing_area = $('<div/>')
                .addClass('timing_area' + (options.display_right_aligned ? ' text-right' : ''))
                .on('dblclick', function (evt) { toggle_timing_display([cell]); })
                .appendTo(cell.element.find('.input_area'));
        }

        var start_time = moment(cell.metadata.ExecuteTime.start_time),
              end_time = cell.metadata.ExecuteTime.end_time;
        var msg = options.template[end_time ? 'executed' : 'queued'];
        msg = msg.replace('${start_time}', format_moment(start_time));
        var show_timing = true;
        if (end_time) {
            end_time = moment(end_time);
            msg = msg.replace('${end_time}', format_moment(end_time));
            var exec_time = -start_time.diff(end_time);
            msg = msg.replace('${duration}', humanized_duration(exec_time));
            show_timing = exec_time >= options.hide_shorter_than_threshold_in_ms;
        }
        toggle_timing_display([cell], show_timing);
        
        timing_area.text(msg);
        return timing_area;
    }

    function _update_all_timing_areas () {
        Jupyter.notebook.get_cells().forEach(update_timing_area);
    }

    function update_all_timing_areas () {
        console.debug(log_prefix, 'updating all timing areas');
        _update_all_timing_areas();
    }

    function add_css(url) {
        $('<link/>')
            .attr({
                rel: 'stylesheet',
                href: requirejs.toUrl(url),
                type: 'text/css'
            })
            .appendTo('head');
    }

    function load_jupyter_extension () {
        // try to load jquery-ui
        if ($.ui === undefined && options.highlight.use) {
            requirejs(['jquery-ui'], function ($) {}, function (err) {
                // try to load using the older, non-standard name (without hyphen)
                requirejs(['jqueryui'], function ($) {}, function (err) {
                    console.log(log_prefix, 'couldn\'t find jquery-ui, so no animations');
                });
            });
        }

        add_css('./ExecuteTime.css');

        Jupyter.notebook.config.loaded.then(function on_config_loaded () {
            $.extend(true, options, Jupyter.notebook.config.data[mod_name]);
        }, function on_config_load_error (reason) {
            console.warn(log_prefix, 'Using defaults after error loading config:', reason);
        }).then(function do_stuff_with_config () {

            patch_CodeCell_get_callbacks();
            events.on('execute.CodeCell', excute_codecell_callback);

            create_menu();

            // add any existing timing info
            events.on("notebook_loaded.Notebook", update_all_timing_areas);
            if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
                // notebook already loaded, so we missed the event, so update all
                update_all_timing_areas();
            }

            // setup optional clear-data calls
            if (options.clear_timings_on_clear_output) {
                patch_CodeCell_clear_output();
            }
            if (options.clear_timings_on_kernel_restart) {
                console.log(log_prefix, 'Binding kernel_restarting.Kernel event to clear timings.');
                events.on('kernel_restarting.Kernel', clear_timing_data_all);
            }

            // if displaying relative times, update them at intervals
            if (!options.display_absolute_timings) {
                var period_ms = 1000 * Math.max(1, options.relative_timing_update_period);
                setInterval(_update_all_timing_areas, period_ms);
            }
        }).catch(function on_error (reason) {
            console.error(log_prefix, 'Error:', reason);
        });
    }

    return {
        load_jupyter_extension : load_jupyter_extension,
        load_ipython_extension : load_jupyter_extension
    };
});
