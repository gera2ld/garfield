import Sequelize from 'sequelize';
import modelCommand from './command';
import modelProject from './project';
import modelTask from './task';
import modelUser from './user';
import nconf from '../config';

let sequelize;
const config = nconf.get('DATABASE');
if (typeof config === 'string') {
  sequelize = new Sequelize(config);
} else {
  const { database, username, password } = config;
  sequelize = new Sequelize(database, username, password, config);
}

const models = {};

const initModel = model => model(sequelize, Sequelize.DataTypes);

models.Command = initModel(modelCommand);
models.Project = initModel(modelProject);
models.Task = initModel(modelTask);
models.User = initModel(modelUser);

Object.values(models).forEach(model => {
  if (model.associate) model.associate(models);
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

export default models;
