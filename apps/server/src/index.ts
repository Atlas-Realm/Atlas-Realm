import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();
console.log(`[Atlas Realm] Server: http://${env.HOST}:${env.PORT}`);
console.log(`[Atlas Realm] Docs:   http://${env.HOST}:${env.PORT}/api/docs`);

export default { port: env.PORT, hostname: env.HOST, fetch: app.fetch };
