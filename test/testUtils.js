const assert = require('assert');
const time = require('../src/utils/time');

describe('formatDuration', () => {
  it('should format time', () => {
    const now = Date.now();
    assert.equal(time.formatDuration(1000), '1s');
    assert.equal(time.formatDuration(1000 + 60 * 1000), '1min 1s');
    assert.equal(time.formatDuration(1000 + 60 * 60 * 1000), '1h');
    assert.equal(time.formatDuration(1000 + 24 * 60 * 60 * 1000), '1d');
    assert.equal(time.formatDuration(1000 + 30 * 24 * 60 * 60 * 1000), '1mon');
    assert.equal(time.formatDuration(1000 + 365 * 24 * 60 * 60 * 1000), '1yr');
    assert.equal(time.formatDuration(1000 + 10 * 365 * 24 * 60 * 60 * 1000), 'long time');
  });
});
