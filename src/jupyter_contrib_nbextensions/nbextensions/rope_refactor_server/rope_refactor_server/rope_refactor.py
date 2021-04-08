import io

import rope.base.project
from rope.refactor.extract import ExtractMethod
from rope.refactor.extract import ExtractVariable
from rope.refactor.inline import create_inline
from rope.refactor.rename import Rename

TEMP_PATH = './temp.py'


def extract_variable(source_string, start, end, new_name):
    if new_name == '':
        new_name = 'extracted_variable'
    project, resource = make_temporary_project_and_resource(source_string)

    extractor = ExtractVariable(project, resource, start, end)
    changes = extractor.get_changes(new_name, similar=True)

    return get_result(changes, project, resource)


def rename(source_string, start, end, new_name):
    if new_name == '':
        new_name = 'renamed_variable'
    project, resource = make_temporary_project_and_resource(source_string)

    renamer = Rename(project, resource, start)
    changes = renamer.get_changes(new_name)

    return get_result(changes, project, resource)


def extract_method(source_string, start, end, new_name):
    if new_name == '':
        new_name = 'extracted_method'
    project, resource = make_temporary_project_and_resource(source_string)

    extractor = ExtractMethod(project, resource, start, end)
    changes = extractor.get_changes(new_name, similar=True)

    return get_result(changes, project, resource)


def inline(source_string, offset):
    project, resource = make_temporary_project_and_resource(source_string)
    inliner = create_inline(project, resource, offset)
    changes = inliner.get_changes()

    return get_result(changes, project, resource)


def make_temporary_project_and_resource(source_string):
    # write source text to string, because rope can only process whole files
    file = io.open(TEMP_PATH, mode='w')
    file.write(source_string)
    file.close()

    # make project and resource from the temp file
    project = rope.base.project.Project('.')
    resource = project.get_resource('temp.py')

    return project, resource


def get_result(changes, project, resource):
    # perform the changes
    project.do(changes)
    project.validate(resource)
    project.close()

    # get the refactored code from the temp file and return it
    file = io.open(TEMP_PATH)
    refactored_code = file.read()
    file.close()

    return refactored_code
