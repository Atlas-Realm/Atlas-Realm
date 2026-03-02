import { AppError } from "@/lib/errors";
import { errorResponse } from "@/lib/response";
import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export function errorHandler(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      errorResponse(err.message, err.code),
      err.statusCode as StatusCode,
    );
  }

  console.error("[Unhandled Error]", err);
  return c.json(errorResponse("Internal server error", "INTERNAL_ERROR"), 500);
}
