import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../../lib/prisma';
import { generateToken } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
    const { email, password } = await request.json();

    const models = [
        { name: 'CITIZEN', model: prisma.citizen },
        { name: 'PATROL_OFFICER', model: prisma.patrolOfficer },
        { name: 'DETECTIVE', model: prisma.detective },
        { name: 'SUPERVISOR', model: prisma.supervisor },
        { name: 'PROSECUTOR', model: prisma.prosecutor },
        { name: 'JUDICIAL_ADMIN', model: prisma.judicialAdmin },
        { name: 'FORENSIC_OFFICER', model: prisma.forensicOfficer },
        { name: 'SYSTEM_ADMIN', model: prisma.systemAdmin },
    ];

    try {
        let foundUser: any = null;
        let foundRole: string | null = null;

        for (const m of models) {
            const user = await (m.model as any).findUnique({ where: { email } });
            if (user) {
                foundUser = user;
                foundRole = m.name;
                break;
            }
        }

        if (foundUser && (await bcrypt.compare(password, foundUser.passwordHash))) {
            return NextResponse.json({
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                role: foundRole,
                biometric_registered: foundUser.biometric_registered,
                token: generateToken(foundUser.id, foundRole!),
            });
        } else {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
