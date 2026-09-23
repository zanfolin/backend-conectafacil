import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeKnex } from './config/database.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
  console.log(`📝 Environment: ${env.NODE_ENV}`);
});

function gracefulShutdown(signal) {
  console.log(`\n📴 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    closeKnex();
    console.log('🗄️ Database connection closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };