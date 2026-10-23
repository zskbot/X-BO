// Server local: phục vụ public/ và /api/chat. Không cần thư viện nào.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('./api/chat');

const PUB = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/chat')) return void handler(req, res);

  const file = path.normalize(path.join(PUB, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname)));
  if (file !== PUB && !file.startsWith(PUB + path.sep)) {
    res.statusCode = 403;
    return res.end();
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.statusCode = 404;
      return res.end('Not found');
    }
    res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
    res.end(buf);
  });
}).listen(PORT, () => console.log(`X-BO chạy ở http://localhost:${PORT}`));
