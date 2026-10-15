import type { MiddlewareHandler } from "hono";

export const bearerAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const expectedSecret = c.env?.APP_SECRET || process.env.APP_SECRET;

  if (!expectedSecret) {
    // If no secret configured in environment, fail securely
    return c.json({ error: "Server authentication is not configured" }, 500);
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Missing or malformed Authorization header" }, 401);
  }

  const token = authHeader.slice(7).trim();
  if (token !== expectedSecret) {
    return c.json({ error: "Invalid secret token" }, 401);
  }

  await next();
};
