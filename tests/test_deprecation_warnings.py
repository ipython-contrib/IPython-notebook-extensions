import importlib
import os
import sys
import traceback
import warnings


class TracebackWarnings(warnings.catch_warnings):
    """context manager to save tracebacks for warnings."""

    def __init__(self, limit=None):
        """Initialise warnigns context manager."""
        super(TracebackWarnings, self).__init__(record=True)
        self._catch_w = warnings.catch_warnings(record=True)
        self._limit = limit

    def __enter__(self):
        """Replace warning's already-patched method woth our own."""
        log = self._catch_w.__enter__()

        def showwarning(*args, **kwargs):
            log.append((warnings.WarningMessage(*args, **kwargs),
                        traceback.format_stack(limit=self._limit)))
        self._module.showwarning = showwarning
        return log

    def __exit__(self, *exc_info):
        """Make sure to exit warnings' context manager."""
        self._catch_w.__exit__()


def recursively_import_mod(name):
    """(Re)import the module with the given name, plus all its submodules."""
    if name not in sys.modules:
        print('   importing', name)
        mod = importlib.import_module(name)
    else:
        print('re-importing', name)
        mod = importlib.reload(sys.modules[name])
    if os.path.basename(mod.__file__).startswith('__init__.py'):
        for fn in os.listdir(os.path.dirname(mod.__file__)):
            if not (fn.endswith('.py') or fn.endswith('.pyc')):
                continue
            if fn.startswith('__init__.py'):
                continue
            recursively_import_mod(
                name + '.' + os.path.splitext(fn)[0])


def test_deprecation_warnings():
    """Check for warnings (chiefly concerned with deprecation warnings)."""

    component_packages = ('jupyter_contrib_nbextensions',
                          'latex_envs',
                          'jupyter_nbextensions_configurator',
                          'jupyter_highlight_selected_word',)

    # we want to see all traitlets deprecation warnings, so cache & set env var
    _tad = os.environ.get('TRAITLETS_ALL_DEPRECATIONS')
    os.environ['TRAITLETS_ALL_DEPRECATIONS'] = '1'
    with TracebackWarnings(limit=10) as ww:
        # Cause all warnings to always be triggered.
        warnings.simplefilter("always")
        # (Potentially) trigger some deprecation warnings.
        # We reload modules to ensure they actually execute, rather than just
        # get retrieved from sys.modules
        for mname in component_packages:
            recursively_import_mod(mname)

    # restore cached flag
    if _tad is not None:
        os.environ['TRAITLETS_ALL_DEPRECATIONS'] = _tad

    shown = set()
    warning_msgs = ''
    count_own = count_total = 0
    for w, tb in ww:
        msg = "\n\n{}{}: {}\n".format(
            ''.join(tb[6:-2]), w.category.__name__, w.message.args[0])
        if msg in shown:
            continue
        shown.add(msg)
        if 'jupyter_contrib_nbextensions' in w.filename:
            count_own += 1
            count_total += 1
        elif any(p in w.filename for p in component_packages):
            count_total += 1  # print, but don't raise exception
        else:
            continue
        warning_msgs += msg

    if count_own > 0:
        raise Exception(
            'Warning(s) found:\n\n' + warning_msgs +
            '\n\n^  Warning(s) found: {}/{}'.format(count_own, count_total))
    elif warning_msgs:
        print(warning_msgs)
