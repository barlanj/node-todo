var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];

function TodoItem (key, desc, done) {
	this.id = key;
	this.description = desc;
	this.complete = done;
}

for (var i = 0; i < 3; i++) {
	var task = new TodoItem(i, 'task_' + i, false);
	todos.push(task);
}


function getTodoItem(key, arr) {
	for (var i = arr.length - 1; i >= 0; i--) {
		if (arr[i].id == key) {
			return arr[i];
		}
	}

	return null;
}


app.get('/', function (req, res) {
	 res.send('root'); 
});

app.get('/todos', function (req, res) {
	 res.json(todos);
});

app.get('/todos/:id', function (req, res) {
	 var todo = getTodoItem(req.params.id, todos);

	 if(!todo) {
	 	res.status(404).send();
	 } else {
	 	res.json([todo]);
	 }

});


app.listen(PORT, function () {
	 console.log('listening ...');
});

