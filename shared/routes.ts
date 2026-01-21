import { z } from 'zod';
import { insertUserSchema, insertCompanySchema, insertQuoteSchema, insertBidSchema, insertAddressSchema, users, companies, quotes, bids, addresses, type User, type InsertUser, type InsertQuote, type InsertBid } from './schema';

// Export types for hooks
export type { User, InsertUser, InsertQuote, InsertBid };

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
        200: z.custom<User>(),
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
        201: z.custom<User>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  companies: {
    list: {
      method: 'GET' as const,
      path: '/api/companies',
      input: z.object({ type: z.enum(["client", "carrier"]).optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof companies.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/companies',
      input: insertCompanySchema,
      responses: {
        201: z.custom<typeof companies.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/companies/:id',
      input: insertCompanySchema.partial(),
      responses: {
        200: z.custom<typeof companies.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/companies/:id',
      responses: {
        200: z.custom<typeof companies.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  addresses: {
    list: {
      method: 'GET' as const,
      path: '/api/companies/:companyId/addresses',
      responses: {
        200: z.array(z.custom<typeof addresses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/addresses',
      input: insertAddressSchema,
      responses: {
        201: z.custom<typeof addresses.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/addresses/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  quotes: {
    list: {
      method: 'GET' as const,
      path: '/api/quotes',
      responses: {
        200: z.array(z.custom<typeof quotes.$inferSelect & { client: User, bids: typeof bids.$inferSelect[] }>()),
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
        200: z.custom<typeof quotes.$inferSelect & { client: User, bids: (typeof bids.$inferSelect & { carrier: User })[] }>(),
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
