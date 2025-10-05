import { ZodError } from "zod";

export function isZodError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  if (error instanceof ZodError) return true;
  if (error.constructor.name === "ZodError") return true;
  if ("issues" in error && Array.isArray(error.issues)) return true;

  return false;
}
