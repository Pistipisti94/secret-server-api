// Egyszerű in-memory (memóriában tárolt) objektum a titkokhoz
const secrets = {};

// Titok létrehozása
function createSecret(secretText, maxReads = 1, ttlSeconds = 3600)
{
    const crypto = require('crypto');
    const token = crypto.randomBytes(8).toString('hex');
    const expiresAt = Date.now() + ttlSeconds * 1000;

     // Titok eltárolása a memóriában
    secrets[token] = {
        secret: secretText,
        remainingReads: maxReads,
        expiresAt
    };

    return token;
}

// Titok lekérése
function getSecret(token) {
    const secretEntry = secrets[token];

    // Ha nincs ilyen token, hibát adunk vissza
    if (!secretEntry){
        return {error: 'Titok nem található'};
    }

     // Ha lejárt a titok, töröljük és hibát adunk vissza
    if(Date.now() > secretEntry.expiresAt) {
        delete secrets[token];
        return { error: 'A titok lejárt' };
    }

    // Ha elfogyott a megtekintés lehetőség, töröljük és hibát adunk vissza
    if (secretEntry.remainingReads <= 0) {
        delete secrets[token];
        return {error: 'A titok már nem elérhető'};
    }

    // Ha minden rendben, csökkentjük a megtekintések lehetőségének számát
    secretEntry.remainingReads -=1;

     // Visszaadjuk a titkot
    return { secret: secretEntry.secret }
}
module.exports = { createSecret, getSecret };