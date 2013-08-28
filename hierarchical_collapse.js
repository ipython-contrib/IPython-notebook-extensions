// Adds a button to hide all cells below the selected heading

(function (IPython) {
  "use strict";

  /**
   * Return the level of nbcell.
   *
   * @param {Object} cell notebook cell
   */
  var get_cell_level = function (cell) {

    if ( cell.cell_type === "heading" ) {
      return cell.level;
    } else {
      // headings can have a level upto 6
      // therefore 7 is returned
      return 7;
    }

  }


  /**
   * Find a pivot point above the cell at index index.
   */
  var find_hierarchical_pivot_above = function (index) {
      var current_index = index;
      var pivot_index = index - 1;

      // Restrict the search to cells that are of the same level and lower
      // than the currently selected cell by index.
      var ref_cell = IPython.notebook.get_cell(index);
      var ref_level = get_cell_level( ref_cell );
      var pivot_level = ref_level - 1;
      while( current_index > 0 ) {
          current_index--;
          var cell = IPython.notebook.get_cell(current_index);
          var cell_level = get_cell_level(cell);
          if( cell_level < pivot_level ) {
              if( cell.metadata.heading.collapsed || cell_level === ref_level ) {
                  pivot_index = current_index;
              }
              pivot_level = cell_level;
          }
      }
      return IPython.notebook.get_cell(pivot_index);
  }


  /**
   * Find the bottom of a cell block
   */
  var find_cell_block_bottom_index = function (index){
      var cell = IPython.notebook.get_cell(index);
      var ref_level = get_cell_level(cell);
      var ncells = IPython.notebook.ncells();
      var bottom_index = index;
      var current_index = index;
      var done = false;
      while( current_index <= ncells && !done) {
          current_index++;
          var current_cell = IPython.notebook.get_cell(current_index);
          var cell_level = get_cel_level(current_cell);
          if( cell_level > ref_level ) {
              bottom_index = current_index;
          } else {
              done = true;
          }
      }
      return(bottom_index);
  }


  /*
   * Find hierarchical pivot below
   */
  var find_hierarchical_pivot_below = function (index) {
      var ncells = IPython.notebook.ncells();
      var current_bottom_index = find_cell_block_bottom_index(index)
      if( current_bottom_index + 1 > ncells - 1) {
          return ncells - 1;
      }
      var next_bottom_index = find_cell_block_bottom_index(current_bottom_index + 1);
      // If the last cell in the notebook was found return its index
      return( min(ncells-1,IPython.notebook.get_cell(next_bottom_index)) );
  }


  /*
   * Find pivot below
   */
  var find_pivot_below = function (index) {
      var ncells = IPython.notebook.ncells();

      // Check if current cell is a collapsed heading
      // if so, find the bottom
      var cell = IPython.notebook.get_cell(index);
      var current_bottom_index;
      if( cell.cell_type == "heading" && cell.metadata.heading_collapsed ) {
          current_bottom_index = find_cell_block_bottom_index(index)
      } else {
          current_bottom_index = index;
      }

      if( current_bottom_index + 1 > ncells - 1) {
          return ncells - 1;
      }

      // Check if the next cell is a collapsed heading
      var next_cell = IPython.notebook.get_cell(current_bottom_index + 1);
      var next_bottom_index;
      if( next_cell.cell_type == "heading" && next_cell.metadata.heading_collapsed ) {
          next_bottom_index = find_cell_block_bottom_index( current_bottom_index + 1);
      } else {
          next_bottom_index = current_bottom_index + 1;
      }
      // If the last cell in the notebook was found return its index
      return( min(ncells-1,IPython.notebook.get_cell(next_bottom_index)) );
  }


  /**
   * Insert a cell below the current one.
   * Support heading cells.
   */
  IPython.notebook.insert_cell_below = function (type,index) {
    index = this.index_or_selected(index);
    // check if the selected cell is collapsed
    // open first if a new cell is inserted
    var cell = this.get_cell(index);
    if ( cell.cell_type === "heading" && cell.metadata.heading_collapsed ) {
        toggle_heading(cell);
        cell.metadata.heading_collapsed = false;
    }
    return this.insert_cell_at_index(type, index+1);
  }


  /**
   * Insert a cell above the current one.
   */
  IPython.notebook.insert_cell_above = function (type,index) {
    index = this.index_or_selected(index);
    return this.insert_cell_at_index(type, index);
  }


  IPython.notebook.move_cell_down = function (index) {
        var i = this.index_or_selected(index);
        if ( this.is_valid_cell_index(i) && this.is_valid_cell_index(i+1)) {
            var pivot = this.get_cell_element(i+1);
            var tomove = this.get_cell_element(i);
            if (pivot !== null && tomove !== null) {
                tomove.detach();
                pivot.after(tomove);
                this.select(i+1);
            };
        };
        this.set_dirty();
        return this;
    }


    IPython.notebook.move_cell_up = function (index) {
        var i = this.index_or_selected(index);
        if (this.is_valid_cell_index(i) && i > 0) {
            var pivot = this.get_cell_element(i-1);
            var tomove = this.get_cell_element(i);
            if (pivot !== null && tomove !== null) {
                tomove.detach();
                pivot.before(tomove);
                this.select(i-1);
            };
            this.set_dirty(true);
        };
        return this;
    }


  /**
   * Find the closest heading cell above the currently
   * selected cell which is not yet collapsed. If the
   * currently selected cell is a heading cell, no
   * new cell is sought for.
   */
  var find_toggleable_cell = function (index) {

    // Get selected cell
    var cell = IPython.notebook.get_selected_cell();

    // If the current cell is a heading cell return
    if ( cell.cell_type === "heading" ) {
      return cell;
    } else {
      // Find a heading cell that is not yet collapsed
      var index = IPython.notebook.get_selected_index();
      var is_collapsable = ( (cell.cell_type === "heading") && cell.metadata.heading_collapsed !== true );

      while( index > 0 && !is_collapsable ) {
        index--;
        cell = IPython.notebook.get_cell( index );
        is_collapsable = ( (cell.cell_type === "heading") && cell.metadata.heading_collapsed !== true );
      }
      if( index === 0 && !is_collapsable ) {
        // No candidate was found, return the current cell
        return IPython.notebook.get_selected_cell();
      } else {
        // select his cell and return
        IPython.notebook.select(index);
        return cell;
      }
    }

  }


  /**
   * Hide/reveal all cells in the section headed by cell.
   *
   * @param {Object} cell notebook cell
   */
  var toggle_heading = function (cell) {

    var index = cell.element.index() + 1;
    var section_level = get_cell_level( cell );

    // Check if we have to start iterating over the
    // notebook cells
    var current_cell = IPython.notebook.get_cell( index );
    var cell_level = get_cell_level( current_cell );

    var enable_toggle = true;
    var switch_heading_level = 6;

    while( cell_level > section_level ) {

      // Hide/reveal regular cells until a heading is found that is collapsed/revealed
      // then stop collapsing/revealing until a new heading is found of that level
      if( cell_level <= switch_heading_level ) {
        if( current_cell.metadata.heading_collapsed === true ) {
          enable_toggle = false;
          // do toggle the heading
          current_cell.element.slideToggle();
          // mark the next level from which we can update enable_toggle
          switch_heading_level = get_cell_level( current_cell );
        } else {
          enable_toggle = true;
        }
      }

      // Hide the current cell
      if ( enable_toggle ) {
        current_cell.element.slideToggle();
      }

      // Proceed to the next cell
      index++;
      current_cell = IPython.notebook.get_cell( index );
      if( current_cell === null )
        break;
      cell_level = get_cell_level( current_cell );
    }

  };


  /**
   * Initialize the extension.
   * Hides all cells that were marked as collapsed.
   */
  var init_toggle_heading = function (){

    // Add a button to the toolbar
    IPython.toolbar.add_buttons_group([{
      label:'toggle heading',
      icon:'icon-double-angle-up',
      callback: function () {
        var cell = find_toggleable_cell();
        toggle_heading( cell );

        // Mark as collapsed
        if ( cell.metadata.heading_collapsed ) {
          cell.metadata.heading_collapsed = false;
        } else {
          cell.metadata.heading_collapsed = true;
        }
      }
    }]);

    // toggle all cells that are marked as collapsed
    var cells = IPython.notebook.get_cells();
    cells.forEach( function (cell){
      if( cell.metadata.heading_collapsed ){
        toggle_heading(cell)
      }
    }
    );

    // Write a message to the console to confirm the extension loaded
    console.log("hierarchical_collapse notebook extension loaded correctly");

    return true;
  }


  // Initialize the extension
  init_toggle_heading();

}(IPython));
