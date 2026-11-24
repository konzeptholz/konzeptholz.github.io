import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(), description: z.string(),
    kind: z.enum(['home', 'page', 'error']), order: z.number().optional(),
    image: z.string().optional(), imageAlt: z.string().optional(),
    team: z.array(z.object({ name: z.string(), image: z.string(), role: z.string() })).optional(),
  }),
});
const shared = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/shared' }),
  schema: z.object({
    title: z.string(), logo: z.string(), background: z.string(), backgroundImageSet: z.string().optional(),
    homeLabel: z.string(), navLabel: z.string(), skipLabel: z.string(),
    backLabel: z.string(), legalLabel: z.string(), closeLabel: z.string(),
    contact: z.object({
      title: z.string(), hint: z.string(), confirm: z.string(), checking: z.string(),
      error: z.string(), close: z.string(), noscript: z.string(),
    }),
  }),
});
const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({ title: z.string(), order: z.number() }),
});
export const collections = { pages, shared, legal };
