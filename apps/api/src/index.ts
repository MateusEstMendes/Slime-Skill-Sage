import { Hono } from "hono";
import { cors } from "hono/cors";
import { bearerAuth } from "./auth";
import { ChatRequestSchema, TtsRequestSchema } from "@slime-sage/shared";
import { synthesizeSpeech, handleGsChat } from "./services/geminiService";

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
app.use("/chat", bearerAuth);
app.use("/tts", bearerAuth);

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    app: "slime-sage",
    timestamp: new Date().toISOString(),
  });
});

app.post("/tts", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = TtsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Parâmetros inválidos para síntese de voz.",
          details: parsed.error.issues,
        },
        400,
      );
    }

    const { text, voice } = parsed.data;
    const result = await synthesizeSpeech(text, voice);
    return c.json(result, 200);
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (errorObj?.code === "NO_API_KEY") {
      return c.json(
        {
          error: "Chave da API Gemini não configurada no servidor.",
          code: "NO_API_KEY",
        },
        503,
      );
    }
    if (errorObj?.code === "NEURAL_HIBERNATION") {
      return c.json(
        {
          error: "Aviso: Grande Sábio em modo de hibernação neural. Síntese indisponível.",
          code: "NEURAL_HIBERNATION",
        },
        503,
      );
    }
    return c.json(
      {
        error: errorObj?.message || "Erro desconhecido ao sintetizar voz.",
      },
      500,
    );
  }
});

app.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          error: "Parâmetros inválidos para o chat da Grande Sábio.",
          details: parsed.error.issues,
        },
        400,
      );
    }

    const { messages, hunter_context } = parsed.data;
    const response = await handleGsChat(messages, hunter_context);
    return c.json(response, 200);
  } catch (err: unknown) {
    console.error("[API /chat] Erro ao processar requisição:", err);
    const errorObj = err as { message?: string };
    return c.json(
      {
        error: errorObj?.message || "Erro desconhecido no chat da Grande Sábio.",
      },
      500,
    );
  }
});

export default app;
