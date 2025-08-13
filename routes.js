const express = require('express');
const router = express.Router();
const secretService = require('./secretService');

function wantsXml(req){
    return req.query.format === 'xml' || (req.headers.accept && req.headers.accept.includes('application/xml'));
}

function objectToXml(obj, root='response') {
    let xml = `<${root}>`;
    for (const key in obj) {
        xml += `<${key}>${obj[key]}</${key}>`;
    }
    xml += `</${root}>`;
    return xml;
}

// Health check
router.get('/', (req,res) => res.json({ message: 'Secret Server running', version: '0.1' }));

// Create secret
router.post('/api/v1/secrets', (req,res) => {
    try {
        const { secret, maxReads, ttlSeconds } = req.body || {};
        const { token, entry } = secretService.create(secret, maxReads, ttlSeconds);

        const response = { token, ...entry };
        if (wantsXml(req)) {
            res.set('Content-Type','application/xml');
            return res.send(objectToXml(response));
        }
        res.json(response);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get secret
router.get('/api/v1/secrets/:token', (req,res) => {
    const entry = secretService.get(req.params.token);
    if (!entry) return res.status(404).json({ error: 'Secret not found or expired' });

    if (wantsXml(req)) {
        res.set('Content-Type','application/xml');
        return res.send(objectToXml(entry));
    }
    res.json(entry);
});

module.exports = router;
