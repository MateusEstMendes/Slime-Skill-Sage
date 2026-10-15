import { HealthResponseSchema, type HealthResponse } from "@slime-sage/shared";

export async function verifyApiConnection(
  apiUrl: string,
  token: string,
): Promise<{ success: boolean; data?: HealthResponse; error?: string }> {
  const tryFetch = async (targetUrl: string) => {
    const formattedUrl = targetUrl.replace(/\/+$/, "");
    const endpoint = formattedUrl ? `${formattedUrl}/health` : "/health";
    return fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
      },
    });
  };

  try {
    let res: Response;
    try {
      res = await tryFetch(apiUrl);
    } catch (networkErr) {
      if (apiUrl.includes("localhost:3000") || apiUrl === "") {
        try {
          res = await tryFetch("/api");
        } catch {
          throw networkErr;
        }
      } else {
        throw networkErr;
      }
    }

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
    const message =
      err instanceof Error ? err.message : "Erro desconhecido de rede";
    return {
      success: false,
      error: `Não foi possível alcançar o servidor (${message}). Verifique a URL e a conexão.`,
    };
  }
}
