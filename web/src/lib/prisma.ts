import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
    globalForPrisma.prisma ??
    (() => {
        const url = process.env.DATABASE_URL;
        const pool = new Pool({ 
            connectionString: url,
            max: 2,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 20000,
            allowExitOnIdle: true
        });
        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter });
    })();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
