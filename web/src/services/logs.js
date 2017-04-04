export default class Logs {
  constructor(data = {}, options = {}) {
    this.bufsize = options.bufsize || 10 * 1024;
    this.offset = data.offset || 0;
    this.meta = data.meta || [];
    this.buffer = data.buffer || '';
  }

  write(raw, type, offset) {
    const data = raw.toString('utf8');
    let buf = '';
    let lastEnter = -1;
    let lOffset = offset == null ? this.buffer.length : offset - this.offset;
    for (let i = 0; i < data.length; i += 1) {
      const c = data.charAt(i);
      if (c === '\r') {
        if (lastEnter >= 0) {
          buf = buf.slice(0, lastEnter + 1);
        } else {
          buf = '';
          if (lOffset >= 0 && lOffset <= this.buffer.length) {
            lOffset = this.buffer.lastIndexOf('\n', lOffset) + 1;
          }
        }
      } else if (c === '\b') {
        if (buf) {
          if (buf.charAt(buf.length - 1) !== '\n') buf = buf.slice(0, -1);
        } else if (lOffset > 0 && this.buffer.charAt(lOffset - 1) !== '\n') lOffset -= 1;
      } else {
        if (c === '\n') lastEnter = buf.length;
        buf += c;
      }
    }
    const endOffset = this.offset + lOffset;
    for (let i = this.meta.length - 1; i >= 0; i -= 1) {
      const item = this.meta[i];
      if (item.start >= endOffset) {
        this.meta.pop();
      } else {
        if (item.end > endOffset) item.end = endOffset;
        break;
      }
    }
    this.buffer = this.buffer.slice(0, endOffset) + buf;
    const metaItem = {
      type: type || 'out',
      start: this.offset + endOffset,
      end: this.offset + endOffset + buf.length,
    };
    const lastMetaItem = this.meta[this.meta.length - 1];
    if (lastMetaItem && lastMetaItem.type === metaItem.type) {
      lastMetaItem.end = metaItem.end;
    } else {
      this.meta.push(metaItem);
    }
    if (this.bufsize && this.buffer.length > this.bufsize) {
      this.offset += this.buffer.length - this.bufsize;
      this.buffer = this.buffer.slice(-this.bufsize);
      for (let i = 0; i < this.meta.length; i += 1) {
        const item = this.meta[i];
        if (item.end <= this.offset) {
          this.meta.shift();
          i -= 1;
        } else break;
      }
    }
    return this.getPiece();
  }

  getPiece(index) {
    const i = index == null ? this.meta.length - 1 : index;
    const meta = this.meta[i];
    if (meta) {
      return Object.assign({
        data: this.buffer.slice(meta.start, meta.end),
        offset: this.offset,
      }, meta);
    }
  }

  getValue() {
    const { buffer, meta, offset } = this;
    return { buffer, meta, offset };
  }
}
