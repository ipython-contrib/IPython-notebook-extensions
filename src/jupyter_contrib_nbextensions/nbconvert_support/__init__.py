"""Classes and functions provided for use with nbconvert."""

import os

from .collapsible_headings import ExporterCollapsibleHeadings
from .exporter_embedhtml import EmbedHTMLExporter
from .exporter_embedslides import EmbedSlidesExporter
from .execute_time import ExecuteTimePreprocessor
from .exporter_inliner import ExporterInliner
from .nbTranslate import NotebookLangExporter
from .pp_highlighter import HighlighterPostProcessor, HighlighterPreprocessor
from .pre_codefolding import CodeFoldingPreprocessor
from .pre_embedimages import EmbedImagesPreprocessor
from .pre_pymarkdown import PyMarkdownPreprocessor
from .pre_svg2pdf import SVG2PDFPreprocessor
from .toc2 import TocExporter

__all__ = [
    'templates_directory',
    'CodeFoldingPreprocessor',
    'EmbedHTMLExporter',
    'EmbedSlidesExporter',
    'ExecuteTimePreprocessor',
    'ExporterCollapsibleHeadings',
    'ExporterInliner',
    'HighlighterPostProcessor',
    'HighlighterPreprocessor',
    'EmbedImagesPreprocessor',
    'NotebookLangExporter',
    'PyMarkdownPreprocessor',
    'SVG2PDFPreprocessor',
    'TocExporter',
]


def templates_directory():
    """Return path to the jupyter_contrib_nbextensions nbconvert templates."""
    return os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 'templates')
