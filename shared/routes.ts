import { z } from 'zod';
import { insertUserSchema, insertCompanySchema, insertQuoteSchema, insertBidSchema, users, companies, quotes, bids, auditLogs } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  quotes: {
    list: {
      method: 'GET' as const,
      path: '/api/quotes',
      responses: {
        200: z.array(z.custom<typeof quotes.$inferSelect & { client: typeof users.$inferSelect, bids: typeof bids.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/quotes',
      input: insertQuoteSchema,
      responses: {
        201: z.custom<typeof quotes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/quotes/:id',
      responses: {
        200: z.custom<typeof quotes.$inferSelect & { client: typeof users.$inferSelect, bids: (typeof bids.$inferSelect & { carrier: typeof users.$inferSelect })[] }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  bids: {
    create: {
      method: 'POST' as const,
      path: '/api/quotes/:quoteId/bids',
      input: insertBidSchema,
      responses: {
        201: z.custom<typeof bids.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    accept: {
      method: 'POST' as const,
      path: '/api/bids/:id/accept',
      responses: {
        200: z.custom<typeof bids.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
