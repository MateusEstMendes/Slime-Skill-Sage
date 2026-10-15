import { logger } from "./logger";

export type NotificationStatus = NotificationPermission | "unsupported";

class NotificationService {
  public isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  public getPermission(): NotificationStatus {
    if (!this.isSupported()) {
      return "unsupported";
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationStatus> {
    if (!this.isSupported()) {
      await logger.warn("notif", "Web Notifications não suportadas neste ambiente");
      return "unsupported";
    }

    try {
      const permission = await Notification.requestPermission();
      await logger.info("notif", `Permissão de notificação atualizada: ${permission}`);
      return permission;
    } catch (err) {
      await logger.error(
        "notif",
        `Erro ao solicitar permissão: ${err instanceof Error ? err.message : String(err)}`
      );
      return "denied";
    }
  }

  public async sendNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<boolean> {
    if (!this.isSupported()) {
      await logger.warn("notif", "Não foi possível enviar notificação: API não suportada");
      return false;
    }

    if (Notification.permission !== "granted") {
      await logger.warn(
        "notif",
        `Não foi possível enviar notificação: permissão '${Notification.permission}'`
      );
      return false;
    }

    try {
      // 1. Prioridade: ServiceWorkerRegistration (obrigatório para Android Chrome e PWA mobile)
      if ("serviceWorker" in navigator) {
        try {
          const reg =
            (await navigator.serviceWorker.getRegistration()) ||
            (await navigator.serviceWorker.ready);

          if (reg && "showNotification" in reg) {
            await reg.showNotification(title, {
              icon: "/pwa-192x192.png",
              badge: "/favicon.ico",
              ...options,
            });
            await logger.info(
              "notif",
              `Notificação disparada com sucesso via ServiceWorker: "${title}"`
            );
            return true;
          }
        } catch (swErr) {
          await logger.warn(
            "notif",
            "Tentativa via ServiceWorker falhou, tentando construtor padrão",
            { error: swErr instanceof Error ? swErr.message : String(swErr) }
          );
        }
      }

      // 2. Fallback: Construtor nativo Notification (desktop)
      const notif = new Notification(title, {
        icon: "/pwa-192x192.png",
        badge: "/favicon.ico",
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      await logger.info(
        "notif",
        `Notificação disparada via construtor nativo: "${title}"`
      );
      return true;
    } catch (err) {
      await logger.error(
        "notif",
        `Falha ao disparar notificação: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  }
}


export const notificationService = new NotificationService();
