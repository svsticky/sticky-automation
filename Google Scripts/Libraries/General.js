function createAlert(alert) {
  var ui;
  try {
  	ui = DocumentApp.getUi();
  }
  catch (e) {
  	ui = SpreadsheetApp.getUi();
  }
  ui.alert(alert);
};
