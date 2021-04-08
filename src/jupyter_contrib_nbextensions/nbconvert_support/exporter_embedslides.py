# -*- coding: utf-8 -*-
"""Embed graphics into Slides Exporter class"""

from nbconvert.exporters.slides import SlidesExporter
from nbconvert.exporters.html import Config
from .exporter_embedhtml import MakeAttachmentsUnique, EmbedImages
from .pre_embedimages import EmbedImagesPreprocessor


class EmbedSlidesExporter(SlidesExporter, EmbedImages):
    """
    :mod:`nbconvert` Exporter which embeds graphics as base64 into html.

    Convert to HTML and embed graphics (pdf, svg and raster images) in the HTML
    file.

    Example usage::

        jupyter nbconvert --to slides_embed mynotebook.ipynb
    """
    def from_notebook_node(self, nb, resources=None, **kw):
        output, resources = super(
            EmbedSlidesExporter, self).from_notebook_node(nb, resources)

        embedded_output = self.embed_images_into_notebook(output, resources)
        return embedded_output, resources

    @property
    def default_preprocessors(self):
        return super(EmbedSlidesExporter, self).default_preprocessors + \
               [EmbedImagesPreprocessor, MakeAttachmentsUnique]

    @property
    def default_config(self):
        c = Config({
            'EmbedImagesPreprocessor': {
                'enabled': True,
                'embed_images': True
            },
            'MakeAttachmentsUnique': {
                'enabled': True
            }
        })
        c.merge(super(EmbedSlidesExporter, self).default_config)
        return c

    def from_notebook_node(self, nb, resources=None, **kw):

        output, resources = super(
            EmbedSlidesExporter, self).from_notebook_node(nb, resources)

        embedded_output = self.embed_images_into_notebook(output, resources)
        return embedded_output, resources
