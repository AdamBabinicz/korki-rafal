import { z } from 'zod';
import { insertUserSchema, insertSlotSchema, insertWaitlistSchema, generateSlotsSchema, slots, waitlist, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    user: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.void(),
      },
    },
  },
  slots: {
    list: {
      method: 'GET' as const,
      path: '/api/slots',
      input: z.object({
        start: z.string().optional(),
        end: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof slots.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/slots',
      input: insertSlotSchema,
      responses: {
        201: z.custom<typeof slots.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    generate: {
      method: 'POST' as const,
      path: '/api/slots/generate',
      input: generateSlotsSchema,
      responses: {
        201: z.object({ count: z.number() }),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/slots/:id',
      input: insertSlotSchema.partial(),
      responses: {
        200: z.custom<typeof slots.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/slots/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  waitlist: {
    join: {
      method: 'POST' as const,
      path: '/api/waitlist',
      input: insertWaitlistSchema,
      responses: {
        201: z.custom<typeof waitlist.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  openai: {
    generateImage: {
      method: 'POST' as const,
      path: '/api/openai/generate-image',
      input: z.object({ prompt: z.string() }),
      responses: {
        200: z.object({ url: z.string() }),
        500: errorSchemas.internal,
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
