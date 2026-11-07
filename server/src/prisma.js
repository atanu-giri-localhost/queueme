import 'dotenv/config';
import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL and DIRECT_URL are resolved regardless of invocation cwd
if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
  dotenv.config({ path: path.resolve(import.meta.dirname, '../.env') });
  dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
