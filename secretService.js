const crypto = require('crypto');

class SecretService {
    constructor() {
        this.secrets = new Map();
    }

    create(secret, maxReads = 1, ttlSeconds = null) {
        if (!secret || maxReads < 1) {
            throw new Error('Invalid parameters');
        }

        const token = crypto.randomBytes(12).toString('hex');
        const now = new Date();
        const expiresAt = ttlSeconds ? new Date(now.getTime() + ttlSeconds * 1000) : null;

        const entry = {
            content: secret,
            remainingReads: Number(maxReads),
            createdAt: now.toISOString(),
            expiresAt: expiresAt ? expiresAt.toISOString() : null
        };

        this.secrets.set(token, entry);
        return { token, entry };
    }

    get(token) {
        const entry = this.secrets.get(token);
        if (!entry) return null;

        const now = new Date();
        if (entry.expiresAt && new Date(entry.expiresAt) < now) {
            this.secrets.delete(token);
            return null;
        }

        if (entry.remainingReads < 1) {
            this.secrets.delete(token);
            return null;
        }

        entry.remainingReads -= 1;
        if (entry.remainingReads === 0) {
            this.secrets.delete(token);
        }

        return entry;
    }
}

module.exports = new SecretService();
