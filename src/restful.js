import Restful from 'restful-fetch';

const restful = new Restful({
  root: '/api',
  presets: ['json'],
});

export default restful;
restful.posthandlers.push(data => {
  if (data.rows) {
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
