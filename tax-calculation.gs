function test() {
  tbrack(75000);
}

function tbrack(salary, type) {
  let actSS = SpreadsheetApp.getActiveSpreadsheet();
  
//   actSS = Active Spreadsheet
//   Below is what would be in the sheet
//   [ 
//   [ 'Rate', 'From','To','Step Rate','For Single Individuals','For Married Individuals Filing Joint Returns','For Heads of Households'],
//   [ 0.1,0,10275,1027.5,'Up to $9,875','Up to $19,750','Up to $14,100'],
//   [ 0.12,10276,41775,3779.8799999999997,'$9,876 to $40,125','$19,751 to $80,250','$14,101 to $53,700'],
//   [ 0.22,41776,89075,10405.78,'$40,126 to $85,525', '$80,251 to $171,050','$53,701 to $85,500'],
//   [ 0.24,89076,170050,19433.76,'$85,526 to $163,300','$171,051 to $326,600','$85,501 to $163,300'],
//   [ 0.32,170051,215951,14688,'$163,301 to $207,350','$326,601 to $414,700','$163,301 to $207,350'],
//   [ 0.35,215952,539901,113382.15,'$207,351 to $518,400','$414,701 to $622,050','$207,351 to $518,400'],
//   [ 0.37,539902,'Infinity','-','$518,401 or more','$622,051 or more','$518,401 or more'] 
//   ]

  try {
    let bracketTable = actSS.getSheetByName("Tax Bracket");
    let percentagesArray = bracketTable.getRange(1, 1, 10, bracketTable.getLastColumn()).getValues();
    console.log(percentagesArray); //row is >>[0][0] and column is [0][0]<<
    let percent = findPercentage(salary, percentagesArray);
    console.log(percent);

    let taxedAmount = findAmount(salary, percent, percentagesArray);

    console.log({taxedAmount});

    console.log(taxedAmount / salary);

    let send = (taxedAmount / salary);
    console.log("Sending ",send); //This is the percentage to send back to take out for federal taxes on individual tax perspective.
    return send;

  } catch (err) {
    console.log(err);
    actSS.toast(err.toString(), "Error", 20);
    return 0;
  }

}

function findAmount(salary, percent, array) { //Taxes Calculator
  let amounts = [];
  let i = 0;

  do {
    i++;
    let nxtFrom = array[i + 1][1];
    let currFrom = array[i][1];
    let percCurrent = array[i][0];

    let total = 0;
    if (array[i][0] !== percent) {
      for (var k = i + 1; k > 1; k--) {
        total = Math.abs(total - array[k][1]);
      }
      total = total * percCurrent;
    } else {
      total = (salary - currFrom) * percCurrent;
    }

    console.log("total for " + array[i][0], total);

    amounts.push(total);

  } while (array[i][0] < percent);

  let item = 0;

  amounts.map((f) => {
    item += f;
  });

  return item;

}

function findPercentage(salary, array) {
  for (var i = 1; i < array.length; i++) { //skipping the headers for each row
    if (salary >= Number(array[i][1]) && salary <= Number(array[i][2])) {
      return array[i][0];
    }
  }
}
