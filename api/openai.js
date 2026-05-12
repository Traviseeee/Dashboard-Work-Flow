const https = require('https');

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body) {
      if (Buffer.isBuffer(req.body)) {
        resolve(JSON.parse(req.body.toString('utf8')));
        return;
      }

      resolve(typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function postToOpenAI(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);
    const upstreamReq = https.request({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        Authorization: `Bearer ${apiKey}`,
      },
    }, upstreamRes => {
      let upstreamBody = '';
      upstreamRes.on('data', chunk => {
        upstreamBody += chunk;
      });
      upstreamRes.on('end', () => {
        resolve({
          statusCode: upstreamRes.statusCode || 502,
          body: upstreamBody,
        });
      });
    });

    upstreamReq.on('error', reject);
    upstreamReq.write(requestBody);
    upstreamReq.end();
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: { message: 'Method not allowed.' } });
    return;
  }

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    sendJson(res, 500, {
      error: {
        message: 'OpenAI API key is missing. Set OPENAI_API_KEY in your Vercel project environment variables.',
      },
    });
    return;
  }

  try {
    const payload = await readBody(req);
    const upstream = await postToOpenAI(apiKey, payload);
    res.statusCode = upstream.statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(upstream.body);
  } catch (error) {
    sendJson(res, 502, { error: { message: `OpenAI proxy request failed: ${error.message}` } });
  }
};
