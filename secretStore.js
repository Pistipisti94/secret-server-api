const secrets = {};

function createSecret(secretText, maxReads = 1, ttlSeconds = 3600)
{
    const crypto = require('crypto');
    const token = crypto.randomBytes(8).toString('hex');
    const expiresAt = Date.now() + ttlSeconds * 1000;

    secrets[token] = {
        secret: secretText,
        remainingReads: maxReads,
        expiresAt
    };

    return token;
}

function getSecret(token) {
    const secretEntry = secrets[token];

    if (!secretEntry){
        return {error: 'Titok nem található'};
    }

    if(Date.now() > secretEntry.expiresAt) {
        delete secrets[token];
        return { error: 'A titok lejárt' };
    }

    if (secretEntry.remainingReads <= 0) {
        delete secrets[token];
        return {error: 'A titok már nem elérhető'};
    }

    secretEntry.remainingReads -=1;
    return { secret: secretEntry.secret }
}

module.exports = { createSecret, getSecret };