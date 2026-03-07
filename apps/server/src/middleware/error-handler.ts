import { AppError } from "@/lib/errors";
import { t } from "@/lib/i18n";
import { errorResponse } from "@/lib/response";
import type { Context } from "hono";

export function errorHandler(err: Error, c: Context) {
  const lang = c.get("language") ?? "en";

  if (err instanceof AppError) {
    return c.json(
      errorResponse(t(lang, err.messageKey), err.code),
      err.statusCode as any,
    );
  }

  console.error("[Unhandled Error]", err);
  return c.json(
    errorResponse(t(lang, "errors.internal"), "INTERNAL_ERROR"),
    500,
  );
}
