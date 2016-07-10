module.exports = function (sequelize, DataTypes) {
	return sequelize.define('todo', {
		description: { 
			type: DataTypes.STRING,
			allowNull: false,
			validate: {
				len: [1, 250] //  250 >= str >= 1,
			}
		},
		complete: { 
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false
		}
	});
};
