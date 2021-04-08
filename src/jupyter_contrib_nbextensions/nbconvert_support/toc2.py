"""Toc2 exporter class, TocExporter"""

# -----------------------------------------------------------------------------
# Copyright (c) 2016-2019, the IPython IPython-Contrib Development Team.
#
# Distributed under the terms of the Modified BSD License.
#
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

from nbconvert.exporters.html import HTMLExporter
from traitlets.config import Config


# -----------------------------------------------------------------------------
# Classes
# -----------------------------------------------------------------------------


class TocExporter(HTMLExporter):
    """
    :mod:`nbconvert` HTMLExporter which embeds the toc2 nbextension.

    Export table of contents nbextension functionality to html. The idea is to
    link a relevant part of the javascript nbextension and the css, and add a
    small script in the html file.

    Example usage::

        jupyter nbconvert --to html_toc FILE.ipynb
    """
    
    export_from_notebook = "HTML + ToC"


    def _file_extension_default(self):
        return '.html'

    def _template_file_default(self):
        return 'toc2.tpl'

    output_mimetype = 'text/html'

    def _raw_mimetypes_default(self):
        return ['text/markdown', 'text/html', '']

    @property
    def default_config(self):
        c = Config({'ExtractOutputPreprocessor': {'enabled': False}})
        #  import here to avoid circular import
        from jupyter_contrib_nbextensions.nbconvert_support import (
            templates_directory)
        c.merge(super(TocExporter, self).default_config)

        c.TemplateExporter.extra_template_paths = [
            '.',
            templates_directory(),
        ]

        return c
