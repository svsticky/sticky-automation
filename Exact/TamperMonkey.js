// ==UserScript==
// @name         Exact Magic
// @version      0.5
// @description  Collection of functions that are added as buttons to Exact
// @author       Yorick van Zweeden
// @match        https://start.exactonline.nl/docs/*
// ==/UserScript==
/*jshint boss:true */

/*
 * Insert button that allows the user to toggle between showing/hiding account holder
 * e.preventDefault is used to block a "Sure you want to leave" popup
 * This function is immediately-invoking so the buttons will automatically be added.
 */
(function (){
  //Create buttons
  var button = $('<button/>')
      .text('Toggle Relation')
      .click(function (e) { Mongoose.toggleRelation(); e.preventDefault(); }, false)
      .addClass("exButton");
  var button2 = $('<button/>')
      .text('Insert Mongoose')
      .click(function (e) { Mongoose.insert(); e.preventDefault(); }, false)
      .addClass("exButton");

  //Append buttons
  $("#buttonBar").append(button, button2);
})();

/*
 * XPath query evaluator
 * Allows tampermonkey scripts to use xpath to navigate through nodes
 */
function _x(STR_XPATH) {
  var xresult = document.evaluate(STR_XPATH, document, null, XPathResult.ANY_TYPE, null);
  var xnodes = [];
  var xres;
  while (xres = xresult.iterateNext()) {
      xnodes.push(xres);
  }

  return xnodes;
}

var Mongoose = {
  /*
   * Insert Mongoose transactions in bankrecords(NL:'Bankboekingen') based on keyword and input data
   */
  insert : function() {
    //Get all TR's (each contains an input row)
    var trs = Array.prototype.slice.call($(_x(Config.TableXPath)));

    //Find row with bundled Mongoose transactions
    trs.every(function(row) {
      //Get description of the row
      var elem = $(row).find(Config.ExactOnline.description);

      //Description contains keyword --> Fill data
      if (elem.val() && elem.val().indexOf(Config.Keyword) >= 0) {
        Mongoose.Transactions.fill(row, Mongoose.Transactions.get());

        //Keyword should only appear once!
        return false;
      }
      return true;
    });
  },

  /*
   * Toggles the visibility of extra data in the field 'Omschrijving'
   * Example: Y.G.L. VAN ZWEEDEN Filmavond Yorick van Zweeden NL11RABO123456789 <> Filmavond Yorick van Zweeden
   */
  toggleRelation : function() {
    //Get all TR's (each contains an input row)
    var trs = Array.prototype.slice.call($(_x(Config.TableXPath)));

    //Toggle data visibility for each row
    trs.some(function(tr) {
      var elem = $(tr).find(Config.ExactOnline.description);

      if (!elem.val()) {
        return false;
      }

      if (elem.attr("relation")) {

        //Add rubbish's value
        var line = elem.attr("relation") + elem.val();
        elem.val(line).removeAttr("relation");

      } else {

        //Save rubbish to an attribute
        var relation = elem.val().match(/.*  /);
        if (relation) {
          elem.attr("relation", relation);
        }

        //Remove rubbish and update value
        var line = elem.val().replace(/.*  /, "").replace(/NL.*/, "").trim();
        elem.val(line);
      }
    });
  },

  //Object containing all functions related to transactions
  Transactions:{
    //Get transactions using a prompt
    get : function() {
      var transactions = [];
      var response = window.prompt("Enter data");
      transactions = JSON.parse(response);

      if (transactions.length == 0)
        alert("No transactions");

      return transactions;
    },

    fill : function(row, transactions) {
      //Add as many rows as transactions
      var addRow = $(row).find(Config.ExactOnline.addRow);
      for (var i = transactions.length - 2; i >= 0; i--) {
        addRow.click();
      }

      //Fill rows with data
      for (var i = 0; i < transactions.length; i++) {
        this.fillSingle(row, transactions[i]);
        row = row.nextSibling;
      }
    },

    fillSingle : function(row, transaction) {
      //Trigger onChange is used to make Exact Online validate the field

      ExactOnline = Config.ExactOnline;
      Sticky = Config.Sticky;

      //Relatie
      $(row).find(ExactOnline.relation)
        .val(Sticky.relation)
        .trigger("change");

      //Grootboekrekening
      $(row).find(ExactOnline.account)
        .val(Sticky.account)
        .trigger("change");

      //Omschrijving
      $(row).find(ExactOnline.description)
        .val(Sticky.description + transaction.name);

      //BTW-code
      $(row).find(ExactOnline.VAT)
        .val(Sticky.VAT)
        .trigger("change");

      //Bedrag in
      $(row).find(ExactOnline.credit)
        .val(transaction.price.toString().replace('.',','))
        .trigger("change");
    }
  }
};

var Config = {
  //Identifying keyword for the batch of Mongoose Transactions
  Keyword : "REFNR.",

  //Identifying XPath for the table containing the records (NL: 'Boekingen')
  TableXPath : "//*/table[@id='grd']/tbody/tr",

  //Mapping of fields to jQuery selectors
  ExactOnline:{
    addRow : "td:nth-child(6) button",
    //NL: 'relatie'
    relation : "td:nth-child(8) input:nth-child(2)",
    //NL: 'grootboek'
    account : "td:nth-child(9) input:nth-child(2)",
    //NL: 'omschrijving'
    description : "td:nth-child(10) input",
    //NL: 'btw-code'
    VAT : "td:nth-child(12) input:nth-child(2)",
    //NL: 'bedrag in'
    credit : "td:nth-child(14) input"
  },

  //Mapping of Sticky configuration
  Sticky:{
    //NL: 'relatie' > "Studievereniging Sticky"
    relation : "170",
    //NL: 'grootboek' > "Verkoop Mongoose"
    account : "8002",
    //NL: 'omschrijving' > prefix
    description : "Mongoose ",
    //NL: 'btw-code' > 9%
    VAT : "9",
  },
};
