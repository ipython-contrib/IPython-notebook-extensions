Jupyter notebook extensions
=============================

[![Join the chat at https://gitter.im/ipython-contrib/jupyter_contrib_nbextensions](https://img.shields.io/gitter/room/ipython-contrib/jupyter_contrib_nbextensions.svg?maxAge=3600)](https://gitter.im/ipython-contrib/jupyter_contrib_nbextensions?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Documentation Status](https://readthedocs.org/projects/jupyter-contrib-nbextensions/badge/?version=latest)](https://jupyter-contrib-nbextensions.readthedocs.io/en/latest/)
[![Documentation Status](https://readthedocs.org/projects/jupyter-contrib-nbextensions/badge/?version=stable)](https://jupyter-contrib-nbextensions.readthedocs.io/en/stable/)
[![GitHub issues](https://img.shields.io/github/issues/ipython-contrib/jupyter_contrib_nbextensions.svg?maxAge=3600)](https://github.com/ipython-contrib/jupyter_contrib_nbextensions/issues)
<br/>
[![Travis-CI Build Status](https://img.shields.io/travis/ipython-contrib/jupyter_contrib_nbextensions.svg?maxAge=3600&label=Travis)](https://travis-ci.org/ipython-contrib/jupyter_contrib_nbextensions)
[![Appveyor Build status](https://img.shields.io/appveyor/ci/jcb91/ipython-notebook-extensions-ynb9f.svg?maxAge=3600&label=Appveyor)](https://ci.appveyor.com/project/jcb91/ipython-notebook-extensions-ynb9f)
[![Coveralls python test coverage](https://img.shields.io/coveralls/ipython-contrib/jupyter_contrib_nbextensions/master.svg?maxAge=3600&label=Coveralls)](https://coveralls.io/github/ipython-contrib/jupyter_contrib_nbextensions)
[![Codecov python test coverage](https://img.shields.io/codecov/c/github/ipython-contrib/jupyter_contrib_nbextensions/master.svg?maxAge=3600&label=Codecov)](https://codecov.io/gh/ipython-contrib/jupyter_contrib_nbextensions)
<br/>
[![GitHub tag](https://img.shields.io/github/tag/ipython-contrib/jupyter_contrib_nbextensions.svg?maxAge=3600&label=Github)](https://github.com/ipython-contrib/jupyter_contrib_nbextensions)
[![PyPI](https://img.shields.io/pypi/v/jupyter_contrib_nbextensions.svg?maxAge=3600)](https://pypi.python.org/pypi/jupyter_contrib_nbextensions)
[![Anaconda cloud](https://anaconda.org/conda-forge/jupyter_contrib_nbextensions/badges/version.svg)](https://anaconda.org/conda-forge/jupyter_contrib_nbextensions)

This repository contains a collection of extensions that add functionality to
the Jupyter notebook.
These extensions are mostly written in Javascript and will be loaded locally in
your browser.

The IPython-contrib repository is maintained independently by a group of users
and developers and not officially related to the IPython development team.

The maturity of the provided extensions varies, so please
[create an issue](https://github.com/ipython-contrib/jupyter_contrib_nbextensions/issues/new)
at the project's
[github repository](https://github.com/ipython-contrib/jupyter_contrib_nbextensions)
if you encounter any problems.


IPython/Jupyter version support
===============================

For Jupyter version 4 or 5, use the master branch of the repository.
Most nbextensions have been updated to work with both Jupyter 4.x and 5.x, but occasionally things get missed, or the Jupyter API changes in a minor version update, so if anything doesn't work as you'd expect/hope, please do check the issues, or open a new one as necessary!

This repo is pretty much all in the main master branch, although there remain vestigial branches for IPython notebook versions 2.x and 3.x.

JupyterLab
==========

Due to major differences between the Jupyter Notebook and JupyterLab, the extensions in this
repository will not work in JupyterLab.


Documentation
=============

Documentation for all maintained extensions can be found at
[jupyter-contrib-nbextensions.readthedocs.io](https://jupyter-contrib-nbextensions.readthedocs.io/en/latest)

All extensions that are maintained and active
have at least a  yaml file to allow them being configured using the
[jupyter_nbextensions_configurator](https://github.com/Jupyter-contrib/jupyter_nbextensions_configurator)
server extension, which is installed as a dependency of this package.
Most also have a markdown readme file for documentation.
The `jupyter_nbextensions_configurator` server extension shows an nbextensions
tab on the main notebook dashboard (file tree page) from which you can see each
nbextension's markdown readme, and configure its options.
To view documentation without installing, you can check the list at
[jupyter-contrib-nbextensions.readthedocs.io/en/latest/nbextensions.html](http://jupyter-contrib-nbextensions.readthedocs.io/en/latest/nbextensions.html),
or browse the nbextensions
directory to read markdown readmes on github at
[github.com/ipython-contrib/jupyter_contrib_nbextensions/tree/master/src/jupyter_contrib_nbextensions/nbextensions](https://github.com/ipython-contrib/jupyter_contrib_nbextensions/tree/master/src/jupyter_contrib_nbextensions/nbextensions).

Some extensions are not documented. We encourage you to add documentation for them.


Installation
============

To install the `jupyter_contrib_nbextensions` notebook extensions, three steps
are required. First, the Python pip package needs to be installed. Then, the
notebook extensions themselves need to be copied to the Jupyter data directory.
Finally, the installed notebook extensions can be enabled, either by using
built-in Jupyter commands, or more conveniently by using the
[jupyter_nbextensions_configurator](https://github.com/Jupyter-contrib/jupyter_nbextensions_configurator)
server extension, which is installed as a dependency of this repo.

The Python package installation step is necessary to allow painless
installation of the nbextensions together with additional items like nbconvert
templates, pre-/postprocessors, and exporters.


1\. Install the python package
------------------------------


### PIP

All of the nbextensions in this repo are provided as parts of a python package,
which is installable in the usual manner, using `pip` or the `setup.py` script.
To install the current version from PyPi, simply type

    pip install jupyter-contrib-nbextensions

Alternatively, you can install directly from the current master branch of the
repository

    pip install https://github.com/ipython-contrib/jupyter_contrib_nbextensions/tarball/master

All the usual pip options apply, e.g. using pip's `--upgrade` flag to force an
upgrade, or `-e` for an editable install.


### Conda

There are conda packages for the notebook extensions and the
[jupyter_nbextensions_configurator](https://github.com/Jupyter-contrib/jupyter_nbextensions_configurator)
available from [conda-forge](https://conda-forge.github.io).
You can install both using

    conda install -c conda-forge jupyter_contrib_nbextensions

This also automatically installs the Javascript and CSS files
(using `jupyter contrib nbextension install --sys-prefix`), so the second
installation step below can therefore be skipped.


### Installation from cloned Repo

You can also install from a cloned repo, which can be useful for development.
You can clone the repo using

    git clone https://github.com/ipython-contrib/jupyter_contrib_nbextensions.git

Then perform an editable pip install using

    pip install -e jupyter_contrib_nbextensions


2\. Install javascript and css files
------------------------------------

This step copies the nbextensions' javascript and css files into the jupyter
server's search directory, and edits some jupyter config files.
A `jupyter` subcommand is provided for the purpose:

    jupyter contrib nbextension install --user

The command does two things: installs nbextension files, and edits nbconvert
config files. The first part is essentially a wrapper around the
notebook-provided `jupyter nbextension install`, and copies relevant javascript
and css files to the appropriate jupyter data directory.
The second part edits the config files `jupyter_nbconvert_config.json`and
`jupyter_notebook_config.json` as noted below in the options.
The command can take most of the same options as the jupyter-provided versions,
including

 * `--user` to install into the user's home jupyter directories
 * `--system` to perform installation into system-wide jupyter directories
 * `--sys-prefix` to install into python's `sys.prefix`, useful for instance in
   virtual environments, such as with conda
 * `--symlink` to symlink the nbextensions rather than copying each file
   (recommended, on non-Windows platforms).
 * `--debug`, for more-verbose output

In addition, two further option flags are provided to perform either only the
config-editing operations, or only the file-copy operations:

 * `--only-files` to install nbextension files without editing any config files
 * `--only-config` to edit the config files without copying/symlinking any
   nbextension files. This edits the following files in the applicable jupyter
   config directory:
    - `jupyter_nbconvert_config.json` to use some of the classes provided
      in the python module `jupyter_contrib_nbextensions.nbconvert_support`
    - `jupyter_notebook_config.json` to enable the serverextension
      `jupyter_nbextensions_configurator`.

Finally, the `--perform-running-check` option flag is provided in order to
prevent the installation from proceeding if a notebook server appears to be
currently running
(by default, the install will still be performed, even if a notebook server
appears to be running).

An analogous `uninstall` command is also provided, to remove all of the
nbextension files from the jupyter directories.


3\. Enabling/Disabling extensions
---------------------------------

To use an nbextension, you'll also need to enable it, which tells the notebook
interface to load it. To do this, you can use a Jupyter subcommand:

    jupyter nbextension enable <nbextension require path>

for example,

    jupyter nbextension enable codefolding/main

To disable the extension again, use

    jupyter nbextension disable <nbextension require path>

**Alternatively**, and more conveniently, you can use the
[jupyter_nbextensions_configurator](https://github.com/Jupyter-contrib/jupyter_nbextensions_configurator)
server extension, which is installed as a dependency of this repo, and can be
used to enable and disable the individual nbextensions, as well as configure
their options. You can then open the `nbextensions` tab on the tree
(dashboard/file browser) notebook page to configure nbextensions.
You will have access there to a dashboard where extensions can be
enabled/disabled via checkboxes.
Additionally a short documentation for each extension is displayed, and
configuration options are presented.

![jupyter_nbextensions_configurator](https://raw.githubusercontent.com/Jupyter-contrib/jupyter_nbextensions_configurator/master/src/jupyter_nbextensions_configurator/static/nbextensions_configurator/icon.png)


4\. More complex setups
-----------------------

For complex or customized installation scenarios, please look at the
documentation for installing notebook extensions, server extensions, nbconvert
pre/postprocessors and templates on the [Jupyter homepage](https://jupyter.org).
Most nbextensions here should work fine with jupyterhub (because jupyterhub spawns regular notebook servers for each individual user), but won't work with jupyterlab (because the jupyterlab javascript framework is different to notebook's, and still rapidly changing under active development).

See also [installing Jupyter](https://jupyter.readthedocs.io/en/latest/install.html)


Notebook extension structure
============================

Most of the nbextensions are stored in the repository each as a separate subdirectory of
[`src/jupyter_contrib_nbextensions/nbextensions`](https://github.com/ipython-contrib/jupyter_contrib_nbextensions/tree/master/src/jupyter_contrib_nbextensions/nbextensions).

Each notebook extension typically has its own directory named after the extension, containing:

 * `thisextension/thisextension.js` - javascript implementing the nbextension
 * `thisextension/thisextension.yml` - file describing the nbextension to the `jupyter_nbextensions_configurator` server extension
 * `thisextension/thisextension.css` - optional CSS file, which may be loaded by the javascript
 * `thisextension/README.md` - readme file describing the nbextension in markdown format

A few (jupyter_highlight_selected_word, jupyter_latex_envs), exist as separate packages on pypi, which are included as dependencies of this package.

For further details, see [the documentation at jupyter-contrib-nbextensions.readthedocs.io](http://jupyter-contrib-nbextensions.readthedocs.io/en/latest/internals.html).


Contributing
============

To learn how to setup a development environment and for contribution guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).


Changes
=======

For changes, see the [CHANGELOG.md](./CHANGELOG.md)
