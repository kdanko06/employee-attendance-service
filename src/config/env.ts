import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATA_FILE_PATH: z.string().min(1).default('./data/store.json'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters')
    .default('change-me-in-prod-please'),
  TZ: z.string().default('Australia/Sydney')
});

export const env = envSchema.parse({
  DATA_FILE_PATH: process.env.DATA_FILE_PATH,
  JWT_SECRET: process.env.JWT_SECRET,
  TZ: process.env.TZ ?? 'Australia/Sydney'
});
