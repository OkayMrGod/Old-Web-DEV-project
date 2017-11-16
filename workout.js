//Standard express/mysql/handlebars from the lectures
var express = require("express");
var mysql = require("./public/js/dbcon.js"); //will get mysql.pool
var app = express();
var handlebars = require("express-handlebars").create({defaultLayout: 'main'});
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static('public')); //Setup public folder for js files
app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("port", 8111); //my port that I used

//route for homepage from the mysql using server sql video format in lecture 3 of my sql video series. Based on that formating
//Sends a query to sql database that grabs all rows and renders  to the rowData field in 'home' views
app.get('/', function(req, res, next) {
    var context = {};
    mysql.pool.query('SELECT * FROM workouts', function(err, rows, fields){ //grab workout table rows
      if(err){
        next(err);
        return;
      }
	//loop corrects dates if '/' page is automatically loaded instead of giving times
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].date) {
		    rows[i].date = rows[i].date.toLocaleDateString();
        }
      }
      context.rowData = rows; //put in context object
      res.render('home', context); //render 'home' view page with each row from database
    });
});

//route given to us in Final Project form https://oregonstate.instructure.com/courses/1638961/assignments/7025532?module_item_id=17467035
app.get('/reset-table',function(req,res,next){
  var context = {};
  mysql.pool.query("DROP TABLE IF EXISTS workouts", function(err){ 
    var createString = "CREATE TABLE workouts("+
    "id INT PRIMARY KEY AUTO_INCREMENT,"+
    "name VARCHAR(255) NOT NULL,"+
    "reps INT,"+
    "weight INT,"+
    "date DATE,"+
    "lbs BOOLEAN)";
    mysql.pool.query(createString, function(err){
      context.results = "Table reset";
      res.render('home',context);
    })
  });
});


//based on insert function protocol given on this documentation page http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/node-mysql/using-server-sql.html
app.get('/insert',function(req,res,next){ //insert route
  var context = {};
  mysql.pool.query("INSERT INTO workouts SET ?", //first insert name, reps, weight, date, lbs into workouts database
	{name: req.query.n, reps: req.query.reps, weight: req.query.weight, date: req.query.date, lbs: req.query.lbs},
    function(err, result){ //error function
        if(err){
            next(err);
            return;
        }
	mysql.pool.query('SELECT * FROM workouts WHERE id = ' + result.insertId, function(err, rows, fields){ //then grab back row from where id was just given
      	if(err){
        	next(err);
        	return;
      	}
        // Format the date to match  the rest of the table and display in locale format
        if (rows[0].date) {
		    rows[0].date = rows[0].date.toLocaleDateString();
	    }
        context.rowData = JSON.stringify(rows); 
        res.type("text/plain");
        res.send(context.rowData); //sendback in plain text
   	});
  });
});

//edit route similar to insert route but instead of submit its from edit
//grabs row from database from ID from query sent from edit button which contains rowID
//renders 'edit' view with information from database which will eventually come back as an update after 'edit' is filled out
//Used logic from video here http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/node-mysql/using-server-sql.html
app.get('/edit', function(req, res){
    var context = {};
    mysql.pool.query('SELECT * FROM workouts WHERE id = ' + req.query.editId, function(err, rows, fields){ //grab row from ID sent from query
      	if(err){
        	next(err);
        	return;
      	}
        // Format the date so it fills the date form input field correctly
        if (rows[0].date) {
		var day = rows[0].date.getDate();
		var month = rows[0].date.getMonth();
		month++;
		var year = rows[0].date.getFullYear();
		if (month < 10) {
			month = '0' + month;
		}
		if (day < 10) {
			day = '0' + day;
		}
		var dateStr = year + '-' + month + '-' + day; //YYYY-MM-DD format
		    rows[0].date = dateStr;
        }
        context.rowData = rows;
        res.render('edit', context); //render 'edit' view with row gotten from ID with values if there are values
    })
});

//based on updating data for SQL from http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/node-mysql/using-server-sql.html
//takes call from edit.handlebars the id of row and tries to perform an update if a result is passed
//will use the updated values from edit from the req.body or will use existing values stored in current from the row in the database and then UPDATE database
//after updating the row we need to update the entire table so a new SELECT * FROM workouts query.
app.post('/',function(req,res,next){
  var context = {};
  mysql.pool.query("SELECT * FROM workouts WHERE id=?", [req.body.id], function(err, result){//get row from table matching req id
    if(err){
      next(err);
      return;
    }
    if(result.length == 1){ //if we have a result
      var current = result[0]; //store non-updated values in current so we have something to store if null is in req
      mysql.pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=? ", //below will UPDATE workouts from the req (updated values) or from the result of the database call which was already in the table (non-updated values)
        [req.body.name || current.name, req.body.reps || current.reps, req.body.weight || current.weight, req.body.date || current.date, req.body.lbs || current.lbs, req.body.id],
        function(err, result){
        if(err){
          next(err);
          return;
        }
        mysql.pool.query('SELECT * FROM workouts', function(err, rows, fields){ //grab table
            if(err){
                next(err);
                return;
            }
      	    for (var i = 0; i < rows.length; i++) {
                if (rows[i].date) {
		            rows[i].date = rows[i].date.toLocaleDateString(); //set date to local as done in others
        	    }
      	    }
          context.rowData = rows;
          res.render('home', context); //render in home
        });
      });
    }
  });
});

app.get('/delete',function(req,res,next){ //takes get query of row ID from home.js deleteWorkout call and deletes from database
  mysql.pool.query("DELETE FROM workouts WHERE id=?", [req.query.deleteId], function(err, result){ //sends a DELETE query by Id that was sent and deletes entire row
    if(err){ //catch error like normal
      next(err);
      return;
    }
    res.send(null); //after database deletion null response is returned
  });
});

app.use(function(req, res) {// 404 handler that was given to us
    res.status(404);
    res.render('404');
});

app.use(function(err, req, res, next) {
    console.error(err.stack); //server error 500 handler that was given to us
    res.type('plain/text');
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function() { //listen that was given to us
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
