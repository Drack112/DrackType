import express, { urlencoded, json } from "express";
import cors from "cors";
import helmet from "helmet";

function buildApp(): express.Application {
  const app = express();

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(helmet());

  app.set("trust proxy", 1);

  return app;
}

export default buildApp();
