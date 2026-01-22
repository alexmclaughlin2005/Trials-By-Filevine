import { config } from './config';
import { buildServer } from './server';

async function start() {
  const server = await buildServer();

  try {
    await server.listen({
      port: config.port,
      host: config.host,
    });

    console.log(`🚀 API Gateway running on http://${config.host}:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Handle graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const;
signals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    process.exit(0);
  });
});

start();
