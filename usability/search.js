//----------------------------------------------------------------------------
//  Copyright (C) 2014  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

// Simple search extension based on codemirror addon.
// Adds a search box to the notebook toolbar and selects search word if found

require(['/static/components/codemirror/addon/search/search.js']);
require(['/static/components/codemirror/addon/search/searchcursor.js']);

"using strict";

search_replace_toolbar = function() {

    search = function(hotkey) {
    if (hotkey != 0 && hotkey != 13) {            
        return false;
    }
    
        var cell = IPython.notebook.get_selected_cell();
        if (cell.rendered == true && cell.cell_type == "markdown" ) cell.unrender();

        var findString = IPython.toolbar.element.find('#search').val();
        var cur = cell.code_mirror.getCursor();

        if(cell.element.find('#RegExp').val() == "ON"){
                findString = new RegExp(findString);
        }
        var find = cell.code_mirror.getSearchCursor(findString,cur, $('#menubar-container').find('#CaseSensitive').val()=="OFF");
        if (find.find() == true) {
            cell.code_mirror.setSelection(find.pos.from,find.pos.to);
            cell.code_mirror.focus();
        } else {
            var ncells = IPython.notebook.ncells();
            if ( IPython.notebook.get_selected_index()+1 == ncells) {
                cell.code_mirror.focus();
            } else {
                IPython.notebook.select_next();
                IPython.notebook.edit_mode();                
                cell.code_mirror.setCursor({line:0, ch:0});
                return search(hotkey);
            }
        }
    };
 
    var celltoolbar = IPython.toolbar.element;
  
        var search_group = $('<div/>').addClass("btn-group");
            var input = $('<input id="search" >')
                .addClass("inpt")
                .attr("Title","Search for text")
                .on('keyup', function(event) { search(event.keyCode);});
            search_group.append(input);

            var button = $('<button/>')
                .addClass("btn")
                .attr("Title","Search for text")
                .text("Search")
                .click( function() {search(0);});
            search_group.append(button);

            var button = $('<button data-toggle="button" id="CaseSensitive" value="OFF"/>')
                .addClass("btn")
                .attr("Title","Upper-/lowercase sensitive")
                .text("A/a")
                .click( function() {
                    var t = $(this).val();
                    if (t == "ON") {t = "OFF"} else {t = "ON"};                
                    $(this).val(t);
                });
            search_group.append(button);

            var button = $('<button data-toggle="button" id="RegExp" value="OFF"/>')
                .addClass("btn")
                .attr("Title","Regular expression search")
                .text("RegEx")
                .click( function() {
                    var t = $(this).val();
                    if (t == "ON") {t = "OFF"} else {t = "ON"};                
                    $(this).val(t);
                    });
            search_group.append(button);           
            
        celltoolbar.append(search_group);
}();


