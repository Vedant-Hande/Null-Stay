import ExpressError from "../utils/ExpressError.js";

// 404 handler with a more descriptive message
export const notFound = (req, res, next) => {
  const error = new ExpressError(404, `Page Not Found - ${req.originalUrl}`);
  next(error);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  // Log the original error for debugging
  console.error(err.stack);

  // Set default status code and message
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Something went wrong on our end";

  // --- 400 BAD REQUEST ---
  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }
  // Express JSON body parsing Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON payload format.";
  }
  // Malformed URL Error
  if (err instanceof URIError) {
    statusCode = 400;
    message = "The URL requested is malformed or invalid.";
  }

  // --- 401 UNAUTHORIZED ---
  // JWT Errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError" || err.name === "NotBeforeError") {
    statusCode = 401;
    message = "Authentication failed or token expired. Please log in again.";
  }

  // --- 403 FORBIDDEN ---
  // CSRF Token Mismatch
  if (err.code === "EBADCSRFTOKEN") {
    statusCode = 403;
    message = "Form session expired. Please refresh the page and try again.";
  }

  // --- 404 NOT FOUND ---
  // Mongoose Invalid ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found or invalid ID format.";
  }

  // --- 409 CONFLICT ---
  // Mongoose Duplicate Key Error (Unique Constraint)
  if (err.code === 11000) {
    statusCode = 409; // 409 Conflict is more accurate than 400 for duplicates
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field entered. The ${field} already exists.`;
  }

  // --- 413 PAYLOAD TOO LARGE ---
  // Multer File Size Limit Error
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    message = "The file you are trying to upload is too large.";
  }

  // --- 429 TOO MANY REQUESTS ---
  // Rate Limiting
  if (err.statusCode === 429) {
    statusCode = 429;
    message = "Too many requests from this IP, please try again later.";
  }

  // --- 500 INTERNAL SERVER ERROR ---
  // Handle template rendering errors (EJS syntax errors, etc.)
  if (
    err.message &&
    (err.message.includes("Cannot read properties of null") ||
      err.message.includes("Invalid or unexpected token") ||
      err.message.includes("while compiling ejs"))
  ) {
    statusCode = 500;
    message = "Sorry, there was an error loading the interface. Our engineers have been notified.";
  }
  // Handle HTTP headers already sent errors
  if (err.code === "ERR_HTTP_HEADERS_SENT") {
    statusCode = 500;
    message = "Sorry, there was a server conflict processing your request.";
  }

  // --- 503 SERVICE UNAVAILABLE ---
  // Database Connection Errors
  if (err.name === "MongoNetworkError" || err.name === "MongooseServerSelectionError") {
    statusCode = 503;
    message = "Database connection is currently unavailable. Please try again in a moment.";
  }

  // Fallback for general code bugs (TypeErrors, ReferenceErrors not caught above)
  if (err instanceof TypeError || err instanceof ReferenceError) {
    statusCode = 500;
    message = "An unexpected internal error occurred.";
  }

  // Render the error page using the boilerplate layout
  res.status(statusCode).render("listings/error.ejs", {
    statusCode,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack, // Optional: show stack in dev mode only, but for this app we'll keep it null for the UI if desired. For now, setting to null as per previous design.
  });
};
