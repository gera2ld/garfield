export default (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    openId: {
      type: DataTypes.STRING,
      unique: true,
    },
    login: DataTypes.STRING,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    avatar: DataTypes.STRING,
    permissions: {
      type: DataTypes.TEXT,
      get() {
        const permissions = this.getDataValue('permissions');
        if (typeof permissions !== 'undefined') {
          return permissions ? JSON.parse(permissions) : {};
        }
      },
      set(permissions) {
        this.setDataValue('permissions', JSON.stringify(permissions));
      },
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'users',
    paranoid: true,
    onDelete: 'CASCADE',
  });
  User.associate = models => {
    User.belongsToMany(models.Project, { through: 'userProject' });
  };
  return User;
};
