import * as time from './time';
export {time};

export function safeHTML(text) {
  return text.replace(/[<&]/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
  }[m]));
}
