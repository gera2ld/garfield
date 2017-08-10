import * as time from './time';
import store from './store';

export * from 'src/common/helpers';
export { time, store };

export function safeHTML(text) {
  return text.replace(/[<&]/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
  }[m]));
}

export function formatLogs(data) {
  const { offset = 0, meta, buffer } = data;
  return meta.map(item => {
    const start = Math.max(0, item.start - offset);
    const end = Math.max(0, item.end - offset);
    const chunk = safeHTML(buffer.slice(start, end)).replace(/\n/g, '<br>');
    return chunk && `<span class="log-${safeHTML(item.type)}">${chunk}</span>`;
  }).join('');
}

export function hasPermission(key, action) {
  const permissions = store.me.permissions || {};
  const values = permissions[key];
  return values && values.includes(action);
}
