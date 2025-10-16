import express, { json, urlencoded } from "express";
import cors from "cors";
import helmet from "helmet";

import { createETagGenerator } from "./utils/etag";
import { COMPATIBILITY_CHECK_HEADER } from "@dracktype/contracts";
import { compabilityCheckMiddleware } from "./middleware/compabilityCheck";

const etag = createETagGenerator({ weak: true });

function buildApp(): express.Application {
  const app = express();

  app.use(urlencoded({ extended: true }));
  app.use(json());
  app.use(cors({ exposedHeaders: [COMPATIBILITY_CHECK_HEADER] }));
  app.use(helmet());

  app.set("trust proxy", 1);

  app.use(compabilityCheckMiddleware);

  return app;
}

export default buildApp();
