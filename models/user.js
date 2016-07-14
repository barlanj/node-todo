var bcrypt = require('bcryptjs');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');


module.exports = function (sequelize, DataTypes) {
	var user = sequelize.define('user', {
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
			validate: {
				isEmail: true
			}
		},
		salt: {
			type: DataTypes.STRING
		},
		password_hash: {
			type: DataTypes.STRING
		},
		password: {
			type:DataTypes.VIRTUAL,
			allowNull: false,
			validate: {
				len: [7, 100]
			},
			set: function (value) {
				var salt = bcrypt.genSaltSync(10);
				var hashedPassword = bcrypt.hashSync(value, salt);

				this.setDataValue('password', value);
				this.setDataValue('salt', salt);
				this.setDataValue('password_hash', hashedPassword);
			}
		}
	}, {
		hooks: {
			beforeValidate: function (user, options) {
				if ( typeof user.email === 'string' ) {
					user.email = user.email.toLowerCase();
				}
			},
			afterValidate: function (user, options) {

			}
		},
		classMethods: {
			authenticate: function(body) {
				return new Promise(function (resolve, reject) {
					if (typeof body.email === 'string' && typeof body.password === 'string') {
						user.findOne({
							where: {
								email: body.email
							}
						}).then(function(user) {
							if (!!user && user.checkPassword(body.password)) {
								return resolve(user);
							} else {
								return reject();
							}

						}, function(e) {
							return reject();
						});
					} else {
						return reject();
					}
				});
			},
			findByToken: function(token) {
				return new Promise(function (resolve, reject) {
					try {
						var decodedJWT = jwt.verify(token, 'qwerty123');
						var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123456');
						var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

						user.findById(tokenData.id).then(function(user) {
							if (user) {
								resolve(user);
							} else {
								reject();
							}
						}, function(e) {
							reject();
						});

					} catch (e) {
						reject();
					}
				});
			} 
		},
		instanceMethods: {
			toPublicJSON: function () {
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
			},
			checkPassword: function(givenPass) {
				return bcrypt.compareSync(givenPass, this.get('password_hash'));
			},
			generateToken: function (type) {
				if (!_.isString(type)) {
					return undefined;
				}

				try {
					var stringData = JSON.stringify({id: this.get('id'), type: type});
					var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123456').toString();
					var token = jwt.sign({
						token: encryptedData
					}, 'qwerty123');

					return token;
				} 
				catch (e) {
					console.error(e);
					return undefined;
				}

			}
		}
	});

	return user;
};
