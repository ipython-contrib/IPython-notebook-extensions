// Allow codefolding in code cells

"using strict";

define( function () {
    var load_ipython_extension = function () {

        var hotKey = "Alt-F";
        
        function toggleFolding(cm) {
            var pos = cm.getCursor();
            var opts = cm.state.foldGutter.options;
            cm.foldCode(pos, opts.rangeFinder);
        }

        var foldingKey = { "Alt-F" : toggleFolding };

        /**
         * Concatenate associative array objects
         *
         * Source: http://stackoverflow.com/questions/2454295/javascript-concatenate-properties-from-multiple-objects-associative-array
         */
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
         * Update cell metadata whith folding info, so folding state can be restored after reloading notebook
         *
         */
        function update_metadata(cm) {
            var list = cm.getAllMarks();
            var lines = [];
            for (var i = 0; i < list.length; i++) {
                if (list[i].__isFold == true) {
                    var range = list[i].find();
                    lines.push(range.from.line);
                }
            }
            /* User can click on gutter of unselected cells, so make sure we store metadata in the correct cell */
            var cell = IPython.notebook.get_selected_cell();
            if (cell.code_mirror != cm) {
                var cells = IPython.notebook.get_cells();
                for(var i in cells){
                    var cell = cells[i];
                    if (cell.code_mirror == cm ) { break; }
                }
            }
            cell.metadata.code_folding = lines;
        }
               
        /**
         * Activate codefolding in CodeMirror options, don't overwrite other settings
         *
         */
        function cellFolding(cell) {
            if (CodeMirror.fold != undefined) { 
                var keys = cell.code_mirror.getOption('extraKeys');
                cell.code_mirror.setOption('extraKeys', collect(keys, foldingKey ));  
                var mode = cell.code_mirror.getOption('mode');
                if (mode == 'ipython' ) {
                    cell.code_mirror.setOption('foldGutter',{rangeFinder: new CodeMirror.fold.combine(CodeMirror.fold.firstline, CodeMirror.fold.indent) });                        
                } else {
                    cell.code_mirror.setOption('foldGutter',{rangeFinder: new CodeMirror.fold.combine(CodeMirror.fold.firstline, CodeMirror.fold.brace) });            
                }
                var gutters = cell.code_mirror.getOption('gutters');
                    var found = jQuery.inArray("CodeMirror-foldgutter", gutters);
                    if ( found == -1) {
                        cell.code_mirror.setOption('gutters', [ gutters , "CodeMirror-foldgutter"]);
                    }            
                cell.code_mirror.on('fold',update_metadata);
                cell.code_mirror.on('unfold',update_metadata);
            }
        }
        
        /**
         * Add codefolding to new cell
         *
         */
        createCell = function (event,nbcell,nbindex) {
            var cell = nbcell.cell;
            if ((cell instanceof IPython.CodeCell)) {
                cellFolding(cell)            
            }
        };

      var load_css = function (name) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = require.toUrl(name);
        //console.log(link);
        document.getElementsByTagName("head")[0].appendChild(link);
      };    
    load_css("/nbextensions/usability/codefolding/foldgutter.css");
    /**
    * Add codefolding to existing cells
     *
     */
    initExtension = function(event) {
        var cells = IPython.notebook.get_cells();
        for(var i in cells){
            var cell = cells[i];
            if ((cell instanceof IPython.CodeCell)) {
                cellFolding(cell);
                /* restore folding state if previously saved */
                if ( cell.metadata.code_folding != undefined) {
                    for (var idx in cell.metadata.code_folding) {
                        var line = cell.metadata.code_folding[idx];
                        var opts = cell.code_mirror.state.foldGutter.options; 
                        cell.code_mirror.foldCode(CodeMirror.Pos(line, 0), opts.rangeFinder);
                    }            
                }
            }
        }
        $([IPython.events]).on('create.Cell',createCell);
    }
    
    /* load codemirror addon */
    require(['/static/components/codemirror/addon/fold/foldcode.js', 
             '/static/components/codemirror/addon/fold/foldgutter.js',
             '/static/components/codemirror/addon/fold/brace-fold.js',
             '/nbextensions/usability/codefolding/firstline-fold.js'], initExtension)

    };

    return {
        load_ipython_extension : load_ipython_extension,
    };
});


