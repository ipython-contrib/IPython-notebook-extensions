Hinterland
==========

Enable code autocompletion menu for every keypress in a code cell, instead of
only calling it with tab.

The nbextension adds an item to the help menu to turn auto-hinting on and off,
and offers some options for configuration:


Enabling
-------
* jupyter nbextension enable hinterland/hinterland


Options
-------

* `hinterland.hint_delay`:
  delay in milliseconds between keypress & hint request. This is used to help
  ensure that the character from the keypress is added to the CodeMirror editor
  *before* the hint request checks the character preceding the cursor against
  the regexes below.

* `hinterland.enable_at_start`:
  Whether to enable hinterland's continuous hinting when notebook is first
  opened, or if false, only when selected from the help-menu item.

* `hinterland.hint_inside_comments`:
  Whether to request hints while typing code comments. Defaults to false.

* `hinterland.exclude_regexp`:
  A regular expression tested against the character before the cursor, which,
  if a match occurs, prevents autocompletion from being triggered. This is
  useful, for example, to prevent triggering autocomplete on a colon, which is
  included by the default Completer.reinvoke pattern. If blank, no test is
  performed. Note that the regex will be created without any flags, making it
  case sensitive.

* `hinterland.include_regexp`:
  A regular expression tested against the character before the cursor, which
  must match in order for autocompletion to be triggered. If left blank, the
  value of the notebook's `Completer.reinvoke_re` parameter is used, which can
  be modified by kernels, but defaults to `/[%0-9a-z._/\\:~-]/i`. Note that
  although the `Completer.reinvoke_re` default is case insensitive by virtue of
  its `/i` flag, any regex specified by the user will be created without any
  flags, making it case sensitive.

* `hinterland.tooltip_regexp`:
  A regular expression tested against the character before the cursor, which if
  it matches, causes a tooltip to be triggered, instead of regular
  autocompletion. For python, this is useful for example for function calls, so
  the default regex matches opening parentheses. Note that the regex will be
  created without any flags, making it case sensitive.
