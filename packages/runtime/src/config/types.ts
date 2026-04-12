import { z } from 'zod';

export type HermesConfigEntry = {
  key: string;
  value: string;
  section: string | null;
};

export type HermesConfigIndex = {
  entries: HermesConfigEntry[];
  rawConfig: string | null;
  configPath: string;
};

export const hermesConfigEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
  section: z.string().nullable()
});

export const hermesConfigIndexSchema = z.object({
  entries: z.array(hermesConfigEntrySchema),
  rawConfig: z.string().nullable(),
  configPath: z.string()
});
