function lpad(str, len, pad = '0') {
  str = str.toString();
  return pad.repeat(Math.max(0, len - str.length)) + str;
}

export function formatTime(str) {
  if (!str) return '?';
  const date = new Date(str);
  const h = lpad(date.getHours(), 2);
  const m = lpad(date.getMinutes(), 2);
  const s = lpad(date.getSeconds(), 2);
  return `${h}:${m}:${s}`;
}

export function formatDuration(ms) {
  const data = [{
    unit: 'ms',
    step: 1000,
  }, {
    unit: 's',
    step: 60,
  }, {
    unit: 'min',
    step: 60,
  }, {
    unit: 'h',
    step: 24,
  }, {
    unit: 'd',
  }];
  var last = 0;
  for (var t = ms, i = 0; t && i < data.length; i ++) {
    const item = data[last = i];
    if (item.step) {
      item.value = t % item.step;
      t = ~~ (t / item.step);
    } else {
      item.value = t;
      break;
    }
  }
  return [data[last], data[last - 1]]
  .map(item => item && item.value && (item.value + item.unit))
  .filter(part => part)
  .join(' ');
}
