import { z } from 'zod';

export type HermesConfigSource = 'config.yaml' | '.env';

export type HermesConfigEntry = {
  key: string;
  value: string;
  source: HermesConfigSource;
  masked: boolean;
  section: string | null;
};

export type HermesConfigIndex = {
  entries: HermesConfigEntry[];
  rawConfig: string | null;
  rawEnv: string | null;
  configPath: string;
  envPath: string;
};

export const hermesConfigSourceSchema = z.enum(['config.yaml', '.env']);

export const hermesConfigEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
  source: hermesConfigSourceSchema,
  masked: z.boolean(),
  section: z.string().nullable()
});

export const hermesConfigIndexSchema = z.object({
  entries: z.array(hermesConfigEntrySchema),
  rawConfig: z.string().nullable(),
  rawEnv: z.string().nullable(),
  configPath: z.string(),
  envPath: z.string()
});
