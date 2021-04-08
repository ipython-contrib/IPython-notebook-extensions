"""Nbconvert preprocessor for the python-markdown nbextension."""

import base64
import os
import re

from ipython_genutils.ipstruct import Struct
from nbconvert.preprocessors import Preprocessor
from traitlets import Bool, Unicode

try:
    from urllib.request import urlopen  # py3
except ImportError:
    from urllib2 import urlopen


class EmbedImagesPreprocessor(Preprocessor):
    """
    :mod:`nbconvert` Preprocessor to embed images in a markdown cell as
        attachment inside the notebook itself.

    This :class:`~nbconvert.preprocessors.Preprocessor` replaces kernel code in
    markdown cells with the results stored in the cell metadata.

    The preprocessor is installed by default. To enable embedding images with
    NbConvert, you need to set the configuration parameter
    `EmbedImagesPreprocessor.embed_images=True`.
    This can be done either in the `jupyter_nbconvert_config.py` file::

        c.EmbedImagesPreprocessor.embed_images=True

    or using a command line parameter when calling NbConvert::

        $ jupyter nbconvert --to html --EmbedImagesPreprocessor.embed_images=True mynotebook.ipynb

    Further options are::

        EmbedImagesPreprocessor.embed_remote_images=True

    to additionally embeds all images referenced by an url
    (e.g. http://jupyter.org/assets/nav_logo.svg) instead of a local file name.

    Another configuration option is::

        EmbedImagesPreprocessor.resize=small

    Let's you scale-down the size of an image. This is useful if you want to
    save space by not embedding large images and instead use a smaller (scaled)
    version. Works only for raster images (i.e. png, jpg).
    Valid resize settings are: small = 500px, mid = 1000px, large = 2000px
    for maximum size in length or width.  No upscaling of small images will
    be performed. The Python package `PIL` needs to be installed for this
    option to work.

    Example::

            $ jupyter nbconvert --to html --EmbedImagesPreprocessor.embed_images=True
                --EmbedImagesPreprocessor.resize=large mynotebook.ipynb

    *Note:* To embed images after conversion to HTML you can also use the
           `html_embed` exporter
    """

    embed_images = Bool(False, help="Embed images as attachment").tag(config=True)
    embed_remote_images = Bool(False, help="Embed images referenced by an url as attachment").tag(config=True)
    resize = Unicode('', help="Resize images to save space (reduce size)").tag(config=True)
    imgsizes = {'small': 500, 'mid': 1000, 'large': 2000}

    def preprocess(self, nb, resources):
        """Skip preprocessor if not enabled"""
        if self.embed_images:
            nb, resources = super(EmbedImagesPreprocessor, self).preprocess(nb, resources)
        return nb, resources

    def resize_image(self, imgname, imgformat, imgdata):
        """Resize images if desired and PIL is installed

        Parameters
        ----------
            imgname: str
                Name of image
            imgformat: str
                Format of image (JPG or PNG)
            imgdata:
                Binary image data

        """
        if imgformat in ['png', 'jpeg']:
            from io import BytesIO
            try:
                from PIL import Image
            except ImportError:
                self.log.info("Pillow library not available to resize images")
                return imgdata
            # Only make images smaller when rescaling
            im = Image.open(BytesIO(imgdata))
            factor = self.imgsizes[self.resize] / max(im.size)
            if factor < 1.0:
                newsize = (int(im.size[0] * factor), int(im.size[1] * factor))
                newim = im.resize(newsize)
                fp = BytesIO()
                # PIL requires JPEG instead of JPG
                newim.save(fp, format=imgformat)
                imgdata = fp.getvalue()
                fp.close()
                self.log.debug("Resized %d x %d image %s to size %d x %d pixels" %
                               (im.size[0], im.size[1], imgname, newsize[0], newsize[1]))
        return imgdata

    def replfunc_md(self, match):
        """Read image and store as base64 encoded attachment"""
        url = match.group(2)
        imgformat = url.split('.')[-1].lower().replace('jpg', 'jpeg')
        if url.startswith('http'):
            if self.embed_remote_images:
                data = urlopen(url).read()
            else:
                return match.group(0)
        elif url.startswith('attachment'):
            return match.group(0)
        else:
            filename = os.path.join(self.path, url)
            with open(filename, 'rb') as f:
                data = f.read()

        if self.resize in self.imgsizes.keys():
            data = self.resize_image(url, imgformat, data)

        self.log.debug("Embedding url: %s, format: %s" % (url, imgformat))
        b64_data = base64.b64encode(data).decode("utf-8")
        self.attachments[url] = {'image/' + imgformat: b64_data}

        newimg = '![' + match.group(1) + '](attachment:' + match.group(2) + ')'
        return newimg

    def preprocess_cell(self, cell, resources, index):
        """
        Preprocess cell

        Parameters
        ----------
        cell : NotebookNode cell
            Notebook cell being processed
        resources : dictionary
            Additional resources used in the conversion process.  Allows
            preprocessors to pass variables into the Jinja engine.
        index : int
            Index of the cell being processed (see base.py)
        """
        self.path = resources['metadata']['path']
        self.attachments = getattr(cell, 'attachments', Struct())

        if cell.cell_type == "markdown":
            regex = re.compile('!\[([^"]*)\]\(([^"]+)\)')
            cell.source = regex.sub(self.replfunc_md, cell.source)
            cell.attachments = self.attachments
        return cell, resources
