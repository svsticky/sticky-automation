//############################
//#### NOTULEN FUNCTIONS #####
//############################

var Notulen = {
  MD5: function(input) {
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

  getTasks: function(sortTask) {
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

  placeTasks: function(kind) {
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
    Tasks.Tasks.forEach(function(task) {
      indexInsert++;

      //Insert task
      var listitem = body.insertListItem(indexInsert, task.toString());
      listitem.setGlyphType(DocumentApp.GlyphType.BULLET);
    });
  },

  getDate: function() {
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
