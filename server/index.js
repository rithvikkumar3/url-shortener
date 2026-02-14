import 'dotenv/config.js';
import express from "express";
import cors from "cors";
import { createClient } from "redis";
import encodeBase62 from "./services/base_62_encoding_service.js";

const PORT = process.env.PORT || 3001;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const app = express();
app.use(cors());
app.use(express.json());

//init redis client
const redisClient = createClient({
    url: REDIS_URL
})

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

app.post('/shorten', async (req, res) => {
  const originalUrl = req.body.originalUrl;  
  if (!originalUrl) {
    return res.status(400).json({ error: 'Original URL is required' });
  }   
  try {
    // Check if URL already exists
    const existingShortUrlId = await redisClient.hGet('url_to_short', originalUrl);
    
    if (existingShortUrlId) {
      // URL already shortened, return existing short URL
      return res.json({
        status: true,
        data: `${DOMAIN}/r/${existingShortUrlId}`,
      });
    }

    // Generate new short URL
    const id = await redisClient.incr('global_counter');
    const shortUrlId = encodeBase62(id);

    // Store both mappings for quick lookup
    await redisClient.hSet('urls', shortUrlId, originalUrl);
    await redisClient.hSet('url_to_short', originalUrl, shortUrlId);
    
    res.json({
        status: true,
        data: `${DOMAIN}/r/${shortUrlId}`,
    });
  } catch (error) {
    res.json({
        status: false,
        error: error.message,
    });
    
  }
});  



// Redirect short URL to original
app.get('/r/:shortUrlId', async (req, res) => {
    const { shortUrlId } = req.params;
    try {
        const originalUrl = await redisClient.hGet('urls', shortUrlId);
        if (originalUrl) {
            res.redirect(301, originalUrl);
        } else {
            res.status(404).json({
                status: false,
                error: 'Short URL not found',
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
});

// API route to get original URL without redirect
app.get('/api/resolve/:shortUrlId', async (req, res) => {
    const { shortUrlId } = req.params;
    try {
        const originalUrl = await redisClient.hGet('urls', shortUrlId);
        if (originalUrl) {
            res.json({
                status: true,
                data: originalUrl,
            });
        } else {
            res.status(404).json({
                status: false,
                error: 'Short URL not found',
            });
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message,
        });
    }
});



app.listen(PORT, async() => {
    try {
        await redisClient.connect();
        console.log(`Server is running on port  http://localhost:${PORT}`);
    } catch (error) {
        console.error('Failed to start server:', error);    
    }

});
