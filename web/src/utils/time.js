function lpad(str, len, pad = '0') {
  str = str.toString();
  return pad.repeat(Math.max(0, len - str.length)) + str;
}

function timeAgo(time, minDelta = 24 * 60 * 60 * 1000) {
  if (!time) return;
  const delta = Date.now() - new Date(time).getTime();
  if (delta < minDelta) return;
  return exports.formatDuration(delta) + ' ago';
}
exports.timeAgo = timeAgo;

function formatTime(str) {
  if (!str) return '?';
  const date = new Date(str);
  const h = lpad(date.getHours(), 2);
  const m = lpad(date.getMinutes(), 2);
  const s = lpad(date.getSeconds(), 2);
  return `${h}:${m}:${s}`;
}
exports.formatTime = formatTime;

{
  const units = [{
    step: 1000,
    title: '{}ms',
  }, {
    step: 60,
    title: '{}s',
  }, {
    step: 60,
    title: '{}min',
  }, {
    step: 24,
    title: '{}h',
  }, {
    step: 30,
    title: '{}d',
  }, {
    step: 12,
    title: '{}mon',
  }, {
    step: 10,
    title: '{}yr',
  }, {
    title: 'long time',
  }];
  function formatDuration(time, maxUnits=2) {
    const results = [];
    for (let i = 0; time && i < units.length; i ++) {
      const unit = units[i];
      const value = unit.step ? time % unit.step : ~~ time;
      results.push(value ? unit.title.replace('{}', value) : '');
      time = unit.step ? ~~ (time / unit.step) : 0;
    }
    return results.slice(-maxUnits).reverse().filter(i => i).join(' ') || '0s';
  }
  exports.formatDuration = formatDuration;
}
