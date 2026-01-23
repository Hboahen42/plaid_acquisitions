import { z } from 'zod';

export const createLinkTokenSchema = z.object({
  body: z.object({
    itemId: z.number().int().positive().optional(),
  }),
});

export const exchangeTokenSchema = z.object({
  body: z.object({
    publicToken: z.string().min(1, 'Public token is required'),
  }),
});

export const getTransactionsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform(val => (val ? parseInt(val) : 100)),
    offset: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform(val => (val ? parseInt(val) : 0)),
  }),
});
