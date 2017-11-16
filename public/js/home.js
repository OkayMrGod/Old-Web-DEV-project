function createEdit() { //create edit button. When called this needs to be placed at end of table row
    var edit = document.createElement('input');
    edit.setAttribute("type", "submit");
    edit.setAttribute("name", "edit");
    edit.setAttribute("value", "Edit");
    return edit;
}

function createDelete() {//create delete button. When called this needs to go at end of table row
    var del = document.createElement('input');
    del.setAttribute("type", "submit");
    del.setAttribute("name", "delete");
    del.setAttribute("value", "Delete");
    return del;
}

//when home loads it will run the following DOM commands putting an edit button and delete button at the end of rows that existing
var tbody = document.getElementById("table-body"); //find table body
var rows = tbody.getElementsByTagName('tr'); //find row
for (var i = 0; i < rows.length; i++) {
    var edit = createEdit();
    var del = createDelete();
    var forms = rows[i].querySelectorAll('form'); 
    forms[0].appendChild(edit); 
    forms[1].appendChild(del); 
}

function queryMake(rep, wt, date, lb) { //when called will create query String that is sent via GET. If passed value is null value will be null
    var queryString = ''; //initalize string
    if (rep != '') { //if rep contains value from form field
        queryString += "&reps=" + rep; //append in query format
    } //rest work the same way
    if (wt != '') {
        queryString += "&weight=" + wt;
    }
    if (date != '') {
       queryString += "&date=" + date;
    }
    if (lb != '') {
       queryString += "&lbs=" + lb;
    }
    return queryString; //return query string that will be appended to GET url
}

function todaysDate() { // I referenced this link for the todaysDate function https://www.w3schools.com/js/js_date_methods.asp
    var date = new Date();
    var day = date.getDate(); //will get day
    var month = date.getMonth(); //will get month
    month++; // getMonth() returns 0 and needs to be incremented
    var year = date.getFullYear(); //will get year
    if (month < 10) { //if below 10 need a 0 before digit to operate correctly
        month = '0' + month; //append 0 char if needed
    }
    if (day < 10) { //same as month
        day = '0' + day;
    }
    date = year + '-' + month + '-' + day; //put in YYYY-MM-DD format
    return date; //return
}

document.getElementById('date').value = todaysDate(); // Put today's date in date form field referncing link above

document.addEventListener("DOMContentLoaded", addWorkout); // The following is based on XMLHttpRequest video series for addWorkout button, as well as DOM events in HW 3
//http://eecs.oregonstate.edu/ecampus-video/CS290/core-content/ajax-forms/js-forms.html

function addWorkout() {//when called will submit form data to database, return form data and place in table.
    document.getElementById("submit").addEventListener("click", function(event){ //wait for click on AddWorkout button
        var req = new XMLHttpRequest();  //get name, reps, weight, date, lbs from form and set to variables
        var name = document.getElementById("name").value;
        var reps = document.getElementById("reps").value;
        var weight = document.getElementById("weight").value;
        var date = document.getElementById("date").value;
        var lbs = document.getElementById("lbs").value;
        var query = queryMake(reps, weight, date, lbs); // Set query string except for name portion

		//input validation. Check name reps weight and lbs. Won't hit if statement if not in right format
        if (name !== '' && (reps >= 0 || reps == '') && (weight >= 0 || weight == '') && (lbs == 0 || lbs == 1 || lbs == '')) {
            req.open("GET", "/insert?n=" + name + query, true); //calls to insert route or insertion into database and callback
			//once recieved row is added to table with form data
			//response recieved loads new row. Also calls createEdit and createDelete for buttons
            req.addEventListener("load", function() { //response
                var response = JSON.parse(req.responseText); //parse through text from Ajax documentation as JSON object
                var tbody = document.getElementById("table-body"); //find table body
                var row = document.createElement('tr'); //create row
                var td = document.createElement('td'); //create column within row
                td.textContent = response[0].name; //place in first column name
                row.appendChild(td); //append
                td = document.createElement('td'); //recreate next column for reps, weight, date, and lbs in similar logic
                td.textContent = response[0].reps;
                row.appendChild(td);
                td = document.createElement('td');
                td.textContent = response[0].weight;
                row.appendChild(td);
                td = document.createElement('td');
                td.textContent = response[0].date;
                row.appendChild(td);
                td = document.createElement('td');
                td.textContent = response[0].lbs;
                row.appendChild(td);
				
				//once all form data has been added we create buttons in the row
                var edit = createEdit(); //create edit button
                td = document.createElement('td'); //create column
                td.setAttribute("class", "edit-delete");
                var form = document.createElement('form'); //form so we can do something IE edit
                form.setAttribute("action", "/edit"); //give action /edit route
                form.setAttribute("method", "GET"); //with GET method type
                var input = document.createElement('input'); //create input for form
                input.setAttribute("type", "hidden"); //create hidden Id so can be referenced and changed
                input.setAttribute("name", "editId"); //id
                input.setAttribute("value", response[0].id); //give id that matches its row number
                form.appendChild(input); //finally append
                form.appendChild(edit); //append with edit button to our form
                td.appendChild(form); //append form to column
                row.appendChild(td); //append column to row
				
				var del = createDelete(); //create delete button similar to edit logic for ID
                td = document.createElement('td'); //column
                td.setAttribute("class", "edit-delete");
                form = document.createElement('form'); //form
                input = document.createElement('input'); //input
                input.setAttribute("type", "hidden");
                input.setAttribute("name", "id");
                input.setAttribute("value", response[0].id);
				del.setAttribute("onclick", "deleteWorkout(event, 'workoutTable')"); //on click calls deleteWorkout function on the table
                form.appendChild(input);
                form.appendChild(del); //same appending as the edit but instead give del button
                td.appendChild(form); //set button to column
                row.appendChild(td); //set column to row
                tbody.appendChild(row); //set row to table
            });
            req.send(null);// from ajax documentation
			
			//reset form data except today's date because that hasn't changed
            document.getElementById("name").value = '';
            document.getElementById("reps").value = '';
            document.getElementById("weight").value = '';
			document.getElementById("lbs").value = '';
            document.getElementById("date").value = todaysDate();

            event.preventDefault(); //prevent default so no reload. From Ajax documentation
        }
    })
}

//Used http://jsfiddle.net/GRgMb/ for delete table documentation
//GET request to /delete with id of row gotten by form id
function deleteWorkout(event, workoutTable) { //called by delete button
    var req = new XMLHttpRequest();
    var form = event.target.parentNode;
    var inputs = form.getElementsByTagName('input');
    var id = inputs[0].value; //grab id of row for deletion
    req.open("GET", "/delete?deleteId=" + id, true); //send to /delete to delete from database
    req.addEventListener("load", function() { //returned response now delete row on home
        var table = document.getElementById("workoutTable"); //based on http://jsfiddle.net/GRgMb/ documentation
        var rowCount = table.rows.length;
        for (var i = 0; i < rowCount; i++) { //iterate through rows and delete
            var row = table.rows[i];
            if (row == event.target.parentNode.parentNode.parentNode) {
                table.deleteRow(i);
                rowCount--; //reduce rowcount
                i--;
            }
        }
    });
    req.send(null); //XML documentation
    event.preventDefault(); //prevent page reload
}
