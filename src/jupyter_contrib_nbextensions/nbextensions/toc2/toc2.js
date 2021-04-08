(requirejs.specified('base/js/namespace') ? define : function(deps, callback) {
    "use strict";
    // if here, the Jupyter namespace hasn't been specified to be loaded.
    // This means that we're probably embedded in a page, so we need to make
    // our definition with a specific module name
    return define('nbextensions/toc2/toc2', deps, callback);
})(['jquery', 'require'], function($, requirejs) {
    "use strict";

    var IPython;
    var events;
    var liveNotebook = false;
    var all_headers = $("#notebook").find(":header");

    // default values for system-wide configurable parameters
    var default_cfg = {
        colors: {
            hover_highlight: '#DAA520',
            selected_highlight: '#FFD700',
            running_highlight: '#FF0000',
            wrapper_background: '#FFFFFF',
            sidebar_border: '#EEEEEE',
            navigate_text: '#333333',
            navigate_num: '#000000',
            on_scroll: '#2447f0',
        },
        collapse_to_match_collapsible_headings: false,
        markTocItemOnScroll: true,
        moveMenuLeft: true,
        navigate_menu: true,
        threshold: 4,
        widenNotebook: false,
    };
    // default values for per-notebook configurable parameters
    var metadata_settings = {
        nav_menu: {},
        number_sections: true,
        sideBar: true,
        skip_h1_title: false,
        base_numbering: 1,
        title_cell: 'Table of Contents',
        title_sidebar: 'Contents',
        toc_cell: false,
        toc_position: {},
        toc_section_display: true,
        toc_window_display: false,
        section_number_prefix: '',
        analyse_level: true,
        dom_search_pattern: '[id]:header',
    };
    $.extend(true, default_cfg, metadata_settings);

    /**
     *  Read our config from server config & notebook metadata
     *  This function should only be called when both:
     *   1. the notebook (and its metadata) has fully loaded
     *  AND
     *   2. Jupyter.notebook.config.loaded has resolved
     */
    var read_config = function () {
        var cfg = default_cfg;

        if (!liveNotebook) {
            return cfg;
        }

        // config may be specified at system level or at document level.
        // first, update defaults with config loaded from server
        $.extend(true, cfg, IPython.notebook.config.data.toc2);
        // ensure notebook metadata has toc object, cache old values
        var md = IPython.notebook.metadata.toc || {};
        // reset notebook metadata to remove old values
        IPython.notebook.metadata.toc = {};
        // then update cfg with any found in current notebook metadata
        // and save in nb metadata (then can be modified per document)
        Object.keys(metadata_settings).forEach(function (key) {
            cfg[key] = IPython.notebook.metadata.toc[key] = (md.hasOwnProperty(key) ? md : cfg)[key];
        });
        return cfg;
    };

    // globally-used status variables:
    var rendering_toc_cell = false;
    // toc_position default also serves as the defaults for a non-live notebook
    var toc_position = {height: 'calc(100% - 180px)', width: '20%', left: '10px', top: '150px'};

    try {
        // this will work in a live notebook because nbextensions & custom.js
        // are loaded by/after notebook.js, which requires base/js/namespace
        IPython = requirejs('base/js/namespace');
        events = requirejs('base/js/events');
        liveNotebook = true;
    } catch (err) {
        // We *are* theoretically in a non-live notebook
        console.log('[toc2] working in non-live notebook'); //, err);
        // in non-live notebook, there's no event structure, so we make our own
        if (window.events === undefined) {
            var Events = function() {};
            window.events = $([new Events()]);
        }
        events = window.events;
    }
    var Jupyter = IPython;

    var setMd = function(key, value) {
        if (liveNotebook) {
            var md = IPython.notebook.metadata.toc;
            if (md === undefined) {
                md = IPython.notebook.metadata.toc = {};
            }
            var old_val = md[key];
            md[key] = value;
            if (typeof _ !== undefined ? !_.isEqual(value, old_val) : old_val != value) {
                IPython.notebook.set_dirty();
            }
        }
        return value;
    };

    function incr_lbl(ary, h_idx) { //increment heading label  w/ h_idx (zero based)
        ary[h_idx]++;
        for (var j = h_idx + 1; j < ary.length; j++) {
            ary[j] = 0;
        }
        return ary.slice(0, h_idx + 1);
    }

    function removeMathJaxPreview(elt) {
        elt.children('.anchor-link, .toc-mod-link').remove();
        elt.find("script[type='math/tex']").each(
            function(i, e) {
                $(e).replaceWith('$' + $(e).text() + '$')
            })
        elt.find("span.MathJax_Preview").remove()
        elt.find("span.MathJax").remove()
        return elt
    }

    var callback_toc_link_click = function(evt) {
        // workaround for https://github.com/jupyter/notebook/issues/699
        setTimeout(function() {
            $.ajax()
        }, 100);
        evt.preventDefault();
        // Each time a link is clicked in the toc, save the current position and target in the history
        var currentSection = $('#toc  .highlight_on_scroll a').data('tocModifiedId')
        if (window.history.state != null){
            if (window.history.state.back != currentSection) {
                window.history.pushState({'back':currentSection},"",'')
            }
        }
        var trg_id = $(evt.currentTarget).attr('data-toc-modified-id');
        window.history.pushState({'back':trg_id},"",'');
        window.history.lastjump = trg_id;

        // use native scrollIntoView method with semi-unique id
        // ! browser native click does't follow links on all browsers
        document.getElementById(trg_id).scrollIntoView(true)
        if (liveNotebook) {
            // use native document method as jquery won't cope with characters
            // like . in an id
            var cell = $(document.getElementById(trg_id)).closest('.cell').data('cell');
            Jupyter.notebook.select(Jupyter.notebook.find_cell_index(cell));
            highlight_toc_item("toc_link_click", {
                cell: cell
            });
        }
    };

    //  
    window.addEventListener('popstate', 
        function(e) { 
            if (e.state != null && e.state.back != null) {
                var back_id = e.state.back;
                document.getElementById(back_id).scrollIntoView(true)
                if (liveNotebook) {
                    var cell = $(document.getElementById(back_id)).closest('.cell').data('cell');
                    Jupyter.notebook.select(Jupyter.notebook.find_cell_index(cell));
                    highlight_toc_item("toc_link_click", {
                        cell: cell
                    });
                }
            }
    });

    var make_link = function(h, toc_mod_id) {
        var a = $('<a>')
            .attr({
                'href': h.find('.anchor-link').attr('href'),
                'data-toc-modified-id': toc_mod_id,
            });
        // get the text *excluding* the link text, whatever it may be
        var hclone = h.clone();
        hclone = removeMathJaxPreview(hclone);
        a.html(hclone.html());
        a.on('click', callback_toc_link_click);
        return a;
    };

    function highlight_toc_item(evt, data) {
        var c = $(data.cell.element);
        if (c.length < 1) {
            return;
        }
        var trg_id = c.find('.toc-mod-link').attr('id') ||
            c.prevAll().find('.toc-mod-link').eq(-1).attr('id');
        var highlighted_item = $();
        if (trg_id !== undefined) {
            highlighted_item = $('.toc a').filter(function(idx, elt) {
                return $(elt).attr('data-toc-modified-id') === trg_id;
            });
        }
        if (evt.type === 'execute') {
            // remove the selected class and add execute class
            // if the cell is selected again, it will be highligted as selected+running
            highlighted_item.removeClass('toc-item-highlight-select').addClass('toc-item-highlight-execute');
        } else {
            $('.toc .toc-item-highlight-select').removeClass('toc-item-highlight-select');
            highlighted_item.addClass('toc-item-highlight-select');
        }
    }

    var create_navigate_menu = function(cfg, callback) {
        $('#kernel_menu').parent().after('<li id="Navigate"/>')
        $('#Navigate').addClass('dropdown').append($('<a/>').attr('href', '#').attr('id', 'Navigate_sub'))
        $('#Navigate_sub').text('Navigate').addClass('dropdown-toggle').attr('data-toggle', 'dropdown')
        $('#Navigate').append($('<ul/>').attr('id', 'Navigate_menu').addClass('dropdown-menu')
            .append($("<div/>").attr("id", "navigate_menu").addClass('toc')))

        if (cfg['nav_menu']) {
            $('#Navigate_menu').css(cfg['nav_menu'])
            $('#navigate_menu').css('width', $('#Navigate_menu').css('width'))
            $('#navigate_menu').css('height', $('#Navigate_menu').height())
        } else {
            cfg.nav_menu = {};
            events.on("before_save.Notebook",
                function() {
                    try {
                        cfg.nav_menu['width'] = $('#Navigate_menu').css('width')
                        cfg.nav_menu['height'] = $('#Navigate_menu').css('height')
                    } catch (e) {
                        console.log("[toc2] Error in metadata (navigation menu) - Proceeding", e)
                    }
                })
        }

        $('#Navigate_menu').resizable({
            resize: function(event, ui) {
                $('#navigate_menu').css('width', $('#Navigate_menu').css('width'))
                $('#navigate_menu').css('height', $('#Navigate_menu').height())
            },
            stop: function(event, ui) {
                cfg.nav_menu['width'] = $('#Navigate_menu').css('width')
                cfg.nav_menu['height'] = $('#Navigate_menu').css('height')
            }
        })

        callback && callback();
    }

    function setNotebookWidth(cfg, st) {
        var margin = 20;
        var nb_inner = $('#notebook-container');
        var nb_wrap_w = $('#notebook').width();
        var sidebar = $('#toc-wrapper');
        var visible_sidebar = cfg.sideBar && sidebar.is(':visible');
        var sidebar_w = visible_sidebar ? sidebar.outerWidth() : 0;
        var available_space = nb_wrap_w - 2 * margin - sidebar_w;
        var inner_css = {marginLeft: '', width: ''};
        if (cfg.widenNotebook) {
            inner_css.width = available_space;
        }
        if (visible_sidebar) {
            var nb_inner_w = nb_inner.outerWidth();
            inner_css.marginLeft = sidebar_w + margin; // shift notebook rightward to fit the sidebar in
            if (available_space <= nb_inner_w) {
                inner_css.width = available_space; // also slim notebook to fit sidebar
            }
        }
        nb_inner.css(inner_css);
    }

    var saveTocPosition = function () {
        var toc_wrapper = $('#toc-wrapper');
        var new_values = toc_wrapper.hasClass('sidebar-wrapper') ? ['width'] : ['left', 'top', 'height', 'width'];
        $.extend(toc_position, toc_wrapper.css(new_values));
        setMd('toc_position', toc_position);
    };

    var makeUnmakeMinimized = function (cfg, animate) {
        var open = cfg.sideBar || cfg.toc_section_display;
        var new_css, wrap = $('#toc-wrapper');
        var anim_opts = {duration: animate ? 'fast' : 0};
        if (open) {
            $('#toc').show();
            new_css = cfg.sideBar ? {} : {height: toc_position.height, width: toc_position.width};
        }
        else {
            new_css = {
                height: wrap.outerHeight() - wrap.find('#toc').outerHeight(),
            };
            anim_opts.complete = function () {
                $('#toc').hide();
                $('#toc-wrapper').css('width', '');
            };
        }
        wrap.toggleClass('closed', !open)
            .animate(new_css, anim_opts)
            .find('.hide-btn').attr('title', open ? 'Hide ToC' : 'Show ToC');
        return open;
    };

    var makeUnmakeSidebar = function (cfg) {
        var make_sidebar = cfg.sideBar;
        var wrap = $('#toc-wrapper')
            .toggleClass('sidebar-wrapper', make_sidebar)
            .toggleClass('float-wrapper', !make_sidebar)
            .resizable('option', 'handles', make_sidebar ? 'e' : 'all');
        wrap.children('.ui-resizable-se').toggleClass('ui-icon', !make_sidebar);
        wrap.children('.ui-resizable-e').toggleClass('ui-icon ui-icon-grip-dotted-vertical', make_sidebar);
        if (make_sidebar) {
            var sidebar_top = liveNotebook ? document.getElementById('site').top : 0
            wrap.css({top: sidebar_top,height: "",left: 0});
        }
        else {
            wrap.css({height: toc_position.height});
        }
        setNotebookWidth(cfg);
    };

    var create_toc_div = function(cfg, st) {

        var callbackPageResize = function (evt) {
            setNotebookWidth(cfg);
        };

        var toc_wrapper = $('<div id="toc-wrapper"/>')
            .css('display', 'none')
            .append(
                $('<div id="toc-header"/>')
                .append('<span class="header"/>')
                .append(
                    $('<i class="fa fa-fw hide-btn" title="Hide ToC">')
                    .on('click', function (evt) {
                        cfg.toc_section_display = setMd('toc_section_display', !cfg.toc_section_display);
                        makeUnmakeMinimized(cfg, true);
                    })
                ).append(
                    $('<i class="fa fa-fw fa-refresh" title="Reload ToC">')
                    .on('click', function(evt) {
                        var icon = $(evt.currentTarget).addClass('fa-spin');
                        table_of_contents(cfg, st);
                        icon.removeClass('fa-spin');
                    })
                ).append(
                    $('<i class="fa fa-fw fa-cog" title="ToC settings"/>')
                    .on('click', function(evt) {
                        show_settings_dialog(cfg, st);
                    })
                )
            ).append(
                $("<div/>").attr("id", "toc").addClass('toc')
            )
            .prependTo(liveNotebook ? '#site' : document.body);

        // enable dragging and save position on stop moving
        toc_wrapper.draggable({
            drag: function(event, ui) {
                var make_sidebar = ui.position.left < 20; // 20 is snapTolerance
                if (make_sidebar) {
                    ui.position.top = liveNotebook ? document.getElementById('site').top : 0
                    ui.position.left = 0;
                }
                if (make_sidebar !== cfg.sideBar) {
                    cfg.toc_section_display = setMd('toc_section_display', true);
                    cfg.sideBar = setMd('sideBar', make_sidebar);
                    makeUnmakeMinimized(cfg);
                    makeUnmakeSidebar(cfg);
                }
            }, //end of drag function
            stop: saveTocPosition,
            containment: 'parent',
            snap: 'body, #site',
            snapTolerance: 20,
        });

        toc_wrapper.resizable({
            handles: 'all',
            resize: function(event, ui) {
                if (cfg.sideBar) {
                    // unset the height set by jquery resizable
                    $('#toc-wrapper').css('height', '');
                    setNotebookWidth(cfg, st)
                }
            },
            start: function(event, ui) {
                if (!cfg.sideBar) {
                    cfg.toc_section_display = setMd('toc_section_display', true);
                    makeUnmakeMinimized(cfg);
                }
            },
            stop: saveTocPosition,
            containment: 'parent',
            minHeight: 100,
            minWidth: 165,
        });

        // On header/menu/toolbar resize, resize the toc itself
        $(window).on('resize', callbackPageResize);
        if (liveNotebook) {
            events.on("resize-header.Page toggle-all-headers", callbackPageResize);
            $.extend(toc_position, IPython.notebook.metadata.toc.toc_position);
        }
        else {
            // default to true for non-live notebook
            cfg.toc_window_display = true;
        }
        // restore toc position at load
        toc_wrapper.css(cfg.sideBar ? {width: toc_position.width} : toc_position);
        // older toc2 versions stored string representations, so update those
        if (cfg.toc_window_display === 'none') {
            cfg.toc_window_display = setMd('toc_window_display', false);
        }
        if (cfg.toc_section_display === 'none') {
            cfg.toc_section_display = setMd('toc_section_display', false);
        }
        toc_wrapper.toggle(cfg.toc_window_display);
        makeUnmakeSidebar(cfg);
        $("#toc_button").toggleClass('active', cfg.toc_window_display);
        if (!cfg.toc_section_display) {
            makeUnmakeMinimized(cfg);
        }
    };

    //----------------------------------------------------------------------------
    // on scroll - mark the toc item corresponding to the first header visible in
    // the viewport with 'highlight_on_scroll' class
    // some elements from https://stackoverflow.com/questions/20791374/jquery-check-if-element-is-visible-in-viewport
    function highlightTocItemOnScroll(cfg, st) {
        if (cfg.markTocItemOnScroll) {
            var scrolling_elt = liveNotebook ? '#site' : window
            $(scrolling_elt).scroll(function() {
                var headerVisibleHeight = $('#header').is(':visible') ? $('#header').height() : 0
                var headerHeight = liveNotebook ? headerVisibleHeight : 0
                var bottom_of_screen = $(window).scrollTop() + $(scrolling_elt).height() + headerHeight;
                var top_of_screen = $(window).scrollTop() + headerHeight;
                //loop over all headers
                all_headers.each(function(i, h) {
                    var top_of_element = $(h).offset().top;

                    if ((bottom_of_screen > top_of_element) && (top_of_screen < top_of_element)) {
                        // The element is visible
                        var trg_id = $(h).attr('data-toc-modified-id')
                        if (trg_id !== undefined) {
                            var highlighted_item = $('#toc a').filter(function(idx, elt) {
                                return $(elt).attr('data-toc-modified-id') === trg_id;
                            });
                            $('#toc .highlight_on_scroll').removeClass('highlight_on_scroll')
                            highlighted_item.parent().addClass('highlight_on_scroll')
                        }
                        return false;
                    } else {
                        // The element is not visible
                        // If the current header is already below the viewport then break
                        if (bottom_of_screen < top_of_element) return false
                        else return
                    }
                })
            });
        }
    }
    //----------------------------------------------------------------------------
    // TOC CELL -- if cfg.toc_cell=true, add and update a toc cell in the notebook.
    //             This cell, initially at the very beginning, can be moved.
    //             Its contents are automatically updated.
    //             Optionnaly, the sections in the toc can be numbered.

    function process_cell_toc(cfg, st) {
        var new_html = '<h1>' +
            $('<div>').text(cfg.title_cell).html() + '<span class="tocSkip"></span></h1>\n' +
            '<div class="toc">' +
            $('#toc').html() +
            '</div>';
        if (!liveNotebook) {
            if (cfg.toc_cell) {
                $('.cell > .toc').parent(':has(.tocSkip)')
                    .html(new_html)
                    .find('.toc-item li a')
                        .on('click', callback_toc_link_click);
            }
            return;
        }
        var cell_toc;
        // look for a possible toc cell
        var cells = IPython.notebook.get_cells();
        var lcells = cells.length;
        for (var i = 0; i < lcells; i++) {
            if (cells[i].metadata.toc) {
                // delete if we don't want it
                if (!cfg.toc_cell) {
                    return IPython.notebook.delete_cell(i);
                }
                cell_toc = cells[i];
                break;
            }
        }
        //if toc_cell=true, we want a cell_toc.
        //  If it does not exist, create it at the beginning of the notebook
        if (cfg.toc_cell) {
            if (cell_toc === undefined) {
                // set rendering_toc_cell flag to avoid loop on insert_cell_above
                rendering_toc_cell = true;
                cell_toc = IPython.notebook.insert_cell_above('markdown', 0);
                cell_toc.metadata.toc = true;
                rendering_toc_cell = false;
            }
            // set rendering_toc_cell flag to avoid loop on render
            rendering_toc_cell = true;
            cell_toc.set_text(new_html);
            cell_toc.render();
            rendering_toc_cell = false;
            cell_toc.element.find('.toc-item li a').on('click', callback_toc_link_click);
        }
    } //end function process_cell_toc --------------------------

    var collapse_by_id = function(trg_id, show, trigger_event) {
        var anchors = $('.toc .toc-item > li > span > a').filter(function(idx, elt) {
            return $(elt).attr('data-toc-modified-id') === trg_id;
        });
        anchors.siblings('i')
            .toggleClass('fa-caret-right', !show)
            .toggleClass('fa-caret-down', show);
        anchors.parent().siblings('ul')[show ? 'slideDown' : 'slideUp']('fast');
        if (trigger_event !== false) {
            // fire event for collapsible_heading to catch
            var cell = $(document.getElementById(trg_id)).closest('.cell').data('cell');
            events.trigger((show ? 'un' : '') + 'collapse.Toc', {
                cell: cell
            });
        }
    };

    var callback_toc2_collapsible_headings = function(evt, data) {
        var trg_id = data.cell.element.find(':header').filter(function(idx, elt) {
            return Boolean($(elt).attr('data-toc-modified-id'));
        }).attr('data-toc-modified-id');
        var show = evt.type.indexOf('un') >= 0;
        // use trigger_event false to avoid re-triggering collapsible_headings
        collapse_by_id(trg_id, show, false);
    };

    var callback_collapser = function(evt) {
        var clicked_i = $(evt.currentTarget);
        var trg_id = clicked_i.siblings('a').attr('data-toc-modified-id');
        var show = clicked_i.hasClass('fa-caret-right');
        collapse_by_id(trg_id, show);
    };

    // Table of Contents =================================================================
    var table_of_contents = function(cfg, st) {

        // if this call is a result of toc_cell rendering, do nothing to avoid
        // looping, as we're already in a table_of_contents call
        if (rendering_toc_cell) {
            return
        }

        // In a live notebook, read_config will have been called already, but
        // in non-live notebooks, ensure that all config values are defined.
        if (!liveNotebook) {
            cfg = $.extend(true, {}, default_cfg, cfg);
        }

        var toc_wrapper = $("#toc-wrapper");
        if (toc_wrapper.length === 0) { // toc window doesn't exist at all
            create_toc_div(cfg, st); // create it
            highlightTocItemOnScroll(cfg, st); // initialize highlighting on scroll
        }
        var ul = $('<ul/>').addClass('toc-item');

        // update sidebar/window title
        $('#toc-header > .header').text(cfg.title_sidebar + ' ');

        // update toc element
        $("#toc").empty().append(ul);

        process_table(cfg, ul, cfg);

    }

    var process_table = function(cfg, ul, tablecfg) {

        var depth = 1;
        // update all headers with id that are in rendered text cell outputs,
        // excepting any header which contains an html tag with class 'tocSkip'
        // eg in ## title <a class='tocSkip'>,
        // or the ToC cell.
        all_headers = $('.text_cell_render').find( tablecfg.dom_search_pattern.split(",").map(x => x+":not(:has(.tocSkip))").join(",") );
        var min_lvl = 1 + Number(Boolean(cfg.skip_h1_title)),
            lbl_ary = [];
        for (; min_lvl <= 6; min_lvl++) {
            if (all_headers.is('h' + min_lvl)) {
                break;
            }
        }
        lbl_ary[0] = cfg.base_numbering-1 // begin numbering at base_numbering
        for (var i = min_lvl+1; i <= 6; i++) {
            lbl_ary[i - min_lvl] = 0;
        }

        //loop over all headers
        all_headers.each(function(i, h) {
            // remove pre-existing number
            $(h).children('.toc-item-num').remove();

            if (tablecfg.analyse_level) {
                var level = parseInt(h.tagName.slice(1), 10) - min_lvl + 1;
                // skip below threshold, or h1 ruled out by cfg.skip_h1_title
                if (level < 1 || level > cfg.threshold) {
                    return;
                }
            } else {
                var level = 1;
            }
            h = $(h);
            // numbered heading labels
            var num_str = tablecfg.section_number_prefix+incr_lbl(lbl_ary, level - 1).join('.');
            if (tablecfg.number_sections) {
                $('<span>')
                    .text(num_str + '\u00a0\u00a0')
                    .addClass('toc-item-num')
                    .prependTo(h);
            }

            // walk down levels
            for (; depth < level; depth++) {
                var li = ul.children('li:last-child');
                if (li.length < 1) {
                    li = $('<li>').appendTo(ul);
                }
                ul = $('<ul class="toc-item">').appendTo(li);
            }
            // walk up levels
            for (; depth > level; depth--) {
                ul = ul.parent().closest('.toc-item');
            }

            var toc_mod_id = h.attr('id') + '-' + num_str;
            h.attr('data-toc-modified-id', toc_mod_id);
            // add an anchor with modified id (if it doesn't already exist)
            h.children('.toc-mod-link').remove();
            $('<a>').addClass('toc-mod-link').attr('id', toc_mod_id).prependTo(h);

            // Create toc entry, append <li> tag to the current <ol>.
            ul.append(
                $('<li>').append(
                    $('<span>').append(
                        make_link(h, toc_mod_id))));
        });

        // update navigation menu
        if (cfg.navigate_menu) {
            var pop_nav = function() { //callback for create_nav_menu
                $('#navigate_menu').empty().append($('#toc > .toc-item').clone());
            }
            if ($('#Navigate_menu').length == 0) {
                create_navigate_menu((liveNotebook ? IPython.notebook.metadata.toc : cfg), pop_nav);
            } else {
                pop_nav()
            }
        } else { // If navigate_menu is false but the menu already exists, then remove it
            if ($('#Navigate_menu').length > 0) $('#Navigate_sub').remove()
        }

        // if cfg.toc_cell=true, find/add and update a toc cell in the notebook.
        process_cell_toc(tablecfg);

        // add collapse controls
        $('<i>')
            .addClass('fa fa-fw fa-caret-down')
            .on('click', callback_collapser) // callback
            .prependTo('.toc li:has(ul) > span'); // only if li has descendants
        $('<i>').addClass('fa fa-fw ').prependTo('.toc li:not(:has(ul)) > span'); // otherwise still add <i> to keep things aligned

        events[cfg.collapse_to_match_collapsible_headings ? 'on' : 'off'](
            'collapse.CollapsibleHeading uncollapse.CollapsibleHeading', callback_toc2_collapsible_headings);
    };

    var toggle_toc = function(cfg, st) {
        // toggle draw (first because of first-click behavior)
        var wrap = $("#toc-wrapper");
        var show = wrap.is(':hidden');
        wrap.toggle(show);
        cfg['toc_window_display'] = setMd('toc_window_display', show);
        setNotebookWidth(cfg);
        table_of_contents(cfg);
        $("#toc_button").toggleClass('active', show);
    };

    var show_settings_dialog = function (cfg, st) {

        var callback_setting_change = function (evt) {
            var input = $(evt.currentTarget);
            var md_key = input.attr('tocMdKey');
            cfg[md_key] = setMd(md_key, input.attr('type') == 'checkbox' ? Boolean(input.prop('checked')) : input.val());
            table_of_contents(cfg, st);
        };
        var build_setting_input = function (md_key, md_label, input_type) {
            var opts = liveNotebook ? IPython.notebook.metadata.toc : cfg;
            var id = 'toc-settings-' + md_key;
            var fg = $('<div>').append(
                $('<label>').text(md_label).attr('for', id));
            var input = $('<input/>').attr({
                type: input_type || 'text', id: id, tocMdKey: md_key,
            }).on('change', callback_setting_change);
            if (input_type == 'checkbox') {
                fg.addClass('checkbox');
                input
                    .prop('checked', opts[md_key])
                    .prependTo(fg.children('label'));
            }
            else {
                fg.addClass('form-group');
                input
                    .addClass('form-control')
                    .val(opts[md_key])
                    .appendTo(fg);
            }
            return fg;
        };

        var modal = $('<div class="modal fade" role="dialog"/>');
        var dialog_content = $("<div/>")
            .addClass("modal-content")
            .appendTo($('<div class="modal-dialog">').appendTo(modal));
        $('<div class="modal-header">')
            .append('<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>')
            .append('<h4 class="modal-title">ToC2 settings</h4>')
            .on('mousedown', function() { $('.modal').draggable({handle: '.modal-header'});})
            .appendTo(dialog_content);
        $('<div>')
            .addClass('modal-body')
            .append([
                $('<div>').text(
                    'These settings apply to this notebook only, and are stored in its metadata. ' +
                    liveNotebook ? 'The defaults for new notebooks can be edited from the nbextensions configurator.' :
                    'The settings won\'t persist in non-live notebooks though.'),
                build_setting_input('number_sections', 'Automatically number headings', 'checkbox'),
                build_setting_input('skip_h1_title', 'Leave h1 items out of ToC', 'checkbox'),
                build_setting_input('analyse_level', 'Show hierarchy in headings', 'checkbox'),
                build_setting_input('base_numbering', 'Begin numbering at'),
                build_setting_input('section_number_prefix', 'Add a prefix to section numbers'),
                build_setting_input('toc_cell', 'Add notebook ToC cell', 'checkbox'),
                build_setting_input('title_cell', 'ToC cell title'),
                build_setting_input('title_sidebar', 'Sidebar/window title'),
                build_setting_input('sideBar', 'Display as a sidebar (otherwise as a floating window)', 'checkbox'),
                build_setting_input('toc_window_display', 'Display ToC window/sidebar at startup', 'checkbox'),
                build_setting_input('toc_section_display', 'Expand window/sidebar at startup', 'checkbox'),
                build_setting_input('dom_search_pattern', 'Find headings in document based on the following dom pattern')
            ])
            .appendTo(dialog_content);
        $('<div class="modal-footer">')
            .append('<button class="btn btn-default btn-sm btn-primary" data-dismiss="modal">Ok</button>')
            .appendTo(dialog_content);
        // focus button on open
        modal.on('shown.bs.modal', function () {
            setTimeout(function () {
                dialog_content.find('.modal-footer button').last().focus();
            }, 0);
        });

        if (liveNotebook) {
            Jupyter.notebook.keyboard_manager.disable();
            modal.on('hidden.bs.modal', function () {
                modal.remove(); // destroy modal on hide
                Jupyter.notebook.keyboard_manager.enable();
                Jupyter.notebook.keyboard_manager.command_mode();
                var cell = Jupyter.notebook.get_selected_cell();
                if (cell) cell.select();
            });
        }

        // Try to use bootstrap modal, but bootstrap's js may not be available
        // (e.g. as in non-live notebook), so we provide a poor-man's version
        try {
            return modal.modal({backdrop: 'static'});
        }
        catch (err) {
            // show the backdrop
            $(document.body).addClass('modal-open');
            var $backdrop = $('<div class="modal-backdrop fade">').appendTo($(document.body));
            $backdrop[0].offsetWidth; // force reflow
            $backdrop.addClass('in');
            // hook up removals
            modal.on('click', '[data-dismiss="modal"]', function modal_close() {
                // hide the modal foreground
                modal.removeClass('in');
                setTimeout(function on_foreground_hidden() {
                    modal.remove();
                    // now hide the backdrop
                    $backdrop.removeClass('in');
                    // wait for transition
                    setTimeout(function on_backdrop_hidden() {
                        $(document.body).removeClass('modal-open');
                        $backdrop.remove();
                    }, 150);
                }, 300);
            });
            // wait for transition
            setTimeout(function () {
                // now show the modal foreground
                modal.appendTo(document.body).show().scrollTop(0);
                modal[0].offsetWidth; // force reflow
                modal.addClass('in');
                // wait for transition, then trigger callbacks
                setTimeout(function on_foreground_shown() {
                    modal.trigger('shown.bs.modal');
                }, 300);
            }, 150);
            return modal;
        }
    };

    return {
        highlight_toc_item: highlight_toc_item,
        table_of_contents: table_of_contents,
        toggle_toc: toggle_toc,
        read_config: read_config,
    };
});
// export table_of_contents to global namespace for backwards compatibility
// Do export synchronously, so that it's defined as soon as this file is loaded
if (!requirejs.specified('base/js/namespace')) {
    window.table_of_contents = function(cfg, st) {
        "use strict";
        // use require to ensure the module is correctly loaded before the
        // actual call is made
        requirejs(['nbextensions/toc2/toc2'], function(toc2) {
            toc2.table_of_contents(cfg, st);
        });
    };
}
