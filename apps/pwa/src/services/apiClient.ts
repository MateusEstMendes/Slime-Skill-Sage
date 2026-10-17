import {
  HealthResponseSchema,
  ChatResponseSchema,
  TtsResponseSchema,
  type HealthResponse,
  type ChatRequest,
  type ChatResponse,
  type TtsResponse,
} from "@slime-sage/shared";

async function authenticatedFetch(
  apiUrl: string,
  token: string,
  endpointPath: string,
  options?: RequestInit,
): Promise<Response> {
  const tryFetch = async (targetUrl: string) => {
    const formattedUrl = targetUrl.replace(/\/+$/, "");
    const endpoint = formattedUrl ? `${formattedUrl}${endpointPath}` : endpointPath;
    return fetch(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });
  };

  try {
    return await tryFetch(apiUrl);
  } catch (networkErr) {
    if (apiUrl.includes("localhost:3000") || apiUrl === "") {
      try {
        return await tryFetch("/api");
      } catch {
        throw networkErr;
      }
    } else {
      throw networkErr;
    }
  }
}

export async function verifyApiConnection(
  apiUrl: string,
  token: string,
): Promise<{ success: boolean; data?: HealthResponse; error?: string }> {
  try {
    const res = await authenticatedFetch(apiUrl, token, "/health", { method: "GET" });

    if (res.status === 401) {
      return {
        success: false,
        error: "Acesso Negado: Token Secreto incorreto ou inválido.",
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: `Falha na conexão com o Sistema (${res.status} ${res.statusText}).`,
      };
    }

    const json = await res.json();
    const parsed = HealthResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        success: false,
        error: "Resposta da API fora do padrão esperado do Sistema.",
      };
    }

    return { success: true, data: parsed.data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido de rede";
    return {
      success: false,
      error: `Não foi possível alcançar o servidor (${message}). Verifique a URL e a conexão.`,
    };
  }
}

export async function sendChatMessage(
  apiUrl: string,
  token: string,
  request: ChatRequest,
): Promise<{ success: boolean; data?: ChatResponse; error?: string }> {
  try {
    const res = await authenticatedFetch(apiUrl, token, "/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });

    if (res.status === 401) {
      return {
        success: false,
        error: "Acesso Negado: Token Secreto incorreto ou expirado.",
      };
    }

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      const fallbackMsg =
        res.status === 500 || res.status === 502 || res.status === 503
          ? `Canal neural inacessível (${res.status}): O servidor backend (porta 3000) não respondeu. Certifique-se de executar 'pnpm dev'.`
          : `Erro no canal neural da Grande Sábio (${res.status}).`;
      return {
        success: false,
        error: errJson.error || fallbackMsg,
      };
    }

    const json = await res.json();
    const parsed = ChatResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        success: false,
        error: "Resposta do chat fora do padrão esperado do Sistema.",
      };
    }

    return { success: true, data: parsed.data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido de rede";
    return {
      success: false,
      error: `Falha na comunicação neural com o servidor (${message}).`,
    };
  }
}

export async function synthesizeSpeechApi(
  apiUrl: string,
  token: string,
  text: string,
  voice: string = "Kore",
): Promise<{ success: boolean; data?: TtsResponse; error?: string; code?: string }> {
  try {
    const res = await authenticatedFetch(apiUrl, token, "/tts", {
      method: "POST",
      body: JSON.stringify({ text, voice }),
    });

    if (res.status === 401) {
      return {
        success: false,
        error: "Acesso Negado: Token Secreto incorreto para síntese de voz.",
      };
    }

    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as { error?: string; code?: string };
      const fallbackMsg =
        res.status === 500 || res.status === 502 || res.status === 503
          ? `Sintetizador inacessível (${res.status}): O servidor backend (porta 3000) não respondeu. Certifique-se de executar 'pnpm dev'.`
          : `Falha na síntese de voz neural (${res.status}).`;
      return {
        success: false,
        error: errJson.error || fallbackMsg,
        code: errJson.code,
      };
    }

    const json = await res.json();
    const parsed = TtsResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        success: false,
        error: "Resposta do sintetizador fora do formato de áudio esperado.",
      };
    }

    return { success: true, data: parsed.data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro de conexão";
    return {
      success: false,
      error: `Não foi possível conectar ao sintetizador neural (${message}).`,
    };
  }
}
