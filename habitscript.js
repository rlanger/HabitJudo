	  //establish namespace
      var habitjudo = {};
      habitjudo.namespace = {};
      habitjudo.namespace.db = null;
      
	  //create database
      habitjudo.namespace.open = function() {
        var dbSize = 5 * 1024 * 1024; // 5MB
        habitjudo.namespace.db = openDatabase("Todo", "1.0", "Todo manager", dbSize);
      }
      
	  //create table in db
      habitjudo.namespace.createTables = function() {
        var db = habitjudo.namespace.db;
        db.transaction(function(tx) {
								
          tx.executeSql("CREATE TABLE IF NOT EXISTS habits(id INTEGER PRIMARY KEY ASC, name TEXT, added_on DATE)", []);
		  
		  tx.executeSql("CREATE TABLE IF NOT EXISTS habitlog(added_on DATE NOT NULL, habit_id INTEGER NOT NULL, completed BOOLEAN, score INTEGER, PRIMARY KEY(added_on, habit_id), FOREIGN KEY(habit_id) REFERENCES habits(id))", []);
		  
        });
		//habitjudo.namespace.prepop();

      }
	  
	  //drop tables
	  habitjudo.namespace.droptables = function() {
		var db = habitjudo.namespace.db;
        db.transaction(function(tx) {
		  tx.executeSql("DROP TABLE habits", []);
		  tx.executeSql("DROP TABLE habitlog", []);
		});
		  
	  }
      
	  //prepopulates table
	  habitjudo.namespace.prepop = function() {
		  var currentDate = getDateString();
		  //currentDate = currentDate.toString();
		  //alert("prepop2");
		  //alert("The year is: " + year +"!");
		  
        var db = habitjudo.namespace.db;
		 
        db.transaction(function(tx){
								
		  var todoText = "Habit judo";
		  //var addedOn = Date();
								
          tx.executeSql("INSERT INTO habits(name, added_on) VALUES (?,?)",
              [todoText, currentDate],
              habitjudo.namespace.onSuccess,
              habitjudo.namespace.onError);
		  
		  //DUMB TEST STUFF
		  /*tx.executeSql("INSERT INTO habitlog(added_on, habit_id, score) VALUES(?, ?, ?)",
			  [currentDate, 1, 0],
              habitjudo.namespace.onSuccess,
              habitjudo.namespace.onError);*/
         });
      }
	  
	  //adds new user-created to do
      habitjudo.namespace.addTodo = function(todoText) {
        var db = habitjudo.namespace.db;
        db.transaction(function(tx){
          var addedOn = new Date();
          tx.executeSql("INSERT INTO habits(name, added_on) VALUES (?,?)",
              [todoText, addedOn],
              habitjudo.namespace.onSuccess,
              habitjudo.namespace.onError);
         });
      }
	  
	  //adds new log entry
      habitjudo.namespace.addLogEntry = function(habitID) {
        var db = habitjudo.namespace.db;
		var score = Math.floor(Math.random()*10+1);
        db.transaction(function(tx){
          var currentDate = getDateString();
          tx.executeSql("INSERT INTO habitlog(habit_id, added_on, score) VALUES (?,?,?)",
              [habitID, currentDate, score],
              habitjudo.namespace.onSuccess,
              habitjudo.namespace.onAddError);
         });
      }
      
	  //called when there's an error
      habitjudo.namespace.onError = function(tx, e) {
        alert("There has been an error: " + e.message);
      }
	  
	  //called when user tries to log the same habit twice in a day
      habitjudo.namespace.onAddError = function(tx, e) {
        alert("You've already logged that habit today");
      }
      
	  //loads and displays items, log, progress bar
      habitjudo.namespace.onSuccess = function(tx, r) {
        // re-render the data.
        habitjudo.namespace.getAllTodoItems(loadTodoItems);
		habitjudo.namespace.getLog(loadLogEntries);
		habitjudo.namespace.calculateTotal(displayTotal);

      }
      
      habitjudo.namespace.getAllTodoItems = function(renderFunc) {
        var db = habitjudo.namespace.db;
        db.transaction(function(tx) {
          tx.executeSql("SELECT * FROM habits", [], renderFunc,
              habitjudo.namespace.onError);
        });
      }
      
	  habitjudo.namespace.getLog = function(renderFunc) {
        var db = habitjudo.namespace.db;
        db.transaction(function(tx) {
          tx.executeSql("SELECT * FROM habitlog", [], renderFunc,
              habitjudo.namespace.onError);
        });
      }
	  
      habitjudo.namespace.deleteTodo = function(id) {
        var db = habitjudo.namespace.db;
        db.transaction(function(tx){
          tx.executeSql("DELETE FROM habits WHERE id=?", [id],
              habitjudo.namespace.onSuccess,
              habitjudo.namespace.onError);
          });
      }
	  
	   habitjudo.namespace.deleteLogEntry = function(added_on, habit_id) {
        var db = habitjudo.namespace.db;
        db.transaction(function(tx){
          tx.executeSql("DELETE FROM habitlog WHERE added_on=? AND habit_id=?", [added_on, habit_id],
              habitjudo.namespace.onSuccess,
              habitjudo.namespace.onError);
          });
      }
	  
	  habitjudo.namespace.calculateTotal = function(renderfunc) {
		var db = habitjudo.namespace.db;
        db.transaction(function(tx){
           tx.executeSql("SELECT * FROM habitlog", [], renderfunc, habitjudo.namespace.onError);
		   
         });
	  }
	  
	  
	  habitjudo.namespace.getHabitNames = function(renderfunc) {
		var db = habitjudo.namespace.db;
	  	db.transaction(function (tx) {
      		tx.executeSql("SELECT * FROM habits", [], renderfunc, habitjudo.namespace.onError);
   		});

	  }
	  

	  
	  function displayTotal(tx, rs) {
		  var total = 0;
		  var totalSpan = document.getElementById("total");

		   for (var i=0; i < rs.rows.length; i++) {
			   total += rs.rows.item(i).score;
		   }

         totalSpan.innerHTML = total;
		 
		 //get level up
		 var levelUpSpan = document.getElementById("levelup");
		 var lvlIndex = getLevelUpIndex(total);
		 levelUpSpan.innerHTML = levelUp[lvlIndex];
		 
		 //determine current level and next level
		 var current = levelUp[lvlIndex-1];
		 var next = levelUp[lvlIndex];

		 
		 //fill progress bar
		 var percentProgress = 100 * (total - current) / (next - current);
		 var progressBar = document.getElementById("progress");
		 
		 //set current belt color
		 var currentBelt = document.getElementById("currentlvl");
		 currentBelt.innerHTML = beltColor[current];
		 
		 //set next belt color
		 var nextBelt = document.getElementById("nextlvl");
		 nextBelt.innerHTML = beltColor[next];
		 
		 progressBar.innerHTML = "<div class=\"meter "+ beltSubclass[current] + "\"><span style=\"width:" + percentProgress + "%\"></span></div>";

	  }
	  
	  function getLevelUpIndex(total){
		  for (var i=0; i < levelUp.length; i++) {
			  if (levelUp[i] > total) {return i;}
		  }
		  
	  }
		  
	  
	  
	  function getDateString() {
		var addedOn = new Date();		  
		var currentDate = addedOn.getFullYear() + "-" + addedOn.getMonth() + "-" + addedOn.getDay();
		return currentDate;
	  }
	  
	  
      function loadTodoItems(tx, rs) {
        var rowOutput = "";
        var todoItems = document.getElementById("todoItems");
        for (var i=0; i < rs.rows.length; i++) {
          rowOutput += renderButton(rs.rows.item(i));
        }
      
        todoItems.innerHTML = rowOutput;
      }
      
      function renderTodo(row) {
        return "<li>" + row.name  + " [<a href='javascript:void(0);'  onclick='habitjudo.namespace.deleteTodo(" + row.id +");'>Delete</a>]</li>";
      }
	  
	  function renderButton(row) {
		  return "<li><a href='javascript:void(0);'  onclick='habitjudo.namespace.addLogEntry(" + row.id +");'>" + row.name + "</a> [<a href='javascript:void(0);'  onclick='habitjudo.namespace.deleteTodo(" + row.id +");'>X</a>]</li>";
	  }
	  
	  
	  function loadLogEntries(tx, rs) {
        var rowOutput = "";
        var logList = document.getElementById("log");
        for (var i=rs.rows.length; i > 0; i--) {
          rowOutput += renderLogEntry(rs.rows.item(i-1));
        }
      
        logList.innerHTML = rowOutput;
		
		habitjudo.namespace.getHabitNames(loadHabitNames);
      }
	  
	  function renderLogEntry(row) {
		  var logString = "<tr><td>Date: " + row.added_on + "</td><td>Habit: <span id=\"habit_id_" + row.habit_id + "\">" + row.habit_id + "</span></td><td>Score: " + row.score + "</td><td>[<a href='javascript:void(0);'  onclick='habitjudo.namespace.deleteLogEntry(\"" + row.added_on + "\", " + row.habit_id +");'>Delete</a>]</td></tr>";
		  return logString;
	  }
	  
	  function loadHabitNames(tx, rs) {	
		  var spanID;
		  var span;
		  
          for (var i=0; i < rs.rows.length; i++) {
			spanID = "habit_id_" + rs.rows.item(i).id;
			span  = document.getElementById(spanID);
			span.innerHTML = rs.rows.item(i).name;

          }
      
		  
	  }
      
      function init() {
		initializeBeltColorArray();
		initializeBeltSubclassArray();
		
        habitjudo.namespace.open();
		//habitjudo.namespace.droptables();
        habitjudo.namespace.createTables();
        habitjudo.namespace.getAllTodoItems(loadTodoItems);
		habitjudo.namespace.getLog(loadLogEntries);
		habitjudo.namespace.calculateTotal(displayTotal);
      }
      
      function addTodo() {
        var todo = document.getElementById("todo");
        habitjudo.namespace.addTodo(todo.value);
        todo.value = "";
      }
	  
	  
	  var levelUp = new Array (0, 105, 245, 455, 707, 1001, 1421, 1894, 2419, 2996, 3626, 4309, 5044, 5831, 6671, 7564, 8509, 9506, 10556, 11659, 12814, 14021);
	  
	  var beltColor = new Array ();
	  var beltSubclass = new Array ();
	  
	  function initializeBeltColorArray() {
		  beltColor[0] = "White";
		  beltColor[105] = "White Yellow";
		  beltColor[245] = "Yellow";
		  beltColor[455] = "Yellow Orange";
		  beltColor[707] = "Orange";
		  beltColor[1001] = "Orange Green";
		  beltColor[1421] = "Green";
		  beltColor[1894] = "Green Blue";
		  beltColor[2419] = "Blue";
		  beltColor[2996] = "Blue Brown";
		  beltColor[3626] = "Brown";
		  beltColor[4309] = "Brown (Stage 2)";
		  beltColor[5044] = "Black 1D";
		  beltColor[5831] = "Black 1D (Stage 2)";
		  beltColor[6671] = "Black 2D";
		  beltColor[7564] = "Black 2D (Stage 2)";
		  beltColor[8509] = "Black 3D";
		  beltColor[9506] = "Black 3D (Stage 2)";
		  beltColor[10556] = "Black 4D";
		  beltColor[11659] = "Black 4D (Stage 2)";
		  beltColor[12814] = "Black 5D";
		  beltColor[14021] = "Black 5D (Stage 2)";
	  }
	  
	  function initializeBeltSubclassArray() {
		  beltSubclass[0] = "white";
		  beltSubclass[105] = "whiteyellow";
		  beltSubclass[245] = "yellow";
		  beltSubclass[455] = "yelloworange";
		  beltSubclass[707] = "orange";
		  beltSubclass[1001] = "orangegreen";
		  beltSubclass[1421] = "green";
		  beltSubclass[1894] = "greenblue";
		  beltSubclass[2419] = "blue";
		  beltSubclass[2996] = "bluebrown";
		  beltSubclass[3626] = "brown";
		  beltSubclass[4309] = "brown";
		  beltSubclass[5044] = "white";
		  beltSubclass[5831] = "white";
		  beltSubclass[6671] = "white";
		  beltSubclass[7564] = "white";
		  beltSubclass[8509] = "white";
		  beltSubclass[9506] = "white";
		  beltSubclass[10556] = "white";
		  beltSubclass[11659] = "white";
		  beltSubclass[12814] = "white";
		  beltSubclass[14021] = "white";
	  }
	  
	  