# -*- coding: utf-8 -*-
"""Embed graphics into HTML Exporter class"""

import base64
import os
import re
import uuid
import ntpath

import lxml.etree as et
from ipython_genutils.ipstruct import Struct
from nbconvert.exporters.html import Config, HTMLExporter
from nbconvert.preprocessors import Preprocessor

from .pre_embedimages import EmbedImagesPreprocessor

try:
    from urllib.request import urlopen  # py3
except ImportError:
    from urllib2 import urlopen


class MakeAttachmentsUnique(Preprocessor):
    """ Stupid internal preprocessor to uniquify every attachment
        such that {name : attachament_data} is unique, since every cell
        can have the same name for the attachment.
        We store it in the resources such the attachements are available
        after the HTMLExporter.
    """

    def preprocess(self, nb, resources):
        if "unique-attachments" not in resources:
            resources["unique-attachments"] = Struct()
        return super(MakeAttachmentsUnique, self).preprocess(nb, resources)

    def replfunc_md(self, match):
        old_name = match.group(2)
        new_name = "{id-%s}" % str(uuid.uuid4()) + ntpath.basename(old_name)
        self.log.debug("Unique-Attachment: '%s' -> '%s'"
                       % (old_name, new_name))
        if old_name in self.cell_attachments:
            self.cell_attachments[new_name] = self.cell_attachments[old_name]
            del self.cell_attachments[old_name]
        return '![' + match.group(1) + '](attachment:' + new_name + ')'

    def preprocess_cell(self, cell, resources, index):

        self.cell_attachments = getattr(cell, 'attachments', Struct())

        if cell.cell_type == "markdown":
            regex = re.compile('!\[([^"]*)\]\(attachment:([^"]+)\)')
            cell.source = regex.sub(self.replfunc_md, cell.source)
            cell.attachments = self.cell_attachments

        if 'attachments' in cell.keys():
            attachments = cell['attachments']
            for name in attachments.keys():
                if "{id-" not in name:
                    new_name = "{id-%s}" % str(uuid.uuid4()) + ntpath.basename(name)
                    self.log.debug("Unique-Attachment: '%s' -> '%s'"
                                   % (name, new_name))
                    attachments[new_name] = attachments[name]
                    del attachments[name]

            # Store in Resources
            resources["unique-attachments"] += cell['attachments']
        return cell, resources


class EmbedImages:
    """Read images and embed"""
    def replfunc(self, node):
        """Replace source url or file link with base64 encoded blob."""
        url = node.attrib["src"]

        b64_data = None
        prefix = None

        if url.startswith('data'):
            return  # Already in base64 Format

        imgformat = url.split('.')[-1].replace('jpg', 'jpeg')
        self.log.debug("Try embedding url: %s, format: %s" % (url, imgformat))
        if url.startswith('http'):
            b64_data = base64.b64encode(urlopen(url).read()).decode("utf-8")
        elif url.startswith('attachment'):
            imgname = url.split(':')[1]
            available_formats = self.attachments[imgname]
            # get the image based on the configured image type priority
            for imgformat in self.config.NbConvertBase.display_data_priority:
                if imgformat in available_formats.keys():
                    b64_data = self.attachments[imgname][imgformat]
                    prefix = "data:%s;base64," % imgformat

            if b64_data is None:
                raise ValueError("""Could not find attachment for image '%s'
                                    in notebook""" % imgname)
        else:
            filename = os.path.join(self.path, url)
            with open(filename, 'rb') as f:
                b64_data = base64.b64encode(f.read()).decode("utf-8")

        if prefix is None:
            if imgformat == "svg":
                prefix = "data:image/svg+xml;base64,"
            elif imgformat == "pdf":
                prefix = "data:application/pdf;base64,"
            else:
                prefix = "data:image/" + imgformat + ';base64,'

        node.attrib["src"] = prefix + b64_data

    def embed_images_into_notebook(self, output, resources):
        self.path = resources['metadata']['path']

        self.attachments = resources['unique-attachments']
        self.log.debug("Unique-Attachements: %s" % self.attachments.keys())

        # Parse HTML and replace <img> tags with the embedded data
        parser = et.HTMLParser()
        root = et.fromstring(output, parser=parser)
        nodes = root.findall(".//img")
        for n in nodes:
            self.replfunc(n)

        # Convert back to HTML
        embedded_output = et.tostring(root.getroottree(),
                                      method="html",
                                      encoding='unicode')
        return embedded_output


class EmbedHTMLExporter(HTMLExporter, EmbedImages):
    """
    :mod:`nbconvert` Exporter which embeds graphics as base64 into html.

    Convert to HTML and embed graphics (pdf, svg and raster images) in the HTML
    file.

    Example usage::

        jupyter nbconvert --to html_embed mynotebook.ipynb
    """

    @property
    def default_preprocessors(self):
        return super(EmbedHTMLExporter, self).default_preprocessors + \
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
        c.merge(super(EmbedHTMLExporter, self).default_config)
        return c

    def from_notebook_node(self, nb, resources=None, **kw):
        output, resources = super(
            EmbedHTMLExporter, self).from_notebook_node(nb, resources)

        embedded_output = self.embed_images_into_notebook(output, resources)
        return embedded_output, resources
