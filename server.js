const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname);

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const requestPath = parsedUrl.pathname;

  if (requestPath === '/api/openai' && req.method === 'POST') {
    return proxyOpenAI(req, res);
  }
  if (requestPath === '/api/proxy-image' && req.method === 'GET') {
    return proxyImage(req, res);
  }

  let filePath = path.resolve(ROOT_DIR, requestPath === '/' ? 'index.html' : `.${decodeURIComponent(requestPath)}`);
  const relativePath = path.relative(ROOT_DIR, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    return res.end('Bad request');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(content);
  });
});

function getConfigApiKey() {
  try {
    const configPath = path.join(ROOT_DIR, 'app', 'config.js');
    const configSource = fs.readFileSync(configPath, 'utf8');
    const match = configSource.match(/API_KEY:\s*["']([^"']+)["']/);
    const key = match && match[1] ? match[1].trim() : '';
    return key && key !== 'sk-...' ? key : '';
  } catch {
    return '';
  }
}

function readJsonBody(req, callback) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1024 * 1024) {
      req.destroy();
    }
  });
  req.on('end', () => {
    try {
      callback(null, JSON.parse(body || '{}'));
    } catch (error) {
      callback(error);
    }
  });
  req.on('error', callback);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function proxyOpenAI(req, res) {
  const apiKey = (process.env.OPENAI_API_KEY || getConfigApiKey()).trim();
  if (!apiKey) {
    return sendJson(res, 500, {
      error: {
        message: 'OpenAI API key is missing. Set OPENAI_API_KEY before running node server.js, or add a valid key in app/config.js.'
      }
    });
  }

  readJsonBody(req, (bodyError, payload) => {
    if (bodyError) {
      return sendJson(res, 400, { error: { message: 'Invalid JSON request body.' } });
    }

    const requestBody = JSON.stringify(payload);
    const upstreamReq = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'Authorization': `Bearer ${apiKey}`
      }
    }, upstreamRes => {
      let upstreamBody = '';
      upstreamRes.on('data', chunk => {
        upstreamBody += chunk;
      });
      upstreamRes.on('end', () => {
        res.writeHead(upstreamRes.statusCode || 502, { 'Content-Type': 'application/json' });
        res.end(upstreamBody);
      });
    });

    upstreamReq.on('error', error => {
      sendJson(res, 502, { error: { message: `OpenAI proxy request failed: ${error.message}` } });
    });

    upstreamReq.write(requestBody);
    upstreamReq.end();
  });
}

function proxyImage(req, res) {
  const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
  const targetUrl = urlParams.get('url');

  if (!targetUrl) {
    res.writeHead(400);
    return res.end('URL parameter is required');
  }

  try {
    const client = targetUrl.startsWith('https') ? https : http;
    const proxyReq = client.get(targetUrl, (remoteRes) => {
      // Security: Only proxy valid image content types
      const contentType = remoteRes.headers['content-type'];
      if (!contentType || !contentType.startsWith('image/')) {
        res.writeHead(400);
        return res.end('Target URL is not a valid image file');
      }

      res.writeHead(remoteRes.statusCode, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400'
      });
      remoteRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(500);
      res.end(`Proxy Error: ${err.message}`);
    });
    proxyReq.end();
  } catch (e) {
    res.writeHead(500);
    res.end(`Invalid URL: ${e.message}`);
  }
}

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\x1b[31mError: Port ${PORT} is already in use.\x1b[0m`);
    console.error(`Please close the program using this port or run with: set PORT=3001 && node server.js`);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
