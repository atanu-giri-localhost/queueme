import 'dotenv/config';
import { app } from './app.js';
import prisma from './prisma.js';

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 QueueMe API server running on http://${HOST}:${PORT}`);
  console.log(`🩺 Health check available at http://${HOST}:${PORT}/api/health`);
  console.log(`📦 Queue items endpoint at http://${HOST}:${PORT}/api/items`);
});

// Graceful shutdown handling
async function shutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    console.log('Prisma client disconnected.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
