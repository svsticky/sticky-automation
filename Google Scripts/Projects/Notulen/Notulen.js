function onOpen(e) {
  DocumentApp.getUi()
    .createAddonMenu()
    .addSubMenu(DocumentApp.getUi().createMenu('Genereer Notulen')
      .addItem('Naar Alpha', 'generateAlphaNotulen')
      .addItem('Naar Beta', 'generateBetaNotulen')
      .addItem('Naar Final', 'generateFinalNotulen')
    )
    .addItem("Plaats AP's bovenaan", "placeTasksonTop")
    .addItem("Exporteer naar Todoist", "exportToTodoist")
    .addItem("Mail adviesraad", "mailAdvisoryBoard")
    .addToUi();
}

//#############################
//##### TODOIST VARIABLES #####
//#############################

var Todoist = {
  url: "https://api.todoist.com/rest/v1",

  team_inbox_id: ENV_TEAM_INBOX_ID,
  besluiten_id: ENV_BESLUITEN_ID,
  verantwoordelijkheden_id: ENV_VERANTWOORDELIJKHEDEN_ID,

  token: "ENV_BEARER_TOKEN",

  labels: {
    ENV_CHAIRMAN_NAME: ENV_CHAIRMAN,
    ENV_SECRETARY_NAME: ENV_SECRETARY,
    ENV_TREASURER_NAME: ENV_TREASURER,
    ENV_INTERNAL_AFFAIRS_NAME: ENV_INTERNAL_AFFAIRS,
    ENV_EXTERNAL_AFFAIRS_NAME: ENV_EXTERNAL_AFFAIRS,
    ENV_EDUCATION_NAME: ENV_EDUCATION
  }
};

//############################
//#### VISIBLE FUNCTIONS #####
//############################

function placeTasksonTop() {
  var counter = 0;

  Notulen.getTasks("Verantwoordelijk");
  if (!Tasks.Tasks || Tasks.Tasks.length == 0)
    counter++;
  else
    Notulen.placeTasks("Verantwoordelijk");

  Notulen.getTasks("Besluit");
  if (!Tasks.Tasks || Tasks.Tasks.length == 0)
    counter++;
  else
    Notulen.placeTasks("Besluit");

  Notulen.getTasks("AP");
  if (!Tasks.Tasks || Tasks.Tasks.length == 0)
    counter++;
  else
    Notulen.placeTasks("AP");

  if (counter === 3) {
    createAlert(
      "Niets gevonden! Zorg dat je de AP's, besluiten en verantwoordelijkheden wel dikgedrukt maakt!\n\nSyntax: AP iemand: Doe dingen [YYYY-MM-DD]"
    );
    return;
  }
}

function createTask(kind, action, assignee, due_date) {
  // When no label has to be provided, label will be "Onbekend"
  const url = Todoist.url + "/tasks";

  var options = {
    method: "GET",
    headers: {
      Authorization: "Bearer " + Todoist.token
    }
  };

  // Get json from response and check if there is a matching task already existing
  response = UrlFetchApp.fetch(url, options);
  jsonresponse = JSON.parse(response.getContentText());

  let sameTask = jsonresponse.find(task => task.assignee === assignee);
  if (sameTask != null)
    return;

  if (kind === "Verantwoordelijk") {
    var p_id = Todoist.verantwoordelijkheden_id;
  } else if (kind === "Besluit") {
    var p_id = Todoist.besluiten_id;
  } else {
    var p_id = Todoist.team_inbox_id;
  }

  if (assignee === "Onbekend" || assignee === null) {
    var payload = {
      content: action,
      due_date: due_date,
      project_id: p_id
    };
  } else {
    var payload = {
      content: action,
      due_date: due_date,
      assignee: assignee,
      project_id: p_id
    };
  }

  var options = {
    method: "POST",
    payload: JSON.stringify(payload),
    muteHttpExceptions: false,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + Todoist.token,
      "X-Request-Id": uuidv4()
    }
  };
  UrlFetchApp.fetch(url, options);
}

function forEachTask(taskArray) {
  taskArray.forEach(function (Task) {
    var due_date = Task.deadline;
    if (due_date.length != 10)
      //Valid date notation check (I know this is ugly)
      due_date = "";

    const everyone = Object.values(Todoist.labels);

    Task.delegatees.forEach(delegatee => {
      const person = delegatee.toLowerCase().trim();
      switch (person) {
        case "altijd samen":
        case "iedereen":
          for (label of everyone)
            createTask(Task.sortTask, Task.action, label, due_date);
          break;
        case "iemand":
          createTask(Task.sortTask, Task.action, null, due_date);
          break;
        case "random":
          const i = Math.round(Math.random() * 6) - 1;
          createTask(Task.sortTask, Task.action, everyone[i], due_date);
          break;
        default:
          if (Todoist.labels[person] == null)
            createAlert(
              person +
              " is niet gevonden, schrijf namen correct of gebruik 'Iedereen', 'Iemand' of 'Random'"
            );
          else
            createTask(
              Task.sortTask,
              Task.action,
              Todoist.labels[person],
              due_date
            );
          break;
      }
    });
  });
}

function exportToTodoist() {
  var counter = 0;
  Notulen.getTasks("Verantwoordelijk");
  if (!Tasks.Tasks && !Tasks.Tasks.length) {
    counter++;
  }
  this.forEachTask(Tasks.Tasks);

  Notulen.getTasks("Besluit");
  if (!Tasks.Tasks && !Tasks.Tasks.length) {
    counter++;
  }
  this.forEachTask(Tasks.Tasks);

  Notulen.getTasks("AP");
  if (!Tasks.Tasks && !Tasks.Tasks.length) {
    counter++;
  }
  this.forEachTask(Tasks.Tasks);

  if (counter >= 3) {
    createAlert(
      "Niets gevonden! Zorg dat je de AP's, besluiten en verantwoordelijkheden wel dikgedrukt maakt!\n\nSyntax: AP iemand: Doe dingen [YYYY-MM-DD]"
    );
    return;
  }
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Functions for generating notulen
let generateAlphaNotulen = () => generateNotulen("ENV_ALPHA");
let generateBetaNotulen = () => generateNotulen("ENV_BETA");
let generateFinalNotulen = () => generateNotulen("ENV_FINAL");

function generateNotulen(folderName) {
  let id = DocumentApp.getActiveDocument().getId();
  let title = DocumentApp.getActiveDocument().getBody().getChild(0).asText().getText();

  // Copy agenda over to notulen
  let folder = DriveApp.getFileById(id).getParents().next().getParents().next().getFoldersByName(folderName).next();
  let notulen = DriveApp.getFileById(id).makeCopy(title, folder);

  // Replace Agenda in document header
  if (title.indexOf("Agenda") != -1) {
    let notulenId = notulen.getId();
    DriveApp.getFileById(notulenId).setName(title.replace("Agenda", "Notulen"));
    DocumentApp.openById(notulenId).getBody().getChild(0).asText().replaceText("Agenda", "Notulen");
  }
}

function mailAdvisoryBoard() {
  var date = Notulen.getDate();
  var D = new Date(date);
  var _url = "http://numbersapi.com/" + (D.getMonth() + 1) + "/" + D.getDate();
  var payload = { method: "GET" };
  var result = UrlFetchApp.fetch(_url, payload);
  MailApp.sendEmail({
    to: "adviesraad@svsticky.nl",
    subject: `[Adviesraad] BM-Notulen ${date} staan klaar`,
    htmlBody:
      `Lieve adviesraad,<br><br>De notulen van ${date} staan online. Het zou mij en mijn medebestuurders een ongekend groot genoegen zijn als jullie deze zouden kunnen bekijken om jullie wijze inzichten met ons te delen.<br><br>
      Leuk feitje van de dag:<br>
      <i> ${result}</i><br><br>
      <a href='${DocumentApp.getActiveDocument().getUrl()}'>Notulen</a><br><br>
      Groetjes,<br>
      ENV_FULL_SECRETARY_NAME<br>
      Secretaris der Studievereniging Sticky`
  });
}

//############################
//#### NOTULEN FUNCTIONS #####
//############################

var Notulen = {
  MD5: function (input) {
    var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, input);
    var txtHash = "";
    for (i = 0; i < rawHash.length; i++) {
      var hashVal = rawHash[i];
      if (hashVal < 0) {
        hashVal += 256;
      }
      if (hashVal.toString(16).length == 1) {
        txtHash += "0";
      }
      txtHash += hashVal.toString(16);
    }
    return txtHash;
  },

  getTasks: function (sortTask) {
    // sortTask can be: "AP", "Besluit", "Verantwoordelijk"
    Tasks.Tasks = [];

    //Searchpattern: Search for sentences beginning with the task in matter and ending on [x]
    if (sortTask === "AP") {
      var searchPattern = "(AP)";
    } else if (sortTask === "Besluit") {
      var searchPattern = "(Besluit)";
    } else {
      var searchPattern = "(Verantwoordelijk)";
    }

    var body = DocumentApp.getActiveDocument().getBody();

    //Find AP's
    foundElement = body.findText(searchPattern);

    while (foundElement != null) {
      //Position has been found
      var text = foundElement.getElement().asText();
      var textTask = text.copy().deleteText(2, text.getText().length - 1);

      if (textTask.isBold()) {
        var t = new Task(sortTask);
        t.processTask(text.getText());
        Tasks.addTask(t);
      }

      //Update new position
      foundElement = body.findText(searchPattern, foundElement);
    }
  },

  placeTasks: function (kind) {
    //Sort tasks on delegatees
    Tasks.sort();

    //Find title
    var body = DocumentApp.getActiveDocument().getBody();

    //Create header
    if (kind === "AP") {
      var headerText = "Actiepunten";
    } else if (kind === "Besluit") {
      var headerText = "Besluiten";
    } else {
      var headerText = "Verantwoordelijkheden";
    }

    //Insert header
    if (
      body
        .getChild(1)
        .asText()
        .getText() !== headerText
    ) {
      var par = body.insertParagraph(1, headerText);
      par.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    }

    //Insert tasks
    var indexInsert = 1;
    Tasks.Tasks.forEach(function (task) {
      indexInsert++;

      //Insert task
      var listitem = body.insertListItem(indexInsert, task.toString());
      listitem.setGlyphType(DocumentApp.GlyphType.BULLET);
    });
  },

  getDate: function () {
    var re2 =
      "((?:(?:[1]{1}\\d{1}\\d{1}\\d{1})|(?:[2]{1}\\d{3}))[-:\\/.](?:[0]?[1-9]|[1][012])[-:\\/.](?:(?:[0-2]?\\d{1})|(?:[3][01]{1})))(?![\\d])"; // YYYYMMDD 1
    var p = new RegExp(re2, ["i"]);
    var m = p.exec(DocumentApp.getActiveDocument().getName());

    //Date found --> Return date
    if (m != null) {
      return m[1];
    }

    //Date not found --> Prompt user for date
    else {
      var ui = DocumentApp.getUi();
      var response = ui.prompt(
        "Vergaderdatum niet gevonden in de titel. Geef vergaderdatum op (YYYY-MM-DD)",
        ui.ButtonSet.OK_CANCEL
      );
      if (response.getSelectedButton() == ui.Button.CANCEL) {
        return "Onbekend";
      } else {
        if (response.getResponseText().trim.length < 1) return "Onbekend";

        return response.getResponseText();
      }
    }
  }
};

//############################
//#### IMPORTED LIBRARIES ####
//############################

//INSERTLIB Libraries/General.js
//INSERTLIB Libraries/Task.js
//INSERTLIB Libraries/Tasks.js
