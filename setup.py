#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Setup script for jupyter_contrib_nbextensions."""

# -----------------------------------------------------------------------------
# Imports
# -----------------------------------------------------------------------------

import os
from glob import glob

from setuptools import find_packages, setup

# -----------------------------------------------------------------------------
# main setup call
# -----------------------------------------------------------------------------


def main():

    setup(
        name='jupyter_contrib_nbextensions',
        description="A collection of Jupyter nbextensions.",
        long_description="""
Contains a collection of extensions that add functionality to the Jupyter
notebook. These extensions are mostly written in Javascript, and are loaded
locally in the browser.

Read
`the documentation <https://jupyter-contrib-nbextensions.readthedocs.io>`_
for more information.

The
`jupyter-contrib repository <https://github.com/ipython-contrib/jupyter_contrib_nbextensions>`_
is maintained independently by a group of users and developers, and is not
officially related to the Jupyter development team.

The maturity of the provided extensions varies, so please check
`the repository issues page <https://github.com/ipython-contrib/jupyter_contrib_nbextensions/issues>`_
if you encounter any problems, and create a new issue if needed!
""",  # noqa: E501
        version='0.5.3',
        author='ipython-contrib and jupyter-contrib developers',
        author_email='jupytercontrib@gmail.com',
        url=('https://github.com/'
             'ipython-contrib/jupyter_contrib_nbextensions.git'),
        download_url=('https://github.com/'
                      'ipython-contrib/jupyter_contrib_nbextensions'
                      '/tarball/0.5.3'),
        keywords=['IPython', 'Jupyter', 'notebook'],
        license='BSD',
        platforms=['Any'],
        packages=find_packages('src'),
        package_dir={'': 'src'},
        include_package_data=True,
        py_modules=[
            os.path.splitext(os.path.basename(path))[0]
            for path in glob('src/*.py')
        ],
        install_requires=[
            'ipython_genutils',
            'jupyter_contrib_core >=0.3.3',
            'jupyter_core',
            'jupyter_highlight_selected_word >=0.1.1',
            'jupyter_latex_envs >=1.4.0',
            'jupyter_nbextensions_configurator >=0.4.0',
            'nbconvert >=6.0',
            'notebook >=6.0',
#            'pyyaml',
            'tornado',
            'traitlets >=4.1',
            'lxml'
        ],
        extras_require={
            'test': [
                'nbformat',
                'nose',
                'pip',
                'requests',
            ],
            'test:python_version == "3.8"': [
                'mock',
            ],
        },
        # we can't be zip safe as we require templates etc to be accessible to
        # jupyter server
        zip_safe=False,
        entry_points={
            'console_scripts': [
                'jupyter-contrib-nbextension = jupyter_contrib_nbextensions.application:main',  # noqa: E501
            ],
            'jupyter_contrib_core.app.subcommands': [
                'nbextension = jupyter_contrib_nbextensions.application:jupyter_contrib_core_app_subcommands',  # noqa: E501
            ],
            'nbconvert.exporters': [
                'html_toc = jupyter_contrib_nbextensions.nbconvert_support.toc2:TocExporter',  # noqa: E501
                'selectLanguage = jupyter_contrib_nbextensions.nbconvert_support.nbTranslate:NotebookLangExporter',  # noqa: E501
                'html_embed = jupyter_contrib_nbextensions.nbconvert_support.exporter_embedhtml:EmbedHTMLExporter',  # noqa: E501
                'slides_embed = jupyter_contrib_nbextensions.nbconvert_support.exporter_embedslides:EmbedSlidesExporter',  # noqa: E501
                'html_ch = jupyter_contrib_nbextensions.nbconvert_support.collapsible_headings:ExporterCollapsibleHeadings',  # noqa: E501
            ],
        },
        scripts=[os.path.join('scripts', p) for p in [
            'jupyter-contrib-nbextension',
        ]],
        classifiers=[
            'Development Status :: 1 - Planning',
            'Intended Audience :: End Users/Desktop',
            'Intended Audience :: Science/Research',
            'License :: OSI Approved :: BSD License',
            'Natural Language :: English',
            'Operating System :: OS Independent',
            'Programming Language :: JavaScript',
            'Programming Language :: Python',
            'Topic :: Utilities',
        ],
    )


if __name__ == '__main__':
    main()
