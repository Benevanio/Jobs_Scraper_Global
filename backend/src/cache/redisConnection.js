let client = null;
let currentUrl = null;
let connected = false;

export function isRedisConnected() {
  return connected;
}

export async function getRedisClient() {
  const redisUrl = process.env.REDIS_URL?.trim();

  if (!redisUrl) return null;

  if (client && currentUrl === redisUrl) {
    return client;
  }

  currentUrl = redisUrl;

  try {
    const { createClient } = await import("redis");

    const newClient = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy(retries) {
          if (retries >= 2) return false;
          return Math.min((retries + 1) * 100, 500);
        },
      },
    });

    newClient.on("ready", () => {
      connected = true;
    });

    newClient.on("error", () => {
      connected = false;
      client = null;
      currentUrl = null;
    });

    newClient.on("end", () => {
      connected = false;
    });

    await newClient.connect();

    client = newClient;
    return client;
  } catch (error) {
    console.warn("Falha ao conectar no Redis:", error.message);
    client = null;
    currentUrl = null;
    connected = false;
    return null;
  }
}
