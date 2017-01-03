import * as time from './time';
export {time};

export function safeHTML(text) {
  return text.replace(/[<&]/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
  }[m]));
}

export function formatLogs(data) {
  const {offset=0, meta, buffer} = data;
  return meta.map(item => {
    const start = Math.max(0, item.start - offset);
    const end = Math.max(0, item.end - offset);
    const chunk = safeHTML(buffer.slice(start, end)).replace(/\n/g, '<br>');
    return chunk && `<span class="log-${safeHTML(item.type)}">${chunk}</span>`;
  }).join('');
}

export function hasPermission(permission, key, action) {
  const values = permission && permission[key];
  return values && values.includes(action);
}
