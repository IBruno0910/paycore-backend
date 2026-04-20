import "./modules/webhooks/webhooks.worker.js";
import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./shared/logger/logger.js";

app.listen(env.port, () => {
  logger.info(
    { port: env.port },
    `Server running on http://localhost:${env.port}`
  );
});