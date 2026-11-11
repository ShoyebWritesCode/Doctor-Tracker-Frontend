import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_PATH: z
    .string()
    .regex(/^\/[A-Za-z0-9/_-]*$/, "API base path must be a relative URL path.")
    .default("/api/v1"),
});

export type PublicEnv = Readonly<z.infer<typeof publicEnvSchema>>;

export function parsePublicEnv(input: Record<string, string | undefined>): PublicEnv {
  return Object.freeze(publicEnvSchema.parse(input));
}

export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_API_BASE_PATH: process.env.NEXT_PUBLIC_API_BASE_PATH,
});
