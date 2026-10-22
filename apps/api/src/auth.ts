import type { MiddlewareHandler } from "hono";

const encoder = new TextEncoder();

/**
 * Constant-time string comparison (runtime-agnostic: Node, Edge, Workers).
 * Avoids leaking the secret length/prefix through response timing.
 */
export function safeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

export const DEFAULT_DEV_SECRET = "super-secret-system-key";

export const bearerAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const configuredSecret = c.env?.APP_SECRET || process.env.APP_SECRET;
  const isProd = process.env.NODE_ENV === "production";
  const expectedSecret = configuredSecret || (!isProd ? DEFAULT_DEV_SECRET : undefined);

  if (!expectedSecret) {
    // If no secret configured in environment (production), fail securely
    return c.json({ error: "Server authentication is not configured" }, 500);
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or malformed Authorization header" }, 401);
  }

  const token = authHeader.slice(7).trim();
  if (!safeEqual(token, expectedSecret)) {
    return c.json({ error: "Invalid secret token" }, 401);
  }

  await next();
};
