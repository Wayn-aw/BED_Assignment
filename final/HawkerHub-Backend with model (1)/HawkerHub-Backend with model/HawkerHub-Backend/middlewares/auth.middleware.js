/**
 * middleware/auth.middleware.js
 * Owner: Kenneth (Account Management / Auth)
 *
 * verifyToken   - confirms the request carries a valid JWT and attaches
 *                 the decoded payload to req.user.
 * requireRole   - restricts a route to one or more Roles
 *                 e.g. requireRole('Vendor'), requireRole('NEAOfficer','Admin')
 */

const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role, email }
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token." });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Access denied. Not authenticated." });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires role: ${allowedRoles.join(" or ")}.`,
      });
    }
    next();
  };
}

// Like verifyToken, but does NOT reject the request if no/invalid token is
// present - used for endpoints that support both guest and logged-in users
// (e.g. checkout). If a valid token IS present, req.user is still populated.
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // ignore invalid token for optional-auth routes; treat as guest
  }
  next();
}

module.exports = { verifyToken, requireRole, optionalAuth };
