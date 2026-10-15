import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  app: z.literal("slime-sage"),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ErrorResponseSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const LogScopeSchema = z.enum([
  "ai",
  "notif",
  "game",
  "db",
  "focus",
  "backup",
  "tts",
]);

export type LogScope = z.infer<typeof LogScopeSchema>;

export const LogLevelSchema = z.enum(["debug", "info", "warn", "error"]);

export type LogLevel = z.infer<typeof LogLevelSchema>;

export const AppLogEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  level: LogLevelSchema,
  scope: LogScopeSchema,
  message: z.string(),
  data: z.unknown().optional(),
});

export type AppLogEntry = z.infer<typeof AppLogEntrySchema>;

export const KvEntrySchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.string().optional(),
});

export type KvEntry = z.infer<typeof KvEntrySchema>;

