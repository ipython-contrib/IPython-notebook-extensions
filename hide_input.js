// Adds a button to hide the input part of the currently selected cells
var hide_input = function () {
  // find the selected cell
  var cell = IPython.notebook.get_selected_cell();
  // toggle visibility of the input div
  cell.element.find("div.input").toggle('slow')
}


IPython.toolbar.add_buttons_group([{
      label:'hide input',
      icon:'ui-icon-carrat-1-n',
      callback:hide_input,
}])
