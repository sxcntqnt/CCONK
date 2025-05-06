import { PrismaClient } from '../../../src/lib/prisma/index.ts/client.mjs';
let prisma;
if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
}
else {
    if (!global.cachedPrisma) {
        global.cachedPrisma = new PrismaClient();
    }
    prisma = global.cachedPrisma;
}
export const db = prisma;
