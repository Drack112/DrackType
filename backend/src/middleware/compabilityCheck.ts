import { COMPATIBILITY_CHECK_HEADER } from "@dracktype/contracts";
import { NextFunction, Request, Response } from "express";

/**
 * Add the COMPATIBILITY_CHECK_HEADER to each response
 * @param _req
 * @param res
 * @param next
 */
export async function compabilityCheckMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  res.setHeader(COMPATIBILITY_CHECK_HEADER, COMPATIBILITY_CHECK_HEADER);
  next();
}
