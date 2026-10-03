import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(1),
    abstract: z.string().min(1),
    date: z.coerce.date(),
    banner: z.string().startsWith('/'),
    featured: z.boolean().default(false),
  }),
});

export const collections = { articles };
