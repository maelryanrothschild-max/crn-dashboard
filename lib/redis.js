import { Redis } from "@upstash/redis";

// Vercel-интеграция Upstash называет переменные в старом формате
// совместимости с KV (KV_REST_API_URL / KV_REST_API_TOKEN), поэтому
// проверяем оба варианта названий на всякий случай.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});
