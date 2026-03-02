export function successResponse<T>(data: T) {
  return { success: true as const, data };
}

export function errorResponse(message: string, code?: string) {
  return { success: false as const, error: message, ...(code ? { code } : {}) };
}
