class Logs {
  constructor(data={}, options={}) {
    this.bufsize = options.bufsize || 10 * 1024;
    this.offset = data.offset || 0;
    this.meta = data.meta || [];
    this.buffer = data.buffer || '';
  }

  write(data, type, offset) {
    let buf = '';
    let lastEnter = -1;
    const length = data.length;
    let lOffset = offset == null ? this.buffer.length : offset - this.offset;
    for (let i = 0; i < length; i ++) {
      const c = data.charAt(i);
      if (c === '\r') {
        if (~lastEnter) {
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
        } else {
          if (lOffset > 0 && this.buffer.charAt(lOffset - 1) !== '\n') lOffset --;
        }
      } else {
        if (c === '\n') lastEnter = buf.length;
        buf += c;
      }
    }
    offset = this.offset + lOffset;
    for (let i = this.meta.length; i --; ) {
      const item = this.meta[i];
      if (item.start >= offset) {
        this.meta.pop();
      } else {
        if (item.end > offset) item.end = offset;
        break;
      }
    }
    type = type || 'out';
    this.buffer = this.buffer.slice(0, offset) + buf;
    const metaItem = {
      type,
      start: this.offset + offset,
      end: this.offset + offset + buf.length,
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
      for (let i = 0; i < this.meta.length; i ++) {
        const item = this.meta[i];
        if (item.end <= this.offset) {
          this.meta.shift();
          i --;
        } else break;
      }
    }
    return this.getPiece();
  }

  getPiece(index) {
    if (index == null) index = this.meta.length - 1;
    const meta = this.meta[index];
    if (meta) return Object.assign({
      data: this.buffer.slice(meta.start, meta.end),
      offset: this.offset,
    }, meta);
  }

  getValue() {
    return {buffer: this.buffer, meta: this.meta, offset: this.offset};
  }
}

module.exports = Logs;
