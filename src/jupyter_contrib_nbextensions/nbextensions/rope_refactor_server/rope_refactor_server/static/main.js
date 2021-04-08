define(['./rope_refactorer'], function (rope_refactorer) {
    function load_ipython_extension() {
        'use strict';

        const mod_name = 'rope_refactor';

        new rope_refactorer.RopeRefactorer(mod_name).initialize_plugin();
    }
    return { load_ipython_extension: load_ipython_extension };
});