/**
 * middleware/errorHandler.js
 * Owner: Team (shared infrastructure)
 *
 * Catches errors thrown/passed via next(err) from any controller and
 * returns a consistent JSON error shape instead of leaking stack traces
 * or crashing the server (BED "Error-handling" advanced requirement).
 */

function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -`, err);

  // MSSQL constraint / validation style errors
  if (err.number === 2627 || err.number === 2601) {
    return res.status(409).json({ success: false, message: "Duplicate entry. This record already exists." });
  }
  if (err.number === 547) {
    return res.status(409).json({
      success: false,
      message: "This record cannot be modified/deleted because it is referenced by other records (e.g. existing orders).",
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Something went wrong on our end. Please try again later." : err.message,
  });
}

// Wraps async route handlers so thrown errors are forwarded to errorHandler
// instead of crashing the process (avoids try/catch boilerplate everywhere).
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { errorHandler, asyncHandler };
