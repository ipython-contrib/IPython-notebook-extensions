# -*- coding: utf-8 -*-
"""API to install/remove all jupyter_contrib_nbextensions."""

import errno
import os

import jupyter_highlight_selected_word
import latex_envs
from jupyter_contrib_core.notebook_compat import nbextensions
from jupyter_nbextensions_configurator.application import (
    EnableJupyterNbextensionsConfiguratorApp,
)
from notebook.notebookapp import list_running_servers
from traitlets.config import Config
from traitlets.config.manager import BaseJSONConfigManager

import jupyter_contrib_nbextensions.nbconvert_support


class NotebookRunningError(Exception):
    pass


def notebook_is_running(runtime_dir=None):
    """Return true if a notebook process appears to be running."""
    try:
        return bool(next(list_running_servers(runtime_dir=runtime_dir)))
    except StopIteration:
        return False


def toggle_install(install, user=False, sys_prefix=False, overwrite=False,
                   symlink=False, prefix=None, nbextensions_dir=None,
                   logger=None, skip_running_check=False):
    """Install or remove all jupyter_contrib_nbextensions files & config."""
    _err_on_running(skip_running_check=skip_running_check)
    _check_conflicting_kwargs(user=user, sys_prefix=sys_prefix, prefix=prefix,
                              nbextensions_dir=nbextensions_dir)
    toggle_install_files(
        install, user=user, sys_prefix=sys_prefix, overwrite=overwrite,
        symlink=symlink, prefix=prefix, nbextensions_dir=nbextensions_dir,
        logger=logger, skip_running_check=skip_running_check)
    toggle_install_config(
        install, user=user, sys_prefix=sys_prefix, logger=logger,
        skip_running_check=skip_running_check)


def toggle_install_files(install, user=False, sys_prefix=False, logger=None,
                         overwrite=False, symlink=False, prefix=None,
                         nbextensions_dir=None, skip_running_check=False):
    """Install/remove jupyter_contrib_nbextensions files."""
    _err_on_running(skip_running_check=skip_running_check)
    kwargs = dict(user=user, sys_prefix=sys_prefix, prefix=prefix,
                  nbextensions_dir=nbextensions_dir)
    _check_conflicting_kwargs(**kwargs)
    kwargs['logger'] = logger
    if logger:
        logger.info(
            '{} jupyter_contrib_nbextensions nbextension files {} {}'.format(
                'Installing' if install else 'Uninstalling',
                'to' if install else 'from',
                'jupyter data directory'))
    component_nbext_packages = [
        jupyter_contrib_nbextensions,
        jupyter_highlight_selected_word,
        latex_envs,
    ]
    for mod in component_nbext_packages:
        if install:
            nbextensions.install_nbextension_python(
                mod.__name__, overwrite=overwrite, symlink=symlink, **kwargs)
        else:
            nbextensions.uninstall_nbextension_python(mod.__name__, **kwargs)


def toggle_install_config(install, user=False, sys_prefix=False,
                          skip_running_check=False, logger=None):
    """Install/remove contrib nbextensions to/from jupyter_nbconvert_config."""
    _err_on_running(skip_running_check=skip_running_check)
    _check_conflicting_kwargs(user=user, sys_prefix=sys_prefix)
    config_dir = nbextensions._get_config_dir(user=user, sys_prefix=sys_prefix)
    if logger:
        logger.info(
            '{} jupyter_contrib_nbextensions items {} config in {}'.format(
                'Installing' if install else 'Uninstalling',
                'to' if install else 'from',
                config_dir))

    # Configure the jupyter_nbextensions_configurator serverextension to load
    if install:
        configurator_app = EnableJupyterNbextensionsConfiguratorApp(
            user=user, sys_prefix=sys_prefix, logger=logger)
        configurator_app.start()
        nbextensions.enable_nbextension(
            'notebook', 'contrib_nbextensions_help_item/main',
            user=user, sys_prefix=sys_prefix, logger=logger)
    else:
        nbconf_cm = BaseJSONConfigManager(
            config_dir=os.path.join(config_dir, 'nbconfig'))
        for require, section in {
                'contrib_nbextensions_help_item/main': 'notebook'}.items():
            if logger:
                logger.info('- Disabling {}'.format(require))
                logger.info(
                    '--  Editing config: {}'.format(
                        nbconf_cm.file_name(section)))
            nbconf_cm.update(section, {'load_extensions': {require: None}})

    # Set extra template path, pre- and post-processors for nbconvert
    cm = BaseJSONConfigManager(config_dir=config_dir)
    config_basename = 'jupyter_nbconvert_config'
    config = cm.get(config_basename)
    # avoid warnings about unset version
    config.setdefault('version', 1)
    if logger:
        logger.info(
            u'- Editing config: {}'.format(cm.file_name(config_basename)))

    # Set extra template path, pre- and post-processors for nbconvert
    if logger:
        logger.info('--  Configuring nbconvert template path')
    # our templates directory
    _update_config_list(config, 'Exporter.extra_template_pathss', [
        '.',
        jupyter_contrib_nbextensions.nbconvert_support.templates_directory(),
    ], install)
    # our preprocessors
    if logger:
        logger.info('--  Configuring nbconvert preprocessors')
    proc_mod = 'jupyter_contrib_nbextensions.nbconvert_support'
    _update_config_list(config, 'Exporter.preprocessors', [
        proc_mod + '.EmbedImagesPreprocessor',
        proc_mod + '.CodeFoldingPreprocessor',
        proc_mod + '.PyMarkdownPreprocessor',
    ], install)
    if logger:
        logger.info(
            u'- Writing config: {}'.format(cm.file_name(config_basename)))
    _set_managed_config(cm, config_basename, config, logger=logger)


def install(user=False, sys_prefix=False, prefix=None, nbextensions_dir=None,
            logger=None, overwrite=False, symlink=False,
            skip_running_check=False):
    """Install all jupyter_contrib_nbextensions files & config."""
    return toggle_install(
        True, user=user, sys_prefix=sys_prefix, prefix=prefix,
        nbextensions_dir=nbextensions_dir, logger=logger,
        overwrite=overwrite, symlink=symlink,
        skip_running_check=skip_running_check)


def uninstall(user=False, sys_prefix=False, prefix=None, nbextensions_dir=None,
              logger=None, skip_running_check=False):
    """Uninstall all jupyter_contrib_nbextensions files & config."""
    return toggle_install(
        False, user=user, sys_prefix=sys_prefix, prefix=prefix,
        nbextensions_dir=nbextensions_dir, logger=logger,
        skip_running_check=skip_running_check)

# -----------------------------------------------------------------------------
# Private API
# -----------------------------------------------------------------------------


def _err_on_running(skip_running_check=False, runtime_dir=None):
    if skip_running_check:
        return
    try:
        srv = next(list_running_servers(runtime_dir=runtime_dir))
    except StopIteration:
        return

    raise NotebookRunningError("""
Will not configure while a Jupyter notebook server appears to be running.
At least this server appears to be running:

  {}

Note that the json file indicating that this server is running may
be stale, see

    https://github.com/jupyter/notebook/issues/2829

for further details.
""".format(srv))


def _check_conflicting_kwargs(**kwargs):
    if sum(map(bool, kwargs.values())) > 1:
        raise nbextensions.ArgumentConflict(
            "Cannot specify more than one of {}.\nBut recieved {}".format(
                ', '.join(kwargs.keys()),
                ', '.join(['{}={}'.format(k, v)
                           for k, v in kwargs.items() if v])))


def _set_managed_config(cm, config_basename, config, logger=None):
    """Write config owned by the given config manager, removing if empty."""
    config_path = cm.file_name(config_basename)
    msg = 'config file {}'.format(config_path)
    if len(config) > ('version' in config):
        if logger:
            logger.info('--  Writing updated {}'.format(msg))
        # use set to ensure removed keys get removed
        cm.set(config_basename, config)
    else:
        if logger:
            logger.info('--  Removing now-empty {}'.format(msg))
        try:
            os.remove(config_path)
        except OSError as ex:
            if ex.errno != errno.ENOENT:
                raise


def _update_config_list(config, list_key, values, insert):
    """
    Add or remove items as required to/from a config value which is a list.

    This exists in order to avoid clobbering values other than those which we
    wish to add/remove, and to neatly remove a list when it ends up empty.
    """
    section, list_key = list_key.split('.')
    conf_list = config.setdefault(section, Config()).setdefault(list_key, [])
    list_alteration_method = 'append' if insert else 'remove'
    for val in values:
        if (val in conf_list) != insert:
            getattr(conf_list, list_alteration_method)(val)
    if not insert:
        # remove empty list
        if len(conf_list) == 0:
            config[section].pop(list_key)
        # remove empty section
        if len(config[section]) == 0:
            config.pop(section)
