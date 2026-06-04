import { describe, it, expect } from "vitest";
import {
  ApiError,
  NotFoundError,
  ValidationError,
  ConflictError,
  InternalError,
} from "../../utils/errors";

describe("ApiError", () => {
  it("creates an error with message, statusCode, and errorCode", () => {
    const error = new ApiError("Something went wrong", 400, "BAD_REQUEST");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe("BAD_REQUEST");
    expect(error.name).toBe("ApiError");
  });
});

describe("NotFoundError", () => {
  it("formats the message with resource name and id", () => {
    const error = new NotFoundError("Workflow", "wf-123");
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Workflow not found: wf-123");
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe("NOT_FOUND");
    expect(error.name).toBe("NotFoundError");
  });
});

describe("ValidationError", () => {
  it("creates a validation error with 400 status", () => {
    const error = new ValidationError("Name is required");
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Name is required");
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe("VALIDATION_ERROR");
    expect(error.name).toBe("ValidationError");
  });
});

describe("ConflictError", () => {
  it("creates a conflict error with 409 status", () => {
    const error = new ConflictError("Email already exists");
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Email already exists");
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe("CONFLICT_ERROR");
    expect(error.name).toBe("ConflictError");
  });
});

describe("InternalError", () => {
  it("creates an internal error with 500 status", () => {
    const error = new InternalError("Database connection failed");
    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Database connection failed");
    expect(error.statusCode).toBe(500);
    expect(error.errorCode).toBe("INTERNAL_ERROR");
    expect(error.name).toBe("InternalError");
  });
});
