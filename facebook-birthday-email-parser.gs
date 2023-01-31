function theFacebookBirthdays() {
  let userId = "youremailaddress";
  try {
    let request = {
      userId: userId,
      emailList: ["birthdays@facebookmail.com", "notification@facebookmail.com", "notification+zrdp6evepdoz@facebookmail.com"],
      querys: [{ maxResults: 365, labelIds: ["INBOX", "CATEGORY_SOCIAL"], q: "from:(example@email.com)" }]
    };
    let messages = retrieveAllMessages(request, []);

    let filtMessages = messages.messages.map((f) => { let obj = Gmail.Users.Messages.get(userId, f.id, { fields: "snippet,id,internalDate,labelIds,payload" }); f = { ...f, ...obj }; return f }).map((f) => {
      if (f.body) {
        let may = f.body.match(/<td style="padding:0;color:#65676B;text-align:left;width:100%;font-size:15px;font-weight:400;font-family:Roboto-Regular,Roboto,-apple-system,BlinkMacSystemFont,Helvetica Neue,Helvetica,Arial,sans-serif;">(.*?)<\/td>/g);
        let june = f.body.match(/>(.*?)</g).filter((f) => { return f.match(/\w+/g) && !f.includes("&nbsp;") && f.match(/^>[A-Z]/g) });
        if (may) {
          f.birthdayDate = new Date(may[0]?.match(/>(.*?)</g)[0]?.replace(/>(.*)</g, "$1"));
        }
        if (june) {
          let text1idx = june.findIndex((p) => { return p.includes("Today is") });
          let text2idx = june.findIndex((p) => { return p.includes("Was this email") });
          f.peopleList = june.map((h) => { return inscapeHtml(h.replace(/>(.*)</g, "$1")) }).slice(text1idx + 1, text2idx);
        }
      }

      return f;
    });

    let vals = [["ID", "Date", "Name"]];

    filtMessages.map((f) => {
      if (f.peopleList) {
        f.peopleList.map((k, kx) => {
          if (kx != 0) {
            let date = new Date(f.peopleList[0]);
            vals.push([Utilities.getUuid(), `${date.toLocaleDateString("en-US",{month:"long",day:"numeric"})}`, k]);
          }

        })
      }
    })

    vals = [...new Map(vals.map(item => [`${new Date(item[1]).getDate()}|${new Date(item[1]).getMonth()}|${item[2]}`, item])).values()];

    let spread = Sheets.Spreadsheets.get("1M-XC9ZTv-SCs_m3EwuuYUp7TyiDUV2nybAagnDBqDFg");

    // Uncomment out the comments below if you want to keep the same UUID for the user birthday. Or it will keep refreshing the data as new data.
    
    // let spreadVals = Sheets.Spreadsheets.Values.get(spread.spreadsheetId, spread.sheets[0].properties.title, { valueRenderOption: "FORMATTED_VALUE", dateTimeRenderOption: "FORMATTED_STRING" }).values;

    // vals = vals.concat(spreadVals);

    // vals = [...new Map(vals.map(item => [`${new Date(item[1])?.getDate()}|${new Date(item[1])?.getMonth()}|${item[2]}`, item])).values()]

    Sheets.Spreadsheets.Values.clear({}, spread.spreadsheetId, spread.sheets[0].properties.title);

    Sheets.Spreadsheets.Values.append({ values: vals }, spread.spreadsheetId, spread.sheets[0].properties.title, { valueInputOption: "USER_ENTERED" });


  } catch (err) {
    console.log(err?.stack, err)
  }
}


function retrieveAllMessages(request = {}, result = []) {
  let messages = { messages: [], resultSizeEstimate: 0 };

  function retrieveMessages(requested = {}, results = []) {
    if (requested) {
      messages.resultSizeEstimate += requested.resultSizeEstimate;
      results = results.concat(requested.messages.map((f) => {
        let obj = Gmail.Users.Messages.get(requested.userId, f.id, { fields: "snippet,id,internalDate,labelIds,payload" }); f = { ...f, ...obj };

        if (f.internalDate) {
          var date = new Date((Number(f.internalDate)));
          f.internalDateDesc = date.toLocaleString("en-US", { hour12: true })
        }
        let subjectIndex = f.payload.headers.findIndex((v) => { return v.name === "Subject" });
        if (subjectIndex > -1) {
          f.subject = f.payload.headers[subjectIndex].value;
        }
        let toIndex = f.payload.headers.findIndex((v) => { return v.name === "Delivered-To" });
        if (toIndex > -1) {
          f.to = f.payload.headers[toIndex].value;
        }
        let fromIndex = f.payload.headers.findIndex((v) => { return v.name === "Return-Path" });
        if (fromIndex > -1) {
          f.from = f.payload.headers[fromIndex].value.replace(/(\<|\>)/g, '');
        }
        if (f.threadId) {
          f.payload.parts.filter((k) => { return ["text/plain", "text/html"].includes(k.mimeType) }).map((l) => {
            if (l.mimeType === "text/plain") {
              f.plainBody = Utilities.newBlob(l.body.data).getDataAsString();
            } else if (l.mimeType === "text/html") {
              f.body = Utilities.newBlob(l.body.data).getDataAsString()
            }
          })
        }

        return f;
      }));

      var npt = requested.nextPageToken;

      if (npt) {
        let newOpArg = Object.assign({}, request.shell);
        newOpArg['pageToken'] = npt;
        retrieveMessages(Gmail.Users.Messages.list(request.userId, newOpArg), result);
      } else {
        messages.messages = messages.messages.concat(results);
        return request;
      }

    }
  }

  if (request.emailList) {
    // console.log(request)
    if (request.querys) {
      for (var i = 0; i < request.querys.length; i++) {
        let query = request.querys[i];

        for (var j = 0; j < request.emailList.length; j++) {
          let email = request.emailList[j];
          query.q = query.q.replace(/(\(.*@.*\))/g, email);
          request.shell = query;
          // console.log(request.userId)
          retrieveMessages(Gmail.Users.Messages.list(request.userId, query), result)
        }
      }
    }
  } else {
    request.shell = querys[0];
    retrieveMessages(Gmail.Users.Messages.list(request.userId, request.querys[0]), result);
  }

  return messages;
  
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inscapeHtml(unsafe) {
  return unsafe
    .replace(/(\&amp\;)/g, "&")
    .replace(/\&lt\;/g, "<")
    .replace(/\&gt\;/g, ">")
    .replace(/\&quot\;/g, `"`)
    .replace(/\&#039\;/g, "'");
}




