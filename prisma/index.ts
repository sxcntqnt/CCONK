import { neon } from '@neondatabase/serverless';
import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be a Neon Postgres connection string');
}

// Initialize Neon connection (for potential raw queries)
const sql = neon(process.env.DATABASE_URL);

// Initialize Prisma Client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export { prisma };
