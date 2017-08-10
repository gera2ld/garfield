export default (sequelize, DataTypes) => {
  const Command = sequelize.define('command', {
    desc: DataTypes.TEXT,
    type: DataTypes.STRING,
    data: DataTypes.STRING,
    script: DataTypes.TEXT,
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'commands',
    paranoid: true,
    indexes: [{
      unique: true,
      fields: ['projectId', 'type', 'data'],
    }],
  });
  Command.associate = models => {
    Command.belongsTo(models.Project);
    Command.hasMany(models.Task, { onDelete: 'CASCADE' });
  };
  return Command;
};
