//  Copyright (C) 2013  The IPython Development Team
//
//  Distributed under the terms of the BSD License.  The full license is in
//  the file COPYING, distributed as part of this software.
//----------------------------------------------------------------------------

// add hotkey to comment/uncomment complete lines in codecells
"using strict";

$.getScript('/static/components/codemirror/addon/comment/comment.js')
IPython.hotkeys["Alt-C"] = "comment/uncomment<br>selected lines";

var commentkey = { "Alt-C" : function(cm){toggleComments(cm)}};

function toggleComments(cm) { 
    var from = cm.getCursor("start"), to = cm.getCursor("end");
    cm.uncomment(from, to, {'lineComment': '#'}) || cm.lineComment(from, to, {'lineComment': '#'});
};

/* http://stackoverflow.com/questions/2454295/javascript-concatenate-properties-from-multiple-objects-associative-array */
function collect() {
    var ret = {};
    var len = arguments.length;
    for (var i=0; i<len; i++) {
        for (p in arguments[i]) {
            if (arguments[i].hasOwnProperty(p)) {
                ret[p] = arguments[i][p];
            }
        }
    }
    return ret;
}

/**
 * Register new extraKeys to codemirror for newly created cell
 *
 * @param {Object} event
 * @param {Object} nbcell notebook cell
 */
create_cell = function (event,nbcell,nbindex) {
    var cell = nbcell.cell;
    if (cell.cell_type == "code" ) {
        var keys = cell.code_mirror.getOption('extraKeys');
        cell.code_mirror.setOption('extraKeys', collect(keys, commentkey ));  
    }
};

$([IPython.events]).on('create.Cell',create_cell);
console.log("Comment-uncomment extension loaded correctly");

