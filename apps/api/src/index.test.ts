import { describe, it, expect, beforeEach } from "vitest";
import { app } from "./index";

describe("API /health Endpoint", () => {
  beforeEach(() => {
    process.env.APP_SECRET = "super-secret-system-key";
  });

  it("should return 401 when Authorization header is missing", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("should return 401 when token is invalid", async () => {
    const res = await app.request("/health", {
      headers: {
        Authorization: "Bearer wrong-token",
      },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Invalid secret token");
  });

  it("should return 200 and health info when token is correct", async () => {
    const res = await app.request("/health", {
      headers: {
        Authorization: "Bearer super-secret-system-key",
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.app).toBe("slime-sage");
    expect(body).toHaveProperty("timestamp");
  });
});
