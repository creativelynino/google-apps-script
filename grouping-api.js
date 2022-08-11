
//

/**
 * Initially gets the information of each distro list (group email list) and gets the users and their roles. Helps to identify users within a group email.
 * This only works with Google Groups. Which you will need in your G-Suite in order to perform this function. 
 * 
 * @since 1.0.0
 * 
 * @copyright Creatively Nino
 * 
 * @param {string} email The email you want to look up for emails below.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {object} [options] Options for adjustments when returning data.
 * -----------------------------------------------------------------------------------------------------------------------
 * @param {boolean} options.returnArrayObject Adjustment to output of data. Boolean (True) returns an array of emails connected to the grouping email. Boolean (False) returns the emails via the active google spreadsheet that it can find. 
 * 
 * 
 **/
function groupAPItoSheet(email = '', options = { returnArrayObject: false }) {

  var arrayListBoolean = false;

  if (options) {
    if (options.returnArrayObject) {
      arrayListBoolean = options.returnArrayObject;
    }
  }


  let ss = SpreadsheetApp.getActiveSpreadsheet()

  let ssid = ss.getId();

  let sResultSheet;

  if (!arrayListBoolean) {
    let nameOfSheet = "Group Results";
    let oldName = "Archive";
    let len = ss.getSheets().filter((f) => { return f.getName().toLowerCase().includes(`${nameOfSheet}`) }).length;
    let found = len > 0, count = len + 1;
    console.log(found, len, count);

    if (found) {
      for (y = 1; y < count; y++) {
        sResultSheet = ss.getSheetByName(`${nameOfSheet}-${y}`); console.log(sResultSheet.getName());
        if (sResultSheet != null) {
          let sRange = sResultSheet.getRange(1, 1, 2, sResultSheet.getLastColumn()).getValues();
          let newName = `${nameOfSheet}-${y + 1}`;
          console.log(sRange, newName);
          console.log(sRange.join(",").toString().toLowerCase().includes(email.toLowerCase()));
          if (sRange.join(",").toString().toLowerCase().includes("report") && !sRange.join(",").toString().toLowerCase().includes(email.toLowerCase())) {
            if (ss.getSheetByName(newName) == null) {
              ss.insertSheet().setName(newName);
              ss.moveActiveSheet(ss.getSheets().length)
              sResultSheet = ss.getSheetByName(newName);
              break;
            }
          } else {
            let oldList = ss.getSheets().filter((h) => { return h.getName().includes(oldName) && h.getName().includes(`-${y} (${oldName}`) });
            console.log(oldList.length);
            let b = 1;
            if (oldList.length > 0) {
              b = b + oldList.length;
            }
            sResultSheet.setName(`${nameOfSheet}-${y} (${oldName}-${b})`).hideSheet();
            let newName = `${nameOfSheet}-${y}`;
            ss.insertSheet().setName(newName);
            sResultSheet = ss.getSheetByName(newName);
            break;
          }
        }
      }
    } else {
      sResultSheet = ss.insertSheet().setName(`${nameOfSheet}-1`);
    }
    /* 
        if (len > 0) {
          sResultSheet = ss.getSheetByName(`${nameOfSheet}-${len}`);
          if (sResultSheet.getRange(1, 1).getValue().toString().toLowerCase().includes("report")) {
            let count = len + 1;
            let newName = `${nameOfSheet}-${count}`;
            ss.insertSheet().setName(newName);
            sResultSheet = ss.getSheetByName(newName);
          }
        } else {
          sResultSheet = ss.insertSheet().setName(`${nameOfSheet}-${len + 1}`)
        } */

  }

  let dataToReturn = groupAPI.findGroup(email);

  let returnVal = [];

  try {
    dataToReturn.map((f, findex, farray) => {
      f.in_multiple_group_indicator = "N";
      if (farray.filter(key => String(key.email).toUpperCase() === String(f.email).toUpperCase()).length > 1) {
        f.in_multiple_group_indicator = "Y";
      }
    })
    if (!arrayListBoolean) {
      for (var i = 0; i < Math.max(dataToReturn.length); i++) {
        let fa = dataToReturn[i],
          fa1 = dataToReturn[i + 1];

        if (i === 0) {
          let keys = Object.keys(fa1);
          keys.unshift("Report Date", "Report Month");
          keys = keys.map((f) => {
            if (String(f).split(/\_/g).length > 1) {
              let g = String(f).split(/\_/g);
              g = g.map((k) => { return capsFirst_(String(k)) });
              f = g.join(' ')
            }
            return capsFirst_(f.toString())
          });

          returnVal.unshift(keys);

        }

        let vals = Object.values(fa);
        let newDate = new Date();
        let newDateMth = new Date(newDate.getFullYear(), newDate.getMonth());
        vals.unshift(newDate, newDateMth);
        vals = vals.map((f, findex) => {
          if (Array.isArray(f)) {
            return JSON.stringify(f);
          } else {
            return f;
          }
        })

        returnVal.push(vals);

      }
    }

    if (!arrayListBoolean) {
      sResultSheet.getRange(sResultSheet.getLastRow() + 1 || 1, 1, returnVal.length, returnVal[0].length).setValues(returnVal);
      return []
    } else {
      return dataToReturn;
    }

  } catch (err) {
    console.log(err, err.stack);
    return [];
  }


}



/* 
Script Custodian: Frank Brown IV
Function: groupAPI_()
Last Edited: 5/3/2022 9:20 AM EST
Description: This function is to gather information on group emails and all of the emails attached.
 */

/**
 * Description:
 * 
 * @param {string} valueNameHere <--DescriptionHere-->
 * ----------------------------------------------------------------------------
 * @param {array} valueNameHere <--DescriptionHere-->
 * ----------------------------------------------------------------------------
 * @param {number} valueNameHere <--DescriptionHere-->
 * ---------------------------------------------------------------------------- 
 * @param {object} valueNameHere <--DescriptionHere-->
 * ----------------------------------------------------------------------------
 * @param {interface} valueNameHere <--DescriptionHere-->
 * ----------------------------------------------------------------------------
 * 
 * 
 */







const groupAPI = {
  findGroup: function (email) {
    return checkGroup_(email);
  }
}

const types = { group: 'Group', user: 'User', unknown: "Unknown" }

function checkGroup_(groupId = '') {
  groupId = String(groupId); //Setting the object to a string if it wasn't.
  let groupCheck, allEmails = [], g = [];

  //Checking to see if the email provided is a group email.
  try {
    groupCheck = GroupsApp.getGroupByEmail(groupId);
  } catch (err) {
    console.log(err, err.stack);
    return [{ email: groupId, type: types.unknown, parent: types.unknown, parent_name: types.unknown, name: nameSplitReturn_(groupId), role: String("SELF") }];
    return [];
  }

  let gchildren = groupCheck.getGroups();

  if (groupCheck.getEmail()) {
    allEmails.push({ email: groupCheck.getEmail(), type: types.group, parent: groupCheck.getEmail(), parent_name: groupCheck.getEmail().split(/\@/g)[0], name: nameSplitReturn_(groupCheck.getEmail()), role: "SELF" })
  }


  allEmails = getGUs_(groupCheck, allEmails);


  for (var i = 0; i < gchildren.length; i++) {
    let gCchild = gchildren[i];
    allEmails = getGUs_(gCchild, allEmails);

    if (i >= (gchildren.length - 1)) {

      if (gCchild.getGroups().length > 0) {
        let pCchild = gCchild.getGroups();
        for (var j = 0; j < pCchild.length; j++) {
          g.push(pCchild[j]);
        }
      }

      if (g.length > 0) {
        i = -1;
        gchildren = g;
        g = [];
      }

    } else {

      if (gCchild.getGroups().length > 0) {
        let pCchild = gCchild.getGroups();
        for (var j = 0; j < pCchild.length; j++) {
          g.push(pCchild[j]);
        }
      }

    }

  }

  //Uncomment below if you don't want duplicate emails to show in the output. This returns deduplicates the list of emails.
  //allEmails = [...new Map(allEmails.map(item => [item['email'], item])).values()];

  return allEmails;


}



function capsFirst_(item = '') {
  return String(item).slice(0, 1).toUpperCase() + String(item).slice(1, String(item).length);
}

function nameSplitReturn_(email = '') {
  try {
    let nameSplit = String(email.split(/\@/g)[0]);
    let splitName = nameSplit.split("."); //use this only if you have emails with first.lastname@yourdomain.com
    let fname = capsFirst_(splitName[0]);
    fname = fname.replace(/\d+/gm, '').trim();
    let lname;
    if (splitName.length > 2) {
      lname = splitName[splitName - 1];
      lname = String(lname).replace(/\d+/gm, '').trim();
      lname = capsFirst_(lname);
    } else {
      lname = splitName[1];
      lname = String(lname).replace(/\d+/gm, '').trim();
      lname = capsFirst_(lname);
    }

    let fullName = `${fname} ${(lname !== undefined && lname !== null && lname !== 'Undefined') ? lname : ''}`;

    return fullName.trim();

  } catch (err) {
    console.log(err, err.stack);
    return email;
  }
}

function getGUs_(groupObj = {}, allEmails = []) {
  try {

    allEmails = allEmails.concat(getGroupGroups_(groupObj));
    allEmails = allEmails.concat(getGroupUsers_(groupObj));

  } catch (err) {
    console.log(err, err.stack);
    return allEmails;
  }

  return allEmails;

}



function getGroupUsers_(groupObj) {

  let group = GroupsApp.getGroupByEmail(groupObj.getEmail());

  let users = group.getUsers();

  users = users.map((f) => {
    return { email: f.getEmail(), type: types.user, parent: group.getEmail(), parent_name: group.getEmail().split(/\@/g)[0], name: nameSplitReturn_(f.getEmail()), role: String(group.getRole(f.getEmail())) }
  });

  return users;

}

function getGroupGroups_(groupObj) {

  let group = GroupsApp.getGroupByEmail(groupObj.getEmail());

  let users = group.getGroups();

  users = users.map((f) => {
    return { email: f.getEmail(), type: types.group, parent: group.getEmail(), parent_name: group.getEmail().split(/\@/g)[0], name: nameSplitReturn_(f.getEmail()), role: String(group.getRole(f.getEmail())) }
  });

  return users;

}



