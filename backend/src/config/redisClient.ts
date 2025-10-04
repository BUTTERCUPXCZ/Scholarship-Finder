import { createClient } from 'redis';

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        tls: true,
        rejectUnauthorized: false, // Allow self-signed certificates
    }
});

redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
});

const connectRedis = async (): Promise<void> => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Connected to Upstash Redis");
    }
};

export { redisClient, connectRedis };