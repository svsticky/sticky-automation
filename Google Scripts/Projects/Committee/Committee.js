function onOpen(e) {
  DocumentApp.getUi()
    .createAddonMenu()
    .addItem("Genereer agenda", "generateAgenda")
    .addItem("Genereer notulen", "generateNotulen")
    .addItem("Plaats AP's bovenaan", "placeTasksonTop")
    .addToUi();
}

//############################
//#### VISIBLE FUNCTIONS #####
//############################

function placeTasksonTop() {
  var counter = 0;
  Notulen.getTasks();
  if (!Tasks.Tasks || Tasks.Tasks.length == 0)
    counter++;
  else
    Notulen.placeTasks();

  if (counter === 3) {
    createAlert(
      "Niets gevonden! Zorg dat je de AP's wel dikgedrukt maakt!\n\nSyntax: AP iemand: Doe dingen [YYYY-MM-DD]"
    );
    return;
  }
}

function generateNotulen() {
  let id = DocumentApp.getActiveDocument().getId();
  let title = DocumentApp.getActiveDocument().getBody().getChild(0).asText().getText();

  // Copy agenda over to notulen
  let folder = DriveApp.getFileById(id).getParents().next().getParents().next().getFoldersByName("Notulen").next();
  let notulen = DriveApp.getFileById(id).makeCopy(title, folder);

  // Replace Agenda in document header
  let notulenId = notulen.getId();
  DriveApp.getFileById(notulenId).setName(title.replace("Agenda", "Notulen"));
  DocumentApp.openById(notulenId).getBody().getChild(0).asText().replaceText("Agenda", "Notulen");
}

function generateAgenda() {
  // Set document title
  const date = new Date().toISOString().split('T')[0];
  const titleText = `Agenda ${date}`;
  let body = DocumentApp.getActiveDocument().getBody();
  DocumentApp.getActiveDocument().setName(titleText);

  // Insert agenda points
  const points = [
    "Opening",
    "Vaststellen notulist",
    "Vaststellen agenda",
    "Mededelingen",
    "Ingekomen stukken",
    "Vorige AP's",
    "W.V.T.T.K.",
    "Volgende vergadering",
    "Rondvraag",
    "Sluiting"
  ];
  points.forEach((point, index) => {
    body.insertListItem(index, point);
  });

  // Insert agenda title
  body.insertParagraph(0, null);
  let title = body.insertParagraph(0, titleText);
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
}

//############################
//#### IMPORTED LIBRARIES ####
//############################

//INSERTLIB Libraries/Notulen.js
//INSERTLIB Libraries/General.js
//INSERTLIB Libraries/Task.js
//INSERTLIB Libraries/Tasks.js
