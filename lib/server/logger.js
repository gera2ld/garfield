function log(out, data) {
  out.write(`[${new Date}] ${data}\n`);
}

module.exports = {
  info: log.bind(null, process.stdout),
  error: log.bind(null, process.stderr),
};
