export class ApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly errorCode: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "CONFLICT_ERROR");
    this.name = "ConflictError";
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string) {
    super(message, 401, "UNAUTHORIZED");
    this.name = "Unauthorized";
  }
}

export class InternalError extends ApiError {
  constructor(message: string) {
    super(message, 500, "INTERNAL_ERROR");
    this.name = "InternalError";
  }
}
