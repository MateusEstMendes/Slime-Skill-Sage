import { serve } from "@hono/node-server";
import { app } from "./index";

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../.env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(process.cwd(), "apps/api/.env"),
];

for (const envPath of envPaths) {
  try {
    process.loadEnvFile?.(envPath);
  } catch {
    // Continua para o próximo caminho caso não exista
  }
}

const port = Number(process.env.PORT) || 3000;
const hostname = "0.0.0.0";

console.log(`[Slime Sage API] Servidor iniciado em http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname,
});
