import mongoose from "mongoose";

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function catchAsyncErrors(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function toFieldDetails(mongooseValidationError) {
  return Object.values(mongooseValidationError.errors).map((fieldError) => ({
    field: fieldError.path,
    message: fieldError.message,
  }));
}

function toHttpError(error) {
  if (error instanceof HttpError) {
    return error;
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return new HttpError(400, "Validation failed", toFieldDetails(error));
  }
  if (error instanceof mongoose.Error.CastError) {
    return new HttpError(400, `Invalid value for ${error.path}`);
  }
  if (error.type === "entity.parse.failed") {
    return new HttpError(400, "Request body is not valid JSON");
  }
  if (error.type === "entity.too.large") {
    return new HttpError(413, "Request body is too large");
  }
  return new HttpError(500, "Something went wrong");
}

export function apiRouteNotFound(req, res) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const httpError = toHttpError(error);

  if (httpError.status >= 500) {
    console.error(`${req.method} ${req.originalUrl} failed:`, error);
  }

  const body = { error: httpError.message };
  if (httpError.details) {
    body.details = httpError.details;
  }
  return res.status(httpError.status).json(body);
}
