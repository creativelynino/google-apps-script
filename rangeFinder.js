

/**
 * Find the first value of the sheet/array. This will look up the first match of the specific value. This will give you the row and col that starts at 0 not 1 on the sheet/array. Make sure to add 1 when trying to use this within a getRange() formula.
 * 
 * Great for automating within your code. No need to have a set range, this can make your range dynamic. Also gives the user the ability to change columns/rows around without losing the placement of the value.
 *
 * Example:
 * let ss = SpreadsheetApp.getActiveSpreadsheet();
 * let s = ss.getActiveSheet():
 * let param = findRange (s, "value");
 * 
 * How to insert results:
 * 1. let range = s.getRange(param.row+1, param.col+1).getValue();//Get value base on row and column number
 * 2. let range = s.getRange(param.A1Notation).getValue(); //Get value base on A1Notation e.g. - "A50"
 * 
 * @since 1.0.0
 * 
 * @copyright Creatively Nino
 * 
 * @param {interface | array} activeSheet Put the active sheet here. I.E. - SpreadsheetApp.getActiveSpreadsheet().getActiveSheet().
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {string} value The value you want to search for in the sheet. Make sure it is a string.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {object} [options] Options for adjustments when selecting and returning data.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {number} options.rowOffest Adjustment on where to select data point(s) on a given row.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {number} options.colOffset Adjustment on where to select data point(s) on a given column.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {number} options.skip Skip vertain instances of the searched value within the sheet/array
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {boolean} options.getAll Boolean to return all instances of the value in the sheet/array.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {boolean} options.caseSens Boolean to find instances of the value in a case sensitive format.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {object} options.selectRange This is a particular range to search for the value in the sheet/array.
 * -----------------------------------------------------------------------------------------------------------------------
 * @return {object | object[]} Returns a object or array of objects based on the options. Default is an object. * 
 * 
 * 
 **/

function findRange(activeSheet, value = "", options = {}) {
  try {
    //Set variables
    var v1,
      rowOffset,
      colOffset,
      selectRange,
      skip = 0,
      collectAll = false,
      caseSens = false, //Case Sensitivity
      allRanges = [];

    //Check for any option parameters and apply them to the variables above.

    if (options) {
      if (options.rowOffset) {
        rowOffset = Number(options.rowOffset);
      }

      if (options.colOffset) {
        colOffset = Number(options.colOffset);
      }

      if (options.skip) {
        skip = Number(options.skip);
      }

      if (options.selectRange) {
        if (typeof options.selectRange === "object" && !Array.isArray(options.selectRange)) {
          selectRange = options.selectRange;
        }
      }

      if (options.getAll) {
        collectAll = true;
      }

      if (options.caseSens) {
        caseSens = true;
      }
    }

    //Get the preferred selected range or get the default range

    if (selectRange) {

      try {
        let row = ((selectRange.row > 1) ? selectRange.row : 1);
        let col = ((selectRange.col > 1) ? selectRange.col : 1);
        let maxRow = ((selectRange.maxRow > row) ? selectRange.maxRow : activeSheet.getLastRow());
        let maxCol = ((selectRange.maxCol > col) ? selectRange.maxCol : activeSheet.getLastColumn());
        v1 = activeSheet.getRange(row, col, maxRow, maxCol).getValues();
      } catch (err) {
        console.log("Select Range Error")
        console.log(err, err.stack);
      }

    } else {
      if (Array.isArray(activeSheet)) {
        if (activeSheet[0]) {
          v1 = activeSheet;
        } else {
          throw "Array needs to be 2D."
        }
      } else {
        v1 = activeSheet.getDataRange().getValues();
      }
    }

    //Search for the value, based on the case sensitivity, in the 2D Array

    for (var f = 0; f < v1.length; f++) {
      for (var h = 0; h < v1[f].length; h++) {
        var v2 = v1[f][h];
        var bool = caseSens ? v2.toString().replace(/\s/g, "").includes(value.replace(/\s/g, "")) : v2.toString().toLowerCase().replace(/\s/g, "").includes(value.toString().toLowerCase().replace(/\s/g, ""));
        if (bool) {
          if (skip === 0 || skip === undefined || skip === null) {
            let rOff = ((rowOffset) ? rowOffset : 0);
            let cOff = ((colOffset) ? colOffset : 0);
            let retval = { "row": f + rOff, "col": h + cOff, "A1Notation": "" };
            if (!Array.isArray(activeSheet)) {
              retval["A1Notation"] = activeSS.getRange(retval.row + ((rowOffset) ? 0 : 1), retval.col + ((COLOFFSET) ? 0 : 1)).getA1Notation();
            }

            //Return the position of the match

            if (!collectAll) {
              return retval;
            }

            allRanges.push(retval);

          }

          skip--; //Keeps skipping until zero'd out. 

        }
      }
    }

    //Return array of matched position objects i.e. - [{ row: 1, col: 4}, { row: 5, col: 6}, ...]

    if (collectAll) {
      return allRanges;
    }

    //Return null because nothing matched.

    return null;

  } catch (err) {

    //Share error and return nothing because there is an error.

    console.log(err, err.stack);

    return null;
  }
}

