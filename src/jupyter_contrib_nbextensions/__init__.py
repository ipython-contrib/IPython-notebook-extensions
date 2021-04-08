# -*- coding: utf-8 -*-

import os

import jupyter_nbextensions_configurator
from notebook.utils import url_path_join as ujoin
from jupyter_tabnine.handler import TabNineHandler
from jupyter_tabnine.tabnine import TabNine

__version__ = '0.5.3'


def _jupyter_server_extension_paths():
    """Magically-named function for jupyter extension installations."""
    return [{
        'module': 'jupyter_tabnine',
    }]


def _jupyter_nbextension_paths():
    """Magically-named function for jupyter extension installations."""
    nbextension_dirs = [
        os.path.join(os.path.dirname(__file__), 'nbextensions')]
    specs = jupyter_nbextensions_configurator.get_configurable_nbextensions(
        nbextension_dirs=nbextension_dirs)

    return [dict(
        section=nbext['Section'],
        # src is a directory in which we assume the require file resides.
        # the path is relative to the package directory
        src=os.path.join(
            'nbextensions',
            os.path.dirname(nbext['require'])
        ),
        # directory in the `nbextension/` namespace
        dest=os.path.dirname(nbext['require']),
        # _also_ in the `nbextension/` namespace
        require=nbext['require'],
    ) for nbext in specs]


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.
    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    route_pattern = ujoin(web_app.settings['base_url'], '/tabnine')
    tabnine = TabNine()
    web_app.add_handlers(host_pattern, [(route_pattern, TabNineHandler, {'tabnine': tabnine})])