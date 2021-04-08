// Adds a button to hide the input part of the currently selected cells

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

    var params = {
        hide_celltoolbar: true
    };
    
    var toggle_selected_input = function () {
        // Find the selected cell
        var cell = Jupyter.notebook.get_selected_cell();
        // Toggle visibility of the input div
        cell.metadata.hide_input = ! cell.metadata.hide_input;
        if(Jupyter.notebook.metadata.hide_cellprompt){
                cell.element.find("div.input > div.inner_cell > div.input_area").show();
                if(cell.metadata.hide_input){
                    cell.element.find("div.input").hide('slow');
                    cell.element.find("div.input_prompt").css('visibility', 'hidden');
                }else{
                    cell.element.find("div.input").show('slow');
                    cell.element.find("div.input_prompt").css('visibility', 'visible');
                }
                
        }else{
            cell.element.find("div.input").show();
            cell.element.find("div.input > div.inner_cell > div.input_area").toggle('slow');

            if(cell.metadata.hide_input){
                cell.element.find("div.input_prompt").css('visibility', 'hidden');
            }else{
                cell.element.find("div.input_prompt").css('visibility', 'visible');
            }
        }
    };

    var update_input_visibility = function () {
        Jupyter.notebook.get_cells().forEach(function(cell) {
            if (cell.metadata.hide_input) {
                if(Jupyter.notebook.metadata.hide_cellprompt){
                    cell.element.find("div.input > div.inner_cell > div.input_area").show();
                    cell.element.find("div.input_prompt").css('visibility', 'visible');
                    cell.element.find("div.input").hide();
                }else{
                    cell.element.find("div.input").show();
                    cell.element.find("div.input > div.inner_cell > div.input_area").hide();
                    cell.element.find("div.input_prompt").css('visibility', 'hidden');
                }
            }else{
                cell.element.find("div.input").show();
                cell.element.find("div.input > div.inner_cell > div.input_area").show();
                cell.element.find("div.input_prompt").css('visibility', 'visible');
            }
        });
    };

    var add_toogle_Celltoolbar_button = function () {
        $("#view_menu").append('<li id="toggle_celltoolbar" title="Display of hide the celltoolbar for cells which where hidden by the \'hide input\' or \'hide input all\' extensions"><a href="#"><i class="menu-icon fa fa-eye-slash pull-left"></i>show/hide celltoobar for hidden inputs</a></li>');
        $("#view_menu > li#toggle_celltoolbar > a").click(function(){
            Jupyter.notebook.metadata.hide_cellprompt = !Jupyter.notebook.metadata.hide_cellprompt
            $("#view_menu > li#toggle_celltoolbar > a > i").toggleClass('fa-eye-slash', Jupyter.notebook.metadata.hide_cellprompt);
            $("#view_menu > li#toggle_celltoolbar > a > i").toggleClass('fa-eye', !Jupyter.notebook.metadata.hide_cellprompt);
            update_input_visibility();
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
        // Add a button to the toolbar
        $(Jupyter.toolbar.add_buttons_group([
            Jupyter.keyboard_manager.actions.register({
                help   : 'Toggle selected cell input display',
                icon   : 'fa-chevron-up',
                handler: function() {
                    toggle_selected_input();
                    setTimeout(function() { $('#btn-hide-input').blur(); }, 500);
                }
            }, 'toggle-cell-input-display', 'hide_input')
        ])).find('.btn').attr('id', 'btn-hide-input');
        
        // Add a checkbox menu for the hide celltoolbar
        if( $("#view_menu > li#toggle_celltoolbar").length == 0){
            add_toogle_Celltoolbar_button();
            events.on("notebook_loaded.Notebook", function(){
                if(Jupyter.notebook.metadata.hide_cellprompt === undefined){
                    update_default_config();
                }else{
                    update_input_visibility();
                }
            });
        }else{
            update_input_visibility();
            events.on("notebook_loaded.Notebook", function(){
                update_input_visibility();
            });
        }
    };

    return {
        load_ipython_extension : load_ipython_extension
    };
});
