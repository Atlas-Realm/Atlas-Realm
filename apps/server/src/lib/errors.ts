import type { TranslationKey } from "@/lib/i18n";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly messageKey: TranslationKey,
    public readonly code?: string,
  ) {
    super(messageKey);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(messageKey: TranslationKey = "errors.unauthorized") {
    super(401, messageKey, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(messageKey: TranslationKey = "errors.forbidden") {
    super(403, messageKey, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(messageKey: TranslationKey = "errors.not_found") {
    super(404, messageKey, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(messageKey: TranslationKey = "errors.conflict") {
    super(409, messageKey, "CONFLICT");
  }
}

export class ExternalApiError extends AppError {
  constructor(messageKey: TranslationKey = "errors.external_api") {
    super(502, messageKey, "EXTERNAL_API_ERROR");
  }
}
