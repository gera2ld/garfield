const ArgumentParser = require('argparse').ArgumentParser;

const parser = new ArgumentParser({
  version: require('../package.json').version,
  description: 'Start a web command server.',
});
parser.addArgument(['-p', '--port'], {
  help: 'the port for server to listen on',
  type: 'int',
  defaultValue: 2333,
});
parser.addArgument(['-c', '--commands'], {
  help: 'the file path for commands to import',
});

const args = parser.parseArgs();

module.exports = args;
