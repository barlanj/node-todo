var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./database.js');

var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
//-----------------------------------------------------------
app.get('/', function(req, res) {
	res.send('root');
});

app.get('/todos', function(req, res) {
	var query = req.query;
	var where = {};

	if (query.hasOwnProperty('complete') && query.complete === 'true') {
		where.complete = true;
	} else if (query.hasOwnProperty('complete') && query.complete === 'false') {
		where.complete = false;
	}

	if (query.hasOwnProperty('q') && query.q.length > 0) {
		where.description = {
			$like: '%' + query.q + '%'
		};
	}

	db.todo.findAll({where: where}).then(function (todos) {
		res.json(todos);
	}, function (e) {
		res.status(500).send();
	});

});

app.get('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findById(todoId).then(function(todo) {
		if(!!todo) {
			res.json(todo.toJSON());
		} else {
			res.status(404).send();
		}
	}, function(e) {
		res.status(500).send();
	});

});

app.post('/todos', function(req, res) {
	var body = _.pick(req.body, 'description', 'complete');

	db.todo.create(body).then(function(todo) {
		res.json(todo.toJSON());
	}, function(e) {
		res.status(400).json(e);
	});

});

app.delete('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findById(todoId).then(function(todo) {
		if(!!todo) {
			todo.destroy();
			res.json({ message: "successfully deleted todo" });
		} else {
			res.status(404).json({ error: "id not found"});
		}
	}, function(e) {
		res.status(500).send();
	});

});


app.put('/todos/:id', function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'complete');
	var attributes = {};

	if (body.hasOwnProperty('complete')) {
		attributes.complete = body.complete;
	} 

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findById(todoId).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function (todo) {
				res.json(todo.toJSON());
			}).catch(function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).json({ error: "id not found"});
		}
	}).catch(function (e) {
		res.status(500).send();
	});

});

//------------------------------------------------------------
app.post('/users', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.create(body).then(function(user) {
		res.json(user.toPublicJSON());
	}, function(e) {
		res.status(400).json(e);
	});
});

app.post('/users/login', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');

	db.user.authenticate(body).then(function (user) {
		res.json(user.toPublicJSON());
	}, function() {
		res.status(401).send();
	});

});

app.delete('/users/:email', function(req, res) {
	var body = _.pick(req.body, 'email', 'password');
	var email = req.params.email;

	db.user.findOne({
		where: body
	}).then(function(user) {
		if (!!user) {
			user.destroy();
			res.status(204).send();
		} else {
			res.status(404).json({ error: "cannot find email"});
		}
	}, function (e) {
		res.status(500).send();
	});

});


//------------------------------------------------------------
db.sequelize.sync({force: true}).then(function() {
	app.listen(PORT, function() {
		console.log('listening ...');
	});
});


	