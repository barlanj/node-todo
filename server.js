var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;
var uniqueID = 0;

var todos = [];


app.use(bodyParser.json());

//--------------------------------------------------------
function TodoItem (key, desc, done) {
	this.id = key;
	this.description = desc;
	this.complete = done;
}

for (var i = uniqueID; i < 3; i++) {
	var task = new TodoItem(i, 'task_' + i, false);
	todos.push(task);
	uniqueID++;
}


function getTodoItem(key, arr) {

	return _.findWhere(arr, {id: Number(key)});
}

function addTodoItem(item) {

	item.id = todos.length;
	todos.push(item);
}

//-----------------------------------------------------------
app.get('/', function (req, res) {
	 res.send('root'); 
});

app.get('/todos', function (req, res) {
	 res.json(todos);
});

app.get('/todos/:id', function (req, res) {
	 var fetchedItem = getTodoItem(req.params.id, todos);

	 if(!fetchedItem) {
	 	res.status(404).send();
	 } else {
	 	res.json([fetchedItem]);
	 }

});

app.post('/todos', function (req, res) {
	 var body = _.pick(req.body, 'description', 'complete');

	 if (!_.isBoolean(body.complete) || !_.isString(body.description) 
	 	|| body.description.trim().length === 0) {

	 	return res.status(400).send();
	 }

	 body.description = body.description.trim();
	 addTodoItem(body);
	 
	 res.json(todos);
	 
});

//------------------------------------------------------------
app.listen(PORT, function () {
	 console.log('listening ...');
});

