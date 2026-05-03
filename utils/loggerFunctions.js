function getRequestMeta(req) {
  return {
    requestId: req.requestId,
    traceId: req.traceId,
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
    userAgent: req.headers["user-agent"],
  };
}

module.exports = {
    getRequestMeta,
}