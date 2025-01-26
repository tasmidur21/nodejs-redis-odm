// src/utils/redisClient.js
import { createClient } from "redis";

export const redisClient = createClient({
  socket: { host: "localhost", port: 6379 },
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}