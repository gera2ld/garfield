module.exports = function (sequelize, DataTypes) {
  const project = sequelize.define('project', {
    name: {
      type: DataTypes.STRING,
      unique: true,
    },
    desc: DataTypes.TEXT,
  }, {
    paranoid: true,
  });
  project.associate = function (models) {
    project.hasMany(models.command, {onDelete: 'CASCADE'});
    project.belongsToMany(models.user, {through: 'userProject'});
  };
  return project;
};
