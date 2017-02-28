module.exports = function (sequelize, DataTypes) {
  const task = sequelize.define('task', {
    status: {
      type: DataTypes.ENUM('pending', 'running', 'finished', 'error'),
      defaultValue: 'pending',
    },
    startedAt: DataTypes.DATE,
    endedAt: DataTypes.DATE,
    error: DataTypes.TEXT,
    log: {
      type: DataTypes.TEXT,
      get() {
        const log = this.getDataValue('log');
        if (typeof log !== 'undefined') {
          return log ? JSON.parse(log) : {};
        }
      },
      set(log) {
        this.setDataValue('log', JSON.stringify(log));
      },
    },
  });
  task.associate = function (models) {
    task.belongsTo(models.command);
  };
  return task;
};
