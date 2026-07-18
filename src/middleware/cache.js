const NodeCache = require("node-cache");

const myCache = new NodeCache({ stdTTL: 7200, checkperiod: 600 });

const cacheMiddleware = (duration = 7200) => {
    return (req, res, next) => {
        if (req.method !== 'GET') return next();

        const key = req.originalUrl;
        const cachedResponse = myCache.get(key);

        if (cachedResponse) {
            return res.json(cachedResponse);
        } else {
            const originalJson = res.json;
            res.json = (body) => {
                if (body && body.success !== false) {
                    myCache.set(key, body, duration);
                }
                originalJson.call(res, body);
            };
            next();
        }
    };
};

// Memory logging removed from console (moved to API)
module.exports = { cacheMiddleware, myCache };
