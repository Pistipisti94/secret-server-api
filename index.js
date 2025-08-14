// Könyvtárak betöltése
const express = require('express');
const bodyParser = require('body-parser');
const { createSecret, getSecret } = require('./secretStore');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// Swagger dokumentáció betöltése
// swagger.yaml tartalmazza az API leírást
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();

// Beállítjuk, hogy a szerver tudja fogadni a JSON formátumú kéréseket
app.use(bodyParser.json());



// Titok létrehozása
app.post('/api/v1/secrets', (req, res) => {
    const { secret, maxReads, ttlSeconds } = req.body;

    // Ha nincs titok megadva, hibát adunk vissza
    if (!secret) {
        return res.status(400).json({ error: 'Secret mező kötelező' });
    }

      // Létrehozzuk a titkot és kapunk egy egyedi tokent
    const token = createSecret(secret, maxReads, ttlSeconds);

     // 201-es státuszkóddal visszaküldjük a tokent
    res.status(201).json({ token });
});

// Titok lekérése token alapján
app.get('/api/v1/secrets/:token', (req, res) => {
    const { token } = req.params;
    const result = getSecret(token);

     // Ha hiba van (lejárt vagy nem létezik), 404-et adunk vissza
    if (result.error) {
        return res.status(404).json({ error: result.error });
    }

     // Sikeres lekérés esetén visszaküldjük a titkot
    res.json({ secret: result.secret });
});


// Swagger dokumentáció elérhető az /api-docs útvonalon
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Szerver indítása
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server fut a ${PORT} porton`));
