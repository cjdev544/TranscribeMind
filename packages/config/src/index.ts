import { z, type ZodSchema } from "zod";

/**
 * Validates process.env against a service-specific zod schema once at
 * bootstrap. Fails fast with a readable error instead of letting a missing
 * var surface as a cryptic runtime exception deep in some adapter.
 */
export function defineEnv<TSchema extends ZodSchema>(
  schema: TSchema,
  source: NodeJS.ProcessEnv = process.env,
): z.infer<TSchema> {
  const result = schema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return result.data;
}

export { z };
