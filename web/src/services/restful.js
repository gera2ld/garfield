import Restful from 'restful-fetch';

const restful = new Restful({
  root: './api',
  config: {
    credentials: 'same-origin',
  },
});

export default restful;
restful.posthandlers.push(data => {
  if (data && data.rows) {
    let rows = [];
    const meta = Object.keys(data).reduce((meta, key) => {
      if (key === 'rows') {
        rows = data[key];
      } else {
        meta[key] = data[key];
      }
      return meta;
    }, {});
    rows.meta = meta;
    data = rows;
  }
  return data;
});

export const Projects = restful.model('projects');
Projects.Commands = Projects.model(':id', 'commands');

export const Commands = restful.model('commands');

export const Tasks = restful.model('tasks');

export const Me = restful.model('me');

function parseUser(user) {
  try {
    user.permission = JSON.parse(user.permission);
  } catch (e) {
  }
  user.permission = user.permission || {};
}

export const Users = restful.model('users');
Users.posthandlers.push(data => {
  data.forEach(parseUser);
  return data;
});
Users.Single = Users.model(':id');
Users.Single.posthandlers.push(data => {
  parseUser(data);
  return data;
});

export const Consts = restful.model('consts');
