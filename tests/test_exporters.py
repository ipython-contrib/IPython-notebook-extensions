# -*- coding: utf-8 -*-
"""Tests for custom exporters."""

import io
import os
from functools import wraps

from lxml import etree as et
from nbconvert.tests.base import TestsBase
from nbformat import v4, write


def path_in_data(rel_path):
    """Return an absolute path from a relative path in tests/data."""
    return os.path.join(os.path.dirname(__file__), 'data', rel_path)


def _with_tmp_cwd(func):
    @wraps(func)
    def func_wrapper(self, *args, **kwargs):
        with self.create_temp_cwd():
            return func(self, *args, **kwargs)
    return func_wrapper


class TestNbConvertExporters(TestsBase):

    def check_html(self, nb, exporter_name, check_func, extension='.html'):
        nb_basename = 'notebook'
        nb_src_filename = nb_basename + '.ipynb'
        with io.open(nb_src_filename, 'w', encoding='utf-8') as f:
            write(nb, f, 4)

        # convert with embedding exporter
        nb_dst_filename = nb_basename + extension
        self.nbconvert('--to {} "{}"'.format(exporter_name, nb_src_filename))

        with open(nb_dst_filename, 'rb') as f:
            embedded_nb = f.read()
            parser = et.HTMLParser()
            root = et.fromstring(embedded_nb, parser=parser)
            check_func(byte_string=embedded_nb, root_node=root)

    @_with_tmp_cwd
    def test_embedhtml(self):
        """Test exporter for embedding images into HTML"""
        nb = v4.new_notebook(cells=[
            v4.new_code_cell(source="a = 'world'"),
            v4.new_markdown_cell(
                source="![testimage]({})".format(path_in_data('icon.png'))
            ),
        ])

        def check(byte_string, root_node):
            nodes = root_node.findall(".//img")
            for n in nodes:
                url = n.attrib["src"]
                assert url.startswith('data')

        self.check_html(nb, 'html_embed', check_func=check)

    @_with_tmp_cwd
    def test_embedslides(self):
        """Test exporter for embedding images into slides"""
        nb = v4.new_notebook(cells=[
            v4.new_code_cell(source="a = 'world'"),
            v4.new_markdown_cell(
                source="![testimage]({})".format(path_in_data('icon.png'))
            ),
        ])

        def check(byte_string, root_node):
            nodes = root_node.findall(".//img")
            for n in nodes:
                url = n.attrib["src"]
                assert url.startswith('data')

        self.check_html(nb, 'slides_embed', check_func=check, extension='.slides.html')

    @_with_tmp_cwd
    def test_htmltoc2(self):
        """Test exporter for adding table of contents"""
        nb = v4.new_notebook(cells=[
            v4.new_code_cell(source="a = 'world'"),
            v4.new_markdown_cell(source="# Heading"),
        ])

        def check(byte_string, root_node):
            assert b'toc2' in byte_string

        self.check_html(nb, 'html_toc', check_func=check)

    @_with_tmp_cwd
    def test_html_collapsible_headings(self):
        """Test exporter for inlining collapsible_headings"""
        nb = v4.new_notebook(cells=[
            v4.new_markdown_cell(source=('# level 1 heading')),
            v4.new_code_cell(source='a = range(1,10)'),
            v4.new_markdown_cell(source=('## level 2 heading')),
            v4.new_code_cell(source='a = range(1,10)'),
            v4.new_markdown_cell(source=('### level 3 heading')),
            v4.new_code_cell(source='a = range(1,10)'),
        ])

        def check(byte_string, root_node):
            assert b'collapsible_headings' in byte_string

        self.check_html(nb, 'html_ch', check_func=check)
