Rope Refactor
==============

Enables some basic python refactorings using rope (https://github.com/python-rope/rope). Includes inline, extract variable, extract method, rename.


Usage
-----

Requires both the server and nbextension.
Installation:
```
jupyter nbextension install --py rope_refactor_server.rope_refactor_server --sys-prefix
jupyter nbextension enable --py rope_refactor_server.rope_refactor_server --sys-prefix
jupyter serverextension enable --py rope_refactor_server.rope_refactor_server --sys-prefix
```


Options
-------

### Hotkeys
These options define the hotkeys for each of the actions.

### Add toolbar button
If checked, buttons will show in the toolbar, one for each refactoring action. Off by default.

### Icons
If Add toolbar button is checked, these icons will be used for them.

Internals
---------

For the rope_refactor nbextension, I re-used/adapted code from code_prettify's kernel_exec_on_cells.js file. I ended up using a serverextension instead of the notebook kernel to evaluate python code though, so I didn't use that part.

Installation:
jupyter nbextension install --py rope_refactor_server.rope_refactor_server --sys-prefix
jupyter nbextension enable --py rope_refactor_server.rope_refactor_server --sys-prefix
jupyter serverextension enable --py rope_refactor_server.rope_refactor_server --sys-prefix