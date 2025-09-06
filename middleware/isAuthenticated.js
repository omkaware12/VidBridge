const jwt = require("jsonwebtoken");
const ExpressError = require("./expressError");

const ensureAuthenticated = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return next(new ExpressError("JWT token required", 401));
  }

  // Remove "Bearer "
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded = { id: "...", iat: ..., exp: ... }
    req.user = decoded; // ✅ attach payload
    next();
  } catch (err) {
    return next(new ExpressError("Invalid or expired token", 401));
  }
};

module.exports = ensureAuthenticated;

