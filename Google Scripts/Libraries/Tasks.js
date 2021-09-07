var Tasks = {
  //The collection of tasks
  Tasks: [],

  //Add AP to the collection
  addTask: function(Task) {
    this.Tasks.push(Task);
  },

  //Sort the Tasks by delegatee name
  sort: function() {
    this.Tasks.sort(function(a, b) {
      var alc = a.delegatees.toString().toLowerCase(),
          blc = b.delegatees.toString().toLowerCase();
      return alc > blc ? 1 : alc < blc ? -1 : 0;
    });
  }
};
