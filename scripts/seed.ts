import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const main = async () => {
    const passwordHash = await bcrypt.hash('password123', 10);

    const seedUsers = async (modelName: string, count: number, prefix: string) => {
        const users = [];
        for (let i = 1; i <= count; i++) {
            const email = count === 1 ? `${prefix}@test.com` : `${prefix}${i}@test.com`;
            users.push({
                name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${count === 1 ? '' : i}`.trim(),
                email,
                passwordHash,
                biometric_registered: true,
            });
        }
        await (prisma as any)[modelName].createMany({
            data: users,
            skipDuplicates: true,
        });
        console.log(`Created ${count} ${modelName} accounts.`);
    };

    try {
        console.log('Starting DB Seed...');

        await seedUsers('systemAdmin', 1, 'admin');
        await seedUsers('forensicOfficer', 10, 'forensic');
        await seedUsers('judicialAdmin', 10, 'judicial');
        await seedUsers('prosecutor', 10, 'prosecutor');
        await seedUsers('supervisor', 10, 'supervisor');
        await seedUsers('detective', 10, 'detective');
        await seedUsers('patrolOfficer', 10, 'patrol');
        await seedUsers('citizen', 10, 'citizen');

        console.log('DB Seed Completed Successfully.');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await prisma.$disconnect();
        pool.end();
    }
};

main();
