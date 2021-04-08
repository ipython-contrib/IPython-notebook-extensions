Jupyter TabNine
==========
This extension provides code auto-completion based on deep learning.

* Author: Wenmin Wu
* Repository: https://github.com/wenmin-wu/jupyter-tabnine
* Email: wuwenmin1991@gmail.com

Options
-------

* `jupyter_tabnine.before_line_limit`:
   maximum number of lines before for context generation,
   too many lines will slow down the request. -1 means Infinity,
   thus the lines will equal to number of lines before current line.

* `jupyter_tabnine.after_line_limit`:
   maximum number of lines after for context generation,
   too many lines will slow down the request. -1 means Infinity,
   thus the lines will equal to number of lines after current line.

* `jupyter_tabnine.options_limit`:
   maximum number of options that will be shown

* `jupyter_tabnine.assist_active`:
   Enable continuous code auto-completion when notebook is first opened, or
   if false, only when selected from extensions menu.

* `jupytertabnine.assist_delay`:
   delay in milliseconds between keypress & completion request.

* `jupyter_tabnine.remote_server_url`:
   remote server url, you may want to use a remote server to handle client request.
   This can spped up the request handling depending on the server configuration. Refer to [repo doc](https://github.com/wenmin-wu/jupyter-tabnine) to see how to deploy remote server.