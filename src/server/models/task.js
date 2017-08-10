import { consts } from '../utils';

export default (sequelize, DataTypes) => {
  const Task = sequelize.define('task', {
    status: {
      type: DataTypes.INTEGER,
      defaultValue: consts.PENDING,
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
  }, {
    tableName: 'tasks',
    paranoid: true,
  });
  Task.associate = models => {
    Task.belongsTo(models.Command);
  };
  return Task;
};
