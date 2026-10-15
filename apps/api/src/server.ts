import { serve } from "@hono/node-server";
import { app } from "./index";

try {
  process.loadEnvFile?.(".env");
} catch {
  // Ignora se o arquivo .env já foi carregado ou não existe
}

const port = Number(process.env.PORT) || 3000;
const hostname = "0.0.0.0";

console.log(`[Slime Sage API] Servidor iniciado em http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
  hostname,
});
