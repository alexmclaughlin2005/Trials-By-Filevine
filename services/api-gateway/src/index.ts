import { config } from './config';
import { buildServer } from './server';
import { startDocumentDownloader, stopDocumentDownloader } from './workers/document-downloader.js';

let downloaderInterval: NodeJS.Timeout | null = null;

async function start() {
  const server = await buildServer();

  try {
    await server.listen({
      port: config.port,
      host: config.host,
    });

    const baseUrl = `http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`;

    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🚀 Trials by Filevine API Gateway                            ║
║                                                                ║
║  Status: Running                                               ║
║  Environment: ${config.nodeEnv.padEnd(48)} ║
║  Port: ${config.port.toString().padEnd(53)} ║
║                                                                ║
║  📚 API Documentation:                                         ║
║     Swagger UI: ${(baseUrl + '/docs').padEnd(43)} ║
║     OpenAPI YAML: ${(baseUrl + '/openapi.yaml').padEnd(39)} ║
║     OpenAPI JSON: ${(baseUrl + '/openapi.json').padEnd(39)} ║
║                                                                ║
║  🔗 Endpoints:                                                 ║
║     Root: ${baseUrl.padEnd(49)} ║
║     Health: ${(baseUrl + '/health').padEnd(45)} ║
║     Auth: ${(baseUrl + '/api/auth').padEnd(47)} ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);

    // Start document download worker
    downloaderInterval = startDocumentDownloader();
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

    // Stop document downloader
    if (downloaderInterval) {
      stopDocumentDownloader(downloaderInterval);
    }

    process.exit(0);
  });
});

start();
