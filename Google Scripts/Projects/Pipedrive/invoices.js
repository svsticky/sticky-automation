var SHEET = null;
var UI = SpreadsheetApp.getUi();
var EXTRA_GEGEVENS_OFFSET = 6; // Zet deze naar het aantal columns die de 'key' van extra gegevens inneemt in de factuurtemplate
var CUSTOM_FIELDS = {
  "EXTRA_GEGEVENS": "ENV_EXTRA_GEGEVENS"
}

function onOpen(e) {
  UI.createAddonMenu()
  .addItem("Create Invoice", "createInvoice")
  .addToUi();
}

function createInvoice() {
  var deal_id = getFromUser('deal_id');
  var deal = getFromPipedriveAsObject(deal_id, "deals");
  var invoice_number = getFromUser('invoice_number');
  fillInvoice(deal, invoice_number);
  renameSpreadsheet(invoice_number);
}

function getFromUser(to_retrieve) {
  var prompt_text = ""
  switch(to_retrieve) {
    case 'deal_id':
      prompt_text = "Vul het ID van de deal in (https://svsticky.pipedrive.com/deal/<ID>):";
      break;
    case 'invoice_number':
      prompt_text = "Vul het factuurnummer in:";
      break;
    default:
      break;
  }
  return UI.prompt(prompt_text, UI.ButtonSet.OK).getResponseText();
}

function getFromPipedriveAsObject(id, entity) {
  try {
    return JSON.parse(UrlFetchApp.fetch("https://api.pipedrive.com/v1/" + entity + "/" + id + "?api_token=ENV_API_KEY"))["data"];
  }
  catch(error) {
    return UI.alert("Er is geen unit gevonden met deze ID");
  }
}

function fillInvoice(deal, invoice_number) {
  SHEET = SpreadsheetApp.getActiveSheet(); //This value can't be set anywhere else because Google is a bitch
  var values = SHEET.getDataRange().getValues();
  for(var row in values){
    var cols = values[row];
    for(var col in cols){
      var cell_content = cols[col];
      if(typeof cell_content === 'string') {
        var cell = SHEET.getRange(parseInt(row) + 1, parseInt(col) + 1);
        if(cell_content[0] === '[') {
          fillCell(deal, invoice_number, cell_content, cell)
        }
      }
    }
  }
}

function fillCell(deal, invoice_number, cell_content, cell) {
  switch(cell_content) {
    case '[BEDRIJFSNAAM]':
      checkAndSetValue(deal.org_id.name, cell);
      break;
    case '[CONTACTPERSOON]':
      checkAndSetValue(deal.person_name, cell);
      break;
    case '[STRAAT+HUISNUMMER]':
      setAddressPartial(deal, 0, cell); // Dit is de index van de plek in de gehele adres regel gezien als array, gesplit op "," (zie ook setAddressPartial())
      break;
    case '[POSTCODE+PLAATS]':
      setAddressPartial(deal, 1, cell);
      break;
    case '[BEDRAG]':
      checkAndSetValue(deal.value, cell);
      break;
    case '[FACTUURNUMMER]':
      checkAndSetValue(invoice_number, cell);
      break;
    case '[EXTRA_GEGEVENS]':
      checkAndSetExtra(deal, cell);
    default:
      break;
  }
}

function checkAndSetValue(value, cell) {
  if(value === null || value === 0) {
    cell.setBackground("Red");
  }
  else {
    cell.setValue(value);
    cell.setBackground("White");
  }
}

function setAddressPartial(deal, index, cell) {
  var address_array = deal.org_id.address.split(", ");
  checkAndSetValue(address_array[index], cell);
}

function renameSpreadsheet(invoice_number) {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.rename("Factuur Sticky " + invoice_number.toString())
}

function checkAndSetExtra(deal, cell) {
  var extra = deal[CUSTOM_FIELDS["EXTRA_GEGEVENS"]];
  if(extra === null || extra === "") {
    cell.setValue(null); // Verwijder de placeholder
  }
  else {
    var lines = extra.split(", ");
    var row = cell.getRow()
    var col = cell.getColumn();
    for(var line in lines) {
      var values = lines[line].split(":");
      SHEET.getRange(row, col).setValue(values[0] + ":");
      SHEET.getRange(row, col + EXTRA_GEGEVENS_OFFSET).setValue(values[1]);
      row += 1;
    }
  }
}

function setPartialAddress(deal, cell, cell_content) {
  var full_address = deal[DEAL_FIELDS["ADRES"]];
  Logger.log(full_address);
}
