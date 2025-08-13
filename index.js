const express = require('express');
const bodyParser = require('body-parser');
const { createSecret, getSecret } = require('./secretStore');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');


const app = express();
app.use(bodyParser.json());

// Titok létrehozása
app.post('/api/v1/secrets', (req, res) => {
    const { secret, maxReads, ttlSeconds } = req.body;

    if (!secret) {
        return res.status(400).json({ error: 'Secret mező kötelező' });
    }

    const token = createSecret(secret, maxReads, ttlSeconds);
    res.status(201).json({ token });
});

// Titok lekérése token alapján
app.get('/api/v1/secrets/:token', (req, res) => {
    const { token } = req.params;
    const result = getSecret(token);

    if (result.error) {
        return res.status(404).json({ error: result.error });
    }

    res.json({ secret: result.secret });
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server fut a ${PORT} porton`));
