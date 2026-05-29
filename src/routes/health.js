async function healthRoute(request, reply) {
  return reply.send({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

module.exports = healthRoute;
