function Task(ST) {
  //Information of task
  this.done = false; //Status of AP (done or not)
  this.date = "Onbekend"; //Date of creation
  this.delegatees = ["Onbekend"]; //Delegatee: Who needs to do this AP?
  this.action = "Onbekend"; //Action: What needs to be done?
  this.deadline = "Onbekend"; //Deadline: What is the latest date when this AP should be done?
  this.notes = ""; //Notes: Any notes regarding the AP (default is blank)
  this.sortTask = ST; //ST = "AP", "Besluit", "Verantwoordelijk"

  //Returns stringified task
  this.toString = function() {
    var note = "";
    if (this.notes && this.notes !== "Onbekend") {
      note = " {" + this.notes + "}";
    }
    if (this.deadline instanceof Date) {
      this.deadline =
        this.deadline.getFullYear() +
        "-" +
        ("0" + (this.deadline.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + this.deadline.getDate()).slice(-2);
    }
    if (this.delegatees[0] !== "Onbekend") {
      return (
        this.sortTask +
        " " +
        this.delegatees.toString() +
        ": " +
        this.action +
        " [" +
        this.deadline +
        "]" +
        note
      );
    } else {
      return (
        this.sortTask + ": " + this.action + " [" + this.deadline + "]" + note
      );
    }
  };

  //Convert string to task
  this.processTask = function(text) {
    var getNext = function(replaceregex, endregex) {
      text = text.replace(replaceregex, "");
      var index = text.search(endregex);
      if (index === -1) {
        return "Onbekend";
      }

      var result = text.substring(0, index).trim();
      text = text.substring(index);
      return result;
    };

    //Set date of creation for today
    this.date = Notulen.getDate();

    //Get delegatee(s)
    if (this.sortTask === "AP") {
      let users = getNext(/AP */i, /: ?/);
      this.delegatees = users.split(",");
    }

    if (this.sortTask === "Verantwoordelijk") {
      let users = getNext(/Verantwoordelijk */i, /: ?/);
      this.delegatees = users.split(",");
    }

    //Get action
    if (this.sortTask === "Besluit") {
      this.action = getNext(/Besluit: */, /\[.*\]/);
    } else {
      this.action = getNext(/: */, /\[.*\]/);
    }

    if (this.action === "Onbekend") {
      //No deadline --> Try action again
      this.action = getNext(/: */, / ?\{/);
      this.deadline = "Onbekend";
    } else {
      //Get deadline
      this.deadline = getNext(/\[/, / ?]/);
    }

    if (this.action === "Onbekend") {
      //No deadline & no notes
      this.action = text;
    } else {
      //Get notes
      this.notes = getNext(/(\]( *)?)?\{/, /\}/);
      if (this.notes === "Onbekend") {
        this.notes = "";
      }
    }
  };

  this.setTask = function(
    done,
    date,
    delegatees,
    action,
    deadline,
    notes,
    sortTask
  ) {
    this.done = done;
    this.date = date;
    this.delegatees = delegatees;
    this.action = action;
    this.deadline = deadline;
    this.notes = notes;
    this.sortTask = sortTask;
  };
}
