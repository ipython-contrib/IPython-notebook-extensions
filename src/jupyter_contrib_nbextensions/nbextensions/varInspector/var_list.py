import json
from sys import getsizeof

from IPython import get_ipython
from IPython.core.magics.namespace import NamespaceMagics
_nms = NamespaceMagics()
_Jupyter = get_ipython()
_nms.shell = _Jupyter.kernel.shell

try:
    import numpy as np
except ImportError:
    pass    

def _getsizeof(x):
    # return the size of variable x. Amended version of sys.getsizeof
    # which also supports ndarray, Series and DataFrame
    if type(x).__name__ in ['ndarray', 'Series']:
        return x.nbytes
    elif type(x).__name__ == 'DataFrame':
        return x.memory_usage().sum()
    else:
        return getsizeof(x)

def _getshapeof(x):
    #returns the shape of x if it has one
    #returns None otherwise - might want to return an empty string for an empty column
    try:
        return x.shape
    except AttributeError: #x does not have a shape
        try:
            return len(x)
        except TypeError: #object of type .. has no len()
            return None

def _getcontentof(x):
    length = 150
    if type(x).__name__ == 'DataFrame':
        colnames = ', '.join(x.columns.map(str))
        content = "Column names: %s" % colnames
    elif type(x).__name__ == 'Series':
        content = "Series [%d rows]" % x.shape
    elif type(x).__name__ == 'ndarray':
        content = x.__repr__()
    else:
        if hasattr(x, '__len__'):
            if len(x) > length:
                content = str(x[:length])
        else:
            content = str(x)
        if len(content) > 150:
            return content[:150] + " ..."
    return content

def var_dic_list():
    types_to_exclude = ['module', 'function', 'builtin_function_or_method',
                        'instance', '_Feature', 'type', 'ufunc']
    values = _nms.who_ls()
    vardic = [{'varName': v, 'varType': type(eval(v)).__name__, 'varSize': str(_getsizeof(eval(v))), 'varShape': str(_getshapeof(eval(v))) if _getshapeof(eval(v)) else '', 'varContent': _getcontentof(eval(v)) }  # noqa
    
    for v in values if (v not in ['_html', '_nms', 'NamespaceMagics', '_Jupyter']) & (type(eval(v)).__name__ not in types_to_exclude)] # noqa 
    return json.dumps(vardic)


# command to refresh the list of variables
print(var_dic_list())
