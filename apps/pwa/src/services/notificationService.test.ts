import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationService } from "./notificationService";

describe("NotificationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles unsupported environment gracefully", async () => {
    const originalNotification = window.Notification;
    // @ts-expect-error test override
    delete window.Notification;

    expect(notificationService.isSupported()).toBe(false);
    expect(notificationService.getPermission()).toBe("unsupported");
    expect(await notificationService.requestPermission()).toBe("unsupported");
    expect(await notificationService.sendNotification("Teste")).toBe(false);

    window.Notification = originalNotification;
  });

  it("handles supported environment with permission flow", async () => {
    let mockPermission: NotificationPermission = "default";
    const requestPermissionMock = vi.fn().mockImplementation(async () => {
      mockPermission = "granted";
      return "granted";
    });

    const mockNotificationConstructor = vi.fn();

    // @ts-expect-error test mock
    window.Notification = mockNotificationConstructor;
    Object.defineProperty(window.Notification, "permission", {
      get: () => mockPermission,
      configurable: true,
    });
    window.Notification.requestPermission = requestPermissionMock;

    expect(notificationService.isSupported()).toBe(true);
    expect(notificationService.getPermission()).toBe("default");

    // Request permission
    const granted = await notificationService.requestPermission();
    expect(granted).toBe("granted");
    expect(notificationService.getPermission()).toBe("granted");

    // Send notification
    const sent = await notificationService.sendNotification("Aviso do Sistema", {
      body: "Teste",
    });
    expect(sent).toBe(true);
    expect(mockNotificationConstructor).toHaveBeenCalledWith(
      "Aviso do Sistema",
      expect.objectContaining({ body: "Teste" })
    );
  });
});
