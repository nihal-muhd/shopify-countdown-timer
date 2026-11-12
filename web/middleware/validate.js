import { HttpError } from "./errorHandler.js";

function toFieldDetails(zodIssues) {
  return zodIssues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
}

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return next(
        new HttpError(
          400,
          "Validation failed",
          toFieldDetails(result.error.issues),
        ),
      );
    }
    req.validatedBody = result.data;
    return next();
  };
}
