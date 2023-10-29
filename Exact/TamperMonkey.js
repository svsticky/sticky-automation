// ==UserScript==
// @name         Exact Magic
// @version      0.6
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
  console.log(`Exact Magic v${GM_info.script.version}`);

  function openInsert(e) {
      Mongoose.insert();
      e.preventDefault();
  };

  // Create the button
  const mongooseButton = $('<button/>')
  .text('Insert Mongoose')
  .on("click", openInsert)
  .addClass("exButton");

  //Append buttons
  $("#buttonBar").append(mongooseButton);
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
      const trs = Array.prototype.slice.call($(_x(Config.TableXPath)));

      var inserted = false;
      const trx = Mongoose.Transactions.get();

      // No sense in filling if we have no transactions
      if (!trx || trx.length <= 0) return;

      //Find row with bundled Mongoose transactions
      trs.every(function(row) {
          //Get description of the row and check if it contains the keyword
          const descElem = $(row).find(Config.ExactOnline.description);
          const isMatch = descElem.val() && descElem.val().indexOf(Config.Keyword) >= 0;

          if (isMatch) {
              // First check if the date matches, abort if not
              const checkDate = Mongoose.checkDate(row, trx[0]);
              if (!checkDate.success) {
                  alert (`Incorrect import date! Expected: ${checkDate.expected.toLocaleDateString()}`);
                  return false; //Abort
              }

              // We only insert once, delete the rest of the matching rows
              // there can be multiple matching rows because the transfers
              // for each provider (vpay/maes) is transferred separately
              if (!inserted) {
                  Mongoose.Transactions.fill(row, trx);
                  inserted = true;
              } else {
                  const delRow = $(row).find(Config.ExactOnline.delRow);
                  delRow.trigger("click");
              }
          }

          return true;
      });
  },

  /*
  * Check if the transaction date matches
  * We need to have an exact difference of 1 day between the
  * mongoose export and the bank mutation. This is because
  * the money that was paid on, for example, a Monday will be
  * transferred to us on a Tuesday.
  */
  checkDate : function(row, trx) {
      // For exactonline we need to 'flip' the date to get it to iso
      const trsDateVal = $(row).find(Config.ExactOnline.date).val();
      const trsDateAr = Config.ExactOnline.datefmt.exec(trsDateVal);

      // Decrease month by 1 because Jan=0, decrease day by 1 because we want yesterday
      const trsDate = new Date(trsDateAr[3], trsDateAr[2]-1, trsDateAr[1]-1);
      const trxDate = new Date(Date.parse(trx.date+"T00:00:00"));
      return { success: trsDate.getTime() === trxDate.getTime(), expected: trsDate};
  },

  //Object containing all functions related to transactions
  Transactions:{
      //Get transactions using a prompt
      get : function() {
          var transactions = null;
          var response = window.prompt("Enter data");
          if (response && response !== "") transactions = JSON.parse(response);
          if (!transactions) alert("No transactions");
          return transactions;
      },

      fill : function(row, transactions) {
          //Add as many rows as transactions
          var addRow = $(row).find(Config.ExactOnline.addRow);
          for (var i = transactions.length - 2; i >= 0; i--) {
              addRow.trigger("click");
          }

          //Fill rows with data
          for (i = 0; i < transactions.length; i++) {
              this.fillSingle(row, transactions[i]);
              row = row.nextSibling;
          }
      },

      fillSingle : function(row, transaction) {
          //Trigger onChange is used to make Exact Online validate the field
          var exactOnline = Config.ExactOnline;
          var sticky = Config.Sticky;

          //Relatie
          $(row).find(exactOnline.relation)
              .val(sticky.relation)
              .trigger("change");

          //Grootboekrekening
          $(row).find(exactOnline.account)
              .val(sticky.account)
              .trigger("change");

          //Omschrijving
          $(row).find(exactOnline.description)
              .val(sticky.description + transaction.name);

          //BTW-code
          $(row).find(exactOnline.VAT)
              .val(sticky.VAT)
              .trigger("change");

          //Bedrag in
          $(row).find(exactOnline.credit)
              .val(transaction.price.toString().replace('.',','))
              .trigger("change");
      },
  }
};

var Config = {
  //Identifying keyword for the batch of Mongoose Transactions
  Keyword : "REFNR. 0B070M",

  //Identifying XPath for the table containing the records (NL: 'Boekingen')
  TableXPath : "//*/table[@id='grd']/tbody/tr",

  //Mapping of fields to jQuery selectors
  ExactOnline:{
      delRow : "td:nth-child(2) button",
      addRow : "td:nth-child(6) button",

      //NL: 'datum'
      date : "td:nth-child(7) input",
      datefmt : /^(\d{2})-(\d{2})-(\d{4})$/,

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
