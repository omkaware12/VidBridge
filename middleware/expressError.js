


class ExpressError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ExpressError;
