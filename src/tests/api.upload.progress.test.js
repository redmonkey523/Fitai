import api from '../services/api';

describe('upload progress wiring', () => {
  it('progress callback is invoked (web XHR mocked)', async () => {
    const original = global.XMLHttpRequest;
    const progressCalls = [];
    class MockXHR {
      open() {}
      setRequestHeader() {}
      send() {
        setTimeout(() => {
          if (this.upload && this.upload.onprogress) {
            this.upload.onprogress({ lengthComputable: true, loaded: 50, total: 100 });
            this.upload.onprogress({ lengthComputable: true, loaded: 100, total: 100 });
          }
          this.status = 200;
          this.responseText = JSON.stringify({ success: true, file: { url: 'http://example.com/y.jpg' } });
          this.readyState = 4;
          this.onreadystatechange();
        }, 0);
      }
      get upload() {
        if (!this._upload) this._upload = {};
        return this._upload;
      }
      set upload(v) { this._upload = v; }
    }
    global.XMLHttpRequest = MockXHR;
    const fd = new FormData();
    fd.append('file', new Blob(['x'], { type: 'image/jpeg' }), 'a.jpg');
    const res = await api._multipartUploadWithProgress('/upload/single', fd, (pct) => progressCalls.push(pct));
    expect(res?.file?.url).toContain('http');
    expect(progressCalls.some(p => p > 0 && p <= 1)).toBe(true);
    global.XMLHttpRequest = original;
  });
});


