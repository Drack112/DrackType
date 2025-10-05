import "dotenv/config";
import { Server } from "http";
import Logger from "./utils/logger";
import { version } from "./version";
import app from "./app";

async function bootServer(port: number): Promise<Server> {
  try {
    Logger.info(`Starting server version ${version}`);
    Logger.info(`Starting server in ${process.env["MODE"]} mode`);
    Logger.info(`Connecting to database ${process.env["DB_NAME"]}...`);
  } catch (error) {
    Logger.error("Failed to boot server");
    console.error(error);
    return process.exit(1);
  }

  return app.listen(PORT, () => {
    Logger.success(`Server is running on port ${port}`);
  });
}

const PORT = parseInt(process.env["PORT"] ?? "5005", 10);

void bootServer(PORT);
