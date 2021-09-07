var SHEET = null;
var UI = DocumentApp.getUi();
var CUSTOM_FIELDS = {
  "CONTRACT_TEXT": "ENV_CONTRACT_TEXT"
}

function onOpen(e) {
  UI.createAddonMenu()
  .addItem("Create Contract", "createContract")
  .addToUi();
}

function createContract() {
  var doc = DocumentApp.getActiveDocument();
  var body = doc.getBody();
  var deal_id = UI.prompt("Vul het ID van de deal in (https://svsticky.pipedrive.com/deal/<ID>):", UI.ButtonSet.OK).getResponseText();
  var deal = getFromPipedriveAsObject('deals', deal_id, 0);
  var products = getFromPipedriveAsObject( 'deals', deal_id, 'products?start=0&include_product_data=1');
  replaceInfo(deal, body);
  replaceParts(products, body);
  replacePriceInWords(deal.value, body);
  doc.setName(`Contract Sticky en ${deal.org_id.name} ENV_BOARD_YEARS`);
}

function getFromPipedriveAsObject(entity, id, params) {
  var url = "https://api.pipedrive.com/v1/" + entity + "/" + id + "?api_token=ENV_API_KEY";
  if (params !== 0) {
    url = "https://api.pipedrive.com/v1/" + entity + "/" + id + "/" + params + "&api_token=ENV_API_KEY";
  }
  
  try {
    return JSON.parse(UrlFetchApp.fetch(url))["data"];
  }
  catch(error) {
    return UI.alert("Er is geen unit gevonden met deze ID");
  }
}

function replaceInfo(deal, body) {
  var splitAddress = deal.org_id.address.split(", ");
  body.replaceText('{BEDRIJFSNAAM}', deal.org_id.name);
  body.replaceText('{STRAATHUISNUMMER}', splitAddress[0]);
  body.replaceText('{POSTCODEPLAATS}', splitAddress[1]);
  body.replaceText('{PRIJSCIJFER}', deal.value);
}

function replaceParts(products, body) {
  for(var i = 0; i < body.getNumChildren(); i++) {
    var child = body.getChild(i);
    if(child.getText() === '{ONDERDELEN}') {
      var position = i;
      var part = 1;
      body.removeChild(child);
      for(p in products) {
        var product = products[p];
        var quantity = "";
        if(product.quantity > 1) {
          quantity = " (" + product.quantity + "x)";
        }
        var style = {};
        style[DocumentApp.Attribute.BOLD] = true;
        var header = body.insertParagraph(position, "Punt " + part + ": " + product.name + quantity)
        header.setHeading(DocumentApp.ParagraphHeading.HEADING3).setAttributes(style);
        style[DocumentApp.Attribute.BOLD] = false;
        var text = body.insertParagraph(position + 1, product.product[CUSTOM_FIELDS['CONTRACT_TEXT']]).setAttributes(style);
        position += 2;
        part += 1;
      }
    }
  }
}

function replacePriceInWords(value, body) {
  var prijswoorden = UI.prompt("Klopt het bedrag van €" + value + " voor dit contract? Vul dan hier de 'zegge' in of laat anders dit veld leeg, controleer de gegevens en run \"Create Invoice\" nogmaals", UI.ButtonSet.OK).getResponseText();
  if (prijswoorden !== "") {
    body.replaceText('{PRIJSWOORDEN}', prijswoorden);
  }
}
