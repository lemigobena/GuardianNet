import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../../lib/prisma';
import { generateToken } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, id, password } = await request.json();

        if (!password || (!email && !id)) {
            return NextResponse.json(
                { error: 'Missing credentials' },
                { status: 400 },
            );
        }

        const models = [
            { name: 'CITIZEN', model: prisma.citizen },
            { name: 'PATROL_OFFICER', model: prisma.patrolOfficer },
            { name: 'DETECTIVE', model: prisma.detective },
            { name: 'SUPERVISOR', model: prisma.supervisor },
            { name: 'PROSECUTOR', model: prisma.prosecutor },
            { name: 'JUDICIAL_ADMIN', model: prisma.judicialAdmin },
            { name: 'FORENSIC_OFFICER', model: prisma.forensicOfficer },
            { name: 'REGISTRAR', model: prisma.registrar },
            { name: 'SYSTEM_ADMIN', model: prisma.systemAdmin },
        ] as const;

        let foundUser: any = null;
        let foundRole: string | null = null;

        for (const m of models) {
            try {
                const user = await (m.model as any).findUnique({ where: email ? { email } : { id } });
                if (user) {
                    foundUser = user;
                    foundRole = m.name;
                    break;
                }
            } catch (err) {
                // If a connection issue happens, log it and keep trying
                console.error(`Error querying ${m.name}:`, err);
            }
        }

        if (!foundUser || !foundRole) {
            return NextResponse.json(
                { error: email ? 'Invalid email or password' : 'Invalid ID or password' },
                { status: 401 },
            );
        }

        const passwordOk = await bcrypt.compare(password, foundUser.passwordHash);
        if (!passwordOk) {
            return NextResponse.json(
                { error: email ? 'Invalid email or password' : 'Invalid ID or password' },
                { status: 401 },
            );
        }

        return NextResponse.json({
            id: foundUser.id,
            name: foundUser.name,
            email: foundUser.email,
            role: foundRole,
            biometric_registered: foundUser.biometric_registered,
            token: generateToken(foundUser.id, foundRole),
        });
    } catch (e: any) {
        console.error('Login error', e);
        return NextResponse.json(
            { error: 'Server error', details: e?.message || 'Unknown error' },
            { status: 500 },
        );
    }
}
