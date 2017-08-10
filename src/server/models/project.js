export default (sequelize, DataTypes) => {
  const Project = sequelize.define('project', {
    name: {
      type: DataTypes.STRING,
      unique: true,
    },
    desc: DataTypes.TEXT,
  }, {
    tableName: 'projects',
    paranoid: true,
  });
  Project.associate = models => {
    Project.hasMany(models.Command, { onDelete: 'CASCADE' });
    Project.belongsToMany(models.User, { through: 'userProject' });
  };
  return Project;
};
