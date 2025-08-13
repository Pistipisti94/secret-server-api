console.log("Hello Secret Server") 
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const secrets = new Map(); // token -> { content, remainingReads, createdAt, expiresAt }

// helperok
function wantsXml(req){
  const accept = (req.get('accept') || '').toLowerCase();
  const q = req.query.format;
  if (q === 'xml') return true;
  return accept.includes('application/xml') || accept.includes('text/xml');
}
function objectToXml(obj, root='response'){
  let xml = `<${root}>`;
  for (const [k,v] of Object.entries(obj)){
    const key = k.replace(/[^a-z0-9_\-]/ig, '');
    if (v === null || v === undefined) {
      xml += `<${key}></${key}>`;
    } else {
      const safe = String(v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      xml += `<${key}>${safe}</${key}>`;
    }
  }
  xml += `</${root}>`;
  return `<?xml version="1.0" encoding="utf-8"?>\n` + xml;
}

// health
app.get('/', (req,res) => res.json({ message: 'Secret Server running', version: '0.1' }));

// create secret
app.post('/api/v1/secrets', (req,res) => {
  const { secret, maxReads, ttlSeconds } = req.body || {};
  if (!secret || typeof secret !== 'string' || !maxReads || Number(maxReads) < 1) {
    return res.status(400).json({ error: 'ValidationError', message: 'secret (string) and maxReads (>=1) are required' });
  }

  const token = crypto.randomBytes(12).toString('hex');
  const now = new Date();
  const expiresAt = (typeof ttlSeconds === 'number' && ttlSeconds > 0) ? new Date(now.getTime() + ttlSeconds * 1000) : null;

  const entry = {
    content: secret,
    remainingReads: Number(maxReads),
    createdAt: now.toISOString(),
    expiresAt: expiresAt ? expiresAt.toISOString() : null
  };
  secrets.set(token, entry);

  const baseUrl = req.protocol + '://' + req.get('host');
  const payload = {
    token,
    secretUrl: `${baseUrl}/api/v1/secrets/${token}`,
    remainingReads: entry.remainingReads,
    expiresAt: entry.expiresAt,
    createdAt: entry.createdAt
  };

  if (wantsXml(req)) {
    res.type('application/xml').status(201).send(objectToXml(payload, 'create'));
  } else {
    res.status(201).json(payload);
  }
});

// fetch & consume secret
app.get('/api/v1/secrets/:token', (req,res) => {
  const token = req.params.token;
  const entry = secrets.get(token);
  const now = new Date();

  if (!entry) {
    return res.status(404).json({ error: 'NotFound', message: 'Secret not found' });
  }

  if (entry.expiresAt && new Date(entry.expiresAt) <= now) {
    secrets.delete(token);
    return res.status(404).json({ error: 'NotFound', message: 'Secret expired' });
  }

  if (entry.remainingReads <= 0) {
    secrets.delete(token);
    return res.status(404).json({ error: 'NotFound', message: 'No remaining reads' });
  }

  // atomikus (egyszálú JS) decrement
  entry.remainingReads = entry.remainingReads - 1;

  const responsePayload = {
    token,
    secret: entry.content,
    remainingReads: entry.remainingReads,
    expiresAt: entry.expiresAt,
    createdAt: entry.createdAt
  };

  // ha elfogyott, töröljük, hogy a következő kérés 404 legyen
  if (entry.remainingReads <= 0) {
    secrets.delete(token);
  } else {
    secrets.set(token, entry);
  }

  if (wantsXml(req)) {
    res.type('application/xml').send(objectToXml(responsePayload, 'secret'));
  } else {
    res.json(responsePayload);
  }
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));