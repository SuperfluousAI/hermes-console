import { z } from 'zod';

export type HermesLogLevel = 'error' | 'warning' | 'info' | 'debug' | 'other';

export type HermesLogFileSummary = {
  id: string;
  name: string;
  path: string;
  fileSize: number;
  lastModifiedMs: number;
  analyzedLineCount: number;
  errorLineCount: number;
  warningLineCount: number;
  infoLineCount: number;
  debugLineCount: number;
};

export type HermesLogLine = {
  id: string;
  lineNumber: number;
  timestamp: string | null;
  level: HermesLogLevel;
  text: string;
};

export type HermesLogsIndex = {
  logs: HermesLogFileSummary[];
};

export type HermesLogDetail = {
  file: HermesLogFileSummary;
  requestedLines: number;
  returnedLines: number;
  lines: HermesLogLine[];
};

export const hermesLogLevelSchema = z.enum(['error', 'warning', 'info', 'debug', 'other']);

export const hermesLogFileSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.string(),
  fileSize: z.number(),
  lastModifiedMs: z.number(),
  analyzedLineCount: z.number(),
  errorLineCount: z.number(),
  warningLineCount: z.number(),
  infoLineCount: z.number(),
  debugLineCount: z.number()
});

export const hermesLogLineSchema = z.object({
  id: z.string(),
  lineNumber: z.number(),
  timestamp: z.string().nullable(),
  level: hermesLogLevelSchema,
  text: z.string()
});

export const hermesLogsIndexSchema = z.object({
  logs: z.array(hermesLogFileSummarySchema)
});

export const hermesLogDetailSchema = z.object({
  file: hermesLogFileSummarySchema,
  requestedLines: z.number(),
  returnedLines: z.number(),
  lines: z.array(hermesLogLineSchema)
});
