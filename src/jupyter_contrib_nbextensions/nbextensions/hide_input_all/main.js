// toggle display of all code cells' inputs

define([
    'jquery',
    'base/js/namespace',
    'base/js/events',
    'base/js/utils',
    'services/config'
], function(
    $,
    Jupyter,
    events,
    utils,
    configmod
) {
    "use strict";

    function set_input_visible(show) {
        Jupyter.notebook.metadata.hide_input = !show;

        if (show){
            if(Jupyter.notebook.metadata.hide_cellprompt){
                $('div.input').show('slow');
            }else{
                $('div.input > div.inner_cell > div.input_area').show('slow');
                $('div.input_prompt').css('visibility','visible');
            }
        }else{
            if(Jupyter.notebook.metadata.hide_cellprompt){
                $('div.input').hide('slow');
                $('div.input_prompt').css('visibility','visible');
                $('div.input > div.inner_cell > div.input_area').show();
            }else{
                $('div.input').show();
                $('div.input_prompt').css('visibility','hidden');
                $('div.input > div.inner_cell > div.input_area').hide('slow');
            }
        }

        var btn = $('#toggle_codecells');
        btn.toggleClass('active', !show);

        var icon = btn.find('i');
        icon.toggleClass('fa-eye', show);
        icon.toggleClass('fa-eye-slash', !show);
        $('#toggle_codecells').attr(
            'title', (show ? 'Hide' : 'Show') + ' codecell inputs');
    }

    function toggle() {
        set_input_visible($('#toggle_codecells').hasClass('active'));
    }

    function initialize () {
        if(Jupyter.notebook.metadata.hide_input) set_input_visible(true);
    }

    var add_toogle_Celltoolbar_button = function () {
        $("#view_menu").append('<li id="toggle_celltoolbar" title="Display of hide the celltoolbar for cells which where hidden by the \'hide input\' or \'hide input all\' extensions"><a href="#"><i class="menu-icon fa fa-eye-slash pull-left"></i>show/hide celltoobar for hidden inputs</a></li>');
        $("#view_menu > li#toggle_celltoolbar > a").click(function(){
            Jupyter.notebook.metadata.hide_cellprompt = !Jupyter.notebook.metadata.hide_cellprompt
            $("#view_menu > li#toggle_celltoolbar > a > i").toggleClass('fa-eye-slash', Jupyter.notebook.metadata.hide_cellprompt);
            $("#view_menu > li#toggle_celltoolbar > a > i").toggleClass('fa-eye', !Jupyter.notebook.metadata.hide_cellprompt);
            console.log("Toogle hide_cellprompt",Jupyter.notebook.metadata.hide_cellprompt);
            initialize();
        });
    }
    
    var update_default_config = function () {
        Jupyter.notebook.metadata.hide_cellprompt = true;
        var params = $.extend(true, params, Jupyter.notebook.config.data.hide_input);
        Jupyter.notebook.metadata.hide_cellprompt = params.hide_celltoolbar;
        $("#view_menu > li#toggle_celltoolbar > a > i").toggleClass('fa-eye-slash', Jupyter.notebook.metadata.hide_cellprompt);
        $("#view_menu > li#toggle_celltoolbar > a > i").toggleClass('fa-eye', !Jupyter.notebook.metadata.hide_cellprompt);        
        update_input_visibility();
        events.on("notebook_loaded.Notebook", update_input_visibility);
    };
    
    var load_ipython_extension = function() {
        $(Jupyter.toolbar.add_buttons_group([
            Jupyter.keyboard_manager.actions.register({
                help   : 'Hide codecell inputs',
                icon   : 'fa-eye',
                handler: function() {
                    toggle();
                    setTimeout(function() { $('#toggle_codecells').blur(); }, 500);
                }
            }, 'hide-codecell-inputs', 'hide_input_all'),

            ])).find('.btn').attr('id', 'toggle_codecells');
        
        if( $("#view_menu > li#toggle_celltoolbar").length == 0){
            console.log("Add toggle celltoolbar button by the hide_input_all library");
            add_toogle_Celltoolbar_button();
            if(Jupyter.notebook.metadata.hide_cellprompt === undefined){
                events.on("notebook_loaded.Notebook", update_default_config);
            }else{
                initialize();
            }
        }else{
            initialize();
        }
        events.on("notebook_loaded.Notebook", initialize);
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});
