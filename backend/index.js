// secureSecretsManager.js
const express = require('express');
const Redis = require('ioredis');
const rateLimit = require('express-rate-limit');
const { encryptWithSignature } = require('@chainlink/functions-toolkit');

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
app.use(express.json());

const DON_PUBLIC_KEY = process.env.DON_PUBLIC_KEY;
const TOKEN_EXPIRY = 5 * 60; // 5 minutes in seconds

app.post('/store-token', async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ error: 'Access token required' });
        }
        
        const verificationId = crypto.randomBytes(16).toString('hex');
        
        // Store in Redis with expiration
        await redis.set(
            `token:${verificationId}`,
            accessToken,
            'EX',
            TOKEN_EXPIRY
        );
        
        res.json({ verificationId });
    } catch (error) {
        console.error('Error storing token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/secrets', async (req, res) => {
    try {
        // Get all keys
        const keys = await redis.keys('token:*');
        
        // Get all tokens
        const secrets = {};
        for (const key of keys) {
            const id = key.replace('token:', '');
            const token = await redis.get(key);
            if (token) {
                secrets[id] = token;
            }
        }
        
        const encryptedSecrets = await encryptWithSignature(
            DON_PUBLIC_KEY,
            JSON.stringify(secrets)
        );
        
        res.json({ encryptedSecrets });
    } catch (error) {
        console.error('Error encrypting secrets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = app;