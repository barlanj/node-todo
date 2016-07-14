var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./database.js');
var mw_token = require('./middlewares/tokenAuth.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;

app.use(bodyParser.json());


//-----------------------------------------------------------
app.get('/', function(req, res) {
	res.send('root');
});

app.get('/todos', mw_token.requireAuth, function(req, res) {
	var query = req.query;
	var where = {};
	where.userId = req.user.get('id');

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

	db.todo.findAll({
		where: where
	}).then(function(todos) {
		res.json(todos);
	}, function(e) {
		res.status(500).send();
	});

});

app.get('/todos/:id', mw_token.requireAuth, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (todo) {
			res.json(todo.toJSON());
		} else {
			res.status(400).send();
		}
	}, function(e) {
		res.status(500).send();
	});

});

app.post('/todos', mw_token.requireAuth, function(req, res) {
	var body = _.pick(req.body, 'description', 'complete');

	db.todo.create(body).then(function(todo) {
		req.user.addTodo(todo).then(function() {
			return todo.reload();
		}).then(function(todo) {
			res.json(todo.toJSON());
		});
	}, function(e) {
		res.status(400).json(e);
	});

});

app.delete('/todos/:id', mw_token.requireAuth, function(req, res) {
	var todoId = parseInt(req.params.id, 10);

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (todo) {
			todo.destroy();
			res.json({
				message: "successfully deleted todo"
			});
		} else {
			res.status(404).json({
				error: "id not found"
			});
		}
	}, function(e) {
		res.status(500).send();
	});

});


app.put('/todos/:id', mw_token.requireAuth, function(req, res) {
	var todoId = parseInt(req.params.id, 10);
	var body = _.pick(req.body, 'description', 'complete');
	var attributes = {};

	if (body.hasOwnProperty('complete')) {
		attributes.complete = body.complete;
	}

	if (body.hasOwnProperty('description')) {
		attributes.description = body.description;
	}

	db.todo.findOne({
		where: {
			id: todoId,
			userId: req.user.get('id')
		}
	}).then(function(todo) {
		if (todo) {
			todo.update(attributes).then(function(todo) {
				res.json(todo.toJSON());
			}).catch(function(e) {
				res.status(400).json(e);
			});
		} else {
			res.status(404).json({
				error: "id not found"
			});
		}
	}).catch(function(e) {
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
	var userInstance;

	db.user.authenticate(body).then(function(user) {
		var token = user.generateToken('authentication');
		userInstance = user;

		return db.token.create({
			token: token
		});
	}).then(function(tokenInstance) {
		res.header('Auth', tokenInstance.token).json(userInstance.toPublicJSON());
	}).catch(function(e) {
		res.status(401).send(e);
	});

});

app.delete('/users/login', mw_token.requireAuth, function(req, res) {
	req.token.destroy().then(function() {
		res.status(204).send()
	}).catch(function() {
		res.status(500).send();
	});
});

//------------------------------------------------------------
db.sequelize.sync({
	force: true
}).then(function() {
	app.listen(PORT, function() {
		console.log('listening ...');
	});
});