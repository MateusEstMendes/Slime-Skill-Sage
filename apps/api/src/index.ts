import { Hono } from "hono";
import { cors } from "hono/cors";
import { bearerAuth } from "./auth";

export const app = new Hono<{
  Bindings: {
    APP_SECRET?: string;
  };
}>();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use("/health", bearerAuth);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    app: "slime-sage",
    timestamp: new Date().toISOString(),
  });
});

export default app;
