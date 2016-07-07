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

function deleteTodoItem(item, arr) {

	todos = _.without(arr, item);
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
	 	res.status(404).json({ "error": "no todo item found with given id"});
	 } else {
	 	res.json([fetchedItem]);
	 }

});

app.post('/todos', function (req, res) {
	 var body = _.pick(req.body, 'description', 'complete');

	 if (!_.isBoolean(body.complete) || !_.isString(body.description) 
	 	|| body.description.trim().length === 0) {

	 	return res.status(400).json({ "error": "key value pairs provided are not valid"});
	 }

	 body.description = body.description.trim();
	 addTodoItem(body);

	 res.json(todos);
	 
});

app.delete('/todos/:id', function (req, res) {
	 var fetchedItem = getTodoItem(req.params.id, todos);

	 if(!fetchedItem) {
	 	res.status(404).json({ "error": "no todo found with given id"});
	 } else {
	 	deleteTodoItem(fetchedItem, todos);
	 	res.json([fetchedItem]);
	 }

});


app.put('/todos/:id', function (req, res) {
	 var body = _.pick(req.body, 'description', 'complete');
	 var fetchedItem = getTodoItem(req.params.id, todos);
	 var validAttr = {};
	 
	 if(!fetchedItem) {
	 	return res.status(404).json({ "error": "no todo found with given id"});
	 }

	 if (body.hasOwnProperty('complete') && _.isBoolean(body.complete)) {
	 	validAttr.complete = body.complete;

	 } else if (body.hasOwnProperty('complete')) {
	 	return res.status(400).json({ "error": "complete property has invalid content"});
	 }

	 if(body.hasOwnProperty('description') && _.isString(body.description) 
	 	&& body.description.trim().length > 0) {
	 	validAttr.description = body.description;

	 } else if (body.hasOwnProperty('description')) {
	 	return res.status(400).json({ "error": "description property has invalid content"});
	 }

	 _.extend(fetchedItem, validAttr);

	 res.json(fetchedItem);
});

//------------------------------------------------------------
app.listen(PORT, function () {
	 console.log('listening ...');
});

