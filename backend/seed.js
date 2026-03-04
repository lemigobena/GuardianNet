import dotenv from 'dotenv';
dotenv.config();

import prisma from './utils/prisma.js';
import bcrypt from 'bcrypt';

const main = async () => {
    const passwordHash = await bcrypt.hash('password123', 10);

    const seedUsers = async (modelName, count, prefix) => {
        const users = [];
        for (let i = 1; i <= count; i++) {
            const email = count === 1 ? `${prefix}@test.com` : `${prefix}${i}@test.com`;
            users.push({
                name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${count === 1 ? '' : i}`,
                email,
                passwordHash,
                biometric_registered: true
            });
        }
        await prisma[modelName].createMany({
            data: users,
            skipDuplicates: true,
        });
        console.log(`Created ${count} ${modelName} accounts.`);
    };

    try {
        console.log("Starting DB Seed...");

        await seedUsers('systemAdmin', 1, 'admin');
        await seedUsers('forensicOfficer', 10, 'forensic');
        await seedUsers('judicialAdmin', 10, 'judicial');
        await seedUsers('prosecutor', 10, 'prosecutor');
        await seedUsers('supervisor', 10, 'supervisor');
        await seedUsers('detective', 10, 'detective');
        await seedUsers('patrolOfficer', 10, 'patrol');
        await seedUsers('citizen', 10, 'citizen');

        console.log("DB Seed Completed Successfully.");
    } catch (error) {
        console.error("Error seeding typical database info:", error);
    } finally {
        await prisma.$disconnect();
    }
};

main();
