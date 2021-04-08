.. module:: jupyter_contrib_nbextensions.nbconvert_support


Exporting
=========

Some extensions add functionality you might want to keep when exporting a notebook
to another format using :mod:`nbconvert`.

There are several parts to customize :mod:`nbconvert` output:
 * *Preprocessors* to change content before conversion to another format
 * *Postprocessors* to change content after conversion to another format
 * *Exporters* to actually do the conversion to another format
 * *Templates* provide customization using Jinja without writing an exporter


Preprocessors
-------------

Generic documentation for preprocessors can be found at
`nbconvert.readthedocs.io/en/latest/api/preprocessors.html <http://nbconvert.readthedocs.io/en/latest/api/preprocessors.html>`__.


Executing and updating timing metadata
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: ExecuteTimePreprocessor


Retaining Codefolding
^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: CodeFoldingPreprocessor


Retaining Highlighting
^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: HighlighterPreprocessor


Evaluating code in Markdown (PyMarkDown)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: PyMarkdownPreprocessor


Converting linked SVG to PDF
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: SVG2PDFPreprocessor


Embedding images in notebooks
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: EmbedImagesPreprocessor

    Allows embedding images (pdf, svg and raster images) in the notebook itself as base64 encoded binaries,
    instead of linking to them. This makes distributing notebooks easier. Example:

        jupyter nbconvert --to ipynb mynotebook.ipynb


Postprocessors
--------------

Generic documentation for postprocessors can be found at
`nbconvert.readthedocs.io/en/latest/api/postprocessors.html <http://nbconvert.readthedocs.io/en/latest/api/postprocessors.html>`__


Retaining Highlighting
^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: HighlighterPostProcessor


Exporters
---------

Generic documentation for exporters can be found at

`nbconvert.readthedocs.io/en/latest/api/exporters.html <http://nbconvert.readthedocs.io/en/latest/api/exporters.html>`__


Embed images in HTML
^^^^^^^^^^^^^^^^^^^^

.. autoclass:: EmbedHTMLExporter

    Allows embedding images (pdf, svg and raster images) into a HTML file as base64 encoded binary,
    instead of linking to them. Example:

        jupyter nbconvert --to html_embed --NbConvertApp.codefolding=True mynotebook.ipynb


Embed images in HTML
^^^^^^^^^^^^^^^^^^^^

.. autoclass:: EmbedSlidesExporter

    Allows embedding images (pdf, svg and raster images) into a HTML slideshow as base64 encoded binary,
    instead of linking to them. This enables making standalone slideshows. Example:

        jupyter nbconvert --to slides_embed mynotebook.ipynb


Export Table of Contents
^^^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: TocExporter


Inlining css & javascript
^^^^^^^^^^^^^^^^^^^^^^^^^

.. autoclass:: ExporterInliner

    Forms the basis for :class:`ExporterCollapsibleHeadings`.


Collapsible Headings
^^^^^^^^^^^^^^^^^^^^

.. autoclass:: ExporterCollapsibleHeadings


Templates
---------

Generic documentation on templates can be found at
`nbconvert.readthedocs.io/en/latest/customizing.html <http://nbconvert.readthedocs.io/en/latest/customizing.html>`__

The main `jupyter contrib nbextension install` command will attempt to alter
the nbconvert config to include the package's templates directory, as mentioned
in :ref:`jupyter-contrib-nbextensions-config-edits`.
This should allow you to use the templates `nbextensions.tpl` and
`nbextensions.tplx` mentioned below just by specifying `--template=nbextensions`
in your call to nbconvert.

To find the location of the custom templates you can use this function:
.. autofunction:: templates_directory


nbextensions.tpl
^^^^^^^^^^^^^^^^

This is a template for notebook extensions that allows hiding code cells, output, or text cells.
Usage::

    $ jupyter nbconvert --template=nbextensions mynotebook.ipynb

The supported cell metadata tags are:
 * `cell.metadata.hidden` - hide complete cell
 * `cell.metadata.hide_input` - hide code cell input
 * `cell.metadata.hide_output` - hide code cell output

Detailed description:

This will hide the input of either an individual code cell or all code cells of the notebook:
.. code-block::

    {% block input_group -%}
    {%- if cell.metadata.hide_input or nb.metadata.hide_input -%}
    {%- else -%}
    {{ super() }}
    {%- endif -%}
    {% endblock input_group %}

This will hide the output of an individual code cell:
.. code-block::

    {% block output_group -%}
    {%- if cell.metadata.hide_output -%}
    {%- else -%}
        {{ super() }}
    {%- endif -%}
    {% endblock output_group %}

This will suppress the prompt string if the input of a code cell is hidden:
.. code-block::

    {% block output_area_prompt %}
    {%- if cell.metadata.hide_input or nb.metadata.hide_input -%}
        <div class="prompt"> </div>
    {%- else -%}
        {{ super() }}
    {%- endif -%}
    {% endblock output_area_prompt %}

nbextensions.tplx
^^^^^^^^^^^^^^^^^

This template implements the features to hide cells used by extensions like hide_input, etc.
It won't produce a valid LaTeX file alone, use it to extend your own template (see printviewlatex.tplx).

printviewlatex.tplx
^^^^^^^^^^^^^^^^^^^

This template can be used to customize nbconvert when creating LaTex or PDF documents.
It extends the `nbextensions.tplx` template:
.. code-block::

    ((= Nbconvert custom style for LaTeX export =))
    ((*- extends 'nbextensions.tplx' -*))


The first block is to
.. code-block::

    %===============================================================================
    % Custom definitions
    %===============================================================================
    ((* block definitions *))
        ((( super() )))

        % Pygments definitions
        ((( resources.latex.pygments_definitions )))

        % Exact colors from NB
        \definecolor{incolor}{rgb}{0.0, 0.0, 0.5}
        \definecolor{outcolor}{rgb}{0.545, 0.0, 0.0}

        % Don't number sections
        \renewcommand{\thesection}{\hspace*{-0.5em}}
        \renewcommand{\thesubsection}{\hspace*{-0.5em}}

    ((* endblock definitions *))

    % No title
    ((* block maketitle *))((* endblock maketitle *))

The next block contains
.. code-block::

    %===============================================================================
    % Latex Article
    %===============================================================================
    % You can customize your LaTeX document here, e.g. you can
    % - use a different documentclass like
    %   \documentclass{report}
    % - add/remove packages (like ngerman)

    ((* block docclass *))
    % !TeX spellcheck = de_DE
    % !TeX encoding = UTF-8
    \documentclass{scrreprt}
    \usepackage{ngerman}
    ((* endblock docclass *))

Usage::

    $ jupyter nbconvert --to=latex --template=printviewlatex mynotebook.ipynb

The result without specifying a custom template looks like this:

.. image:: graphics/no-template.png
  :alt: nbconvert output without template


If you specify the `printviewlatex` template, it should look like this:

.. image:: graphics/printviewlatex-template.png
   :alt: nbconvert output without template

If you want to customize the template, simply copy `printviewlatex.tplx` and modify it.

