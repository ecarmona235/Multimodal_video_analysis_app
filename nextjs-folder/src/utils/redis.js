import Redis from "ioredis";

// This file sets up a Redis client using ioredis.// It connects to a Redis server using the URL specified in the environment variable REDIS_URL.
// If the environment variable is not set, it defaults to 'redis://localhost:6379'.
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export default redis;
