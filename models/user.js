var bcrypt = require('bcryptjs');
var _ = require('underscore');


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
		}
	});

	return user;
};