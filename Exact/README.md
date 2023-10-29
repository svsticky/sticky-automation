# Tampermonkey script
This script is used in Exact Online to add some automations to make the life of the board easier.

### Installation
1. Install Tampermonkey
    * Chrome: https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
    * Firefox: https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/
1. Click the Tampermonkey icon
1. Click _Create a new script_
1. Copy the contents of the script into the code editor
1. Save the script
1. Refresh any page that is relevant to the script

It should work now.

### TamperMonkey.js

##### Insert Mongoose
When editing _Bankboekingen_, a button is added named _Insert Mongoose_. When clicking this button, a dialog will popup. It will require the JSON output of Koala > Payments > Mongoose. When clicking [ENTER], all the transactions in the JSON output will be inserted in to Exact. This is useful to the treasurer as around ten of thesetransactions happen almost every day.
