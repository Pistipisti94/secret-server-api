const crypto = require('crypto');

// Titokkezelő szolgáltatás (osztály alapú)
class SecretService {
    constructor() {
        this.secrets = new Map();
    }

    create(secret, maxReads = 1, ttlSeconds = null) {
        if (!secret || maxReads < 1) {
            throw new Error('Invalid parameters');
        }

        // Token generálása (24 karakter hexadecimális)
        const token = crypto.randomBytes(12).toString('hex');

        const now = new Date();

        // Ha van TTL (lejárati idő másodpercben), kiszámoljuk a lejárati dátumot
        const expiresAt = ttlSeconds ? new Date(now.getTime() + ttlSeconds * 1000) : null;

        // Titok adatai
        const entry = {
            content: secret,
            remainingReads: Number(maxReads),
            createdAt: now.toISOString(),
            expiresAt: expiresAt ? expiresAt.toISOString() : null
        };

        // Token és titok eltárolása
        this.secrets.set(token, entry);

        return { token, entry };
    }

    // Titok lekérése
    get(token) {
        const entry = this.secrets.get(token); // Token alapján keresés
        if (!entry) return null; // Ha nincs, null-t adunk vissza

        const now = new Date();

        // Ha van lejárati idő és már lejárt
        if (entry.expiresAt && new Date(entry.expiresAt) < now) {
            this.secrets.delete(token);
            return null;
        }

        // Ha elfogyott az olvasási lehetőség
        if (entry.remainingReads < 1) {
            this.secrets.delete(token);
            return null;
        }

        // Egy megtekintésel csökkentjük
        entry.remainingReads -= 1;

        // Ha ez volt az utolsó megtekintés, töröljük
        if (entry.remainingReads === 0) {
            this.secrets.delete(token);
        }

        return entry;
    }
}

module.exports = new SecretService();
