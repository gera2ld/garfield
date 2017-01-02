import Restful from 'restful-fetch';

const restful = new Restful({
  root: './api',
  presets: ['json'],
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
restful.errhandlers.push(res => {
  if (res && res.data && res.data.message === 'Not Authorized') {
    location.href = './account/login';
  }
}, restful.errhandlers.pop());

export const Projects = restful.model('projects');
Projects.Commands = Projects.model(':id', 'commands');

export const Commands = restful.model('commands');

export const Tasks = restful.model('tasks');

export const Me = restful.model('me');
