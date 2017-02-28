module.exports = function (sequelize, DataTypes) {
  const command = sequelize.define('command', {
    desc: DataTypes.TEXT,
    type: DataTypes.STRING,
    data: DataTypes.STRING,
    script: DataTypes.TEXT,
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    indexes: [{
      unique: true,
      fields: ['projectId', 'type', 'data'],
    }],
  });
  command.associate = function (models) {
    command.belongsTo(models.project);
    command.hasMany(models.task, {onDelete: 'CASCADE'});
  };
  return command;
};
