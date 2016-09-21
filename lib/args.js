const ArgumentParser = require('argparse').ArgumentParser;

const parser = new ArgumentParser({
  version: require('../package.json').version,
  description: 'Start a web command server.',
});
parser.addArgument(['-H', '--host'], {
  help: 'The server will bind to HOST, default as `0.0.0.0`.',
  type: 'string',
  defaultValue: '0.0.0.0',
});
parser.addArgument(['-p', '--port'], {
  help: 'The server will listen on PORT, default as 2333.',
  type: 'int',
  defaultValue: 2333,
});
parser.addArgument(['-c', '--commands'], {
  help: 'Commands will be imported from COMMANDS file.',
});

const args = parser.parseArgs();

module.exports = args;
