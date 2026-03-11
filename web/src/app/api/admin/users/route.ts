import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

const ROLE_MODELS = [
    { name: 'CITIZEN', model: prisma.citizen },
    { name: 'PATROL_OFFICER', model: prisma.patrolOfficer },
    { name: 'DETECTIVE', model: prisma.detective },
    { name: 'SUPERVISOR', model: prisma.supervisor },
    { name: 'PROSECUTOR', model: prisma.prosecutor },
    { name: 'JUDICIAL_ADMIN', model: prisma.judicialAdmin },
    { name: 'FORENSIC_OFFICER', model: prisma.forensicOfficer },
    { name: 'SYSTEM_ADMIN', model: prisma.systemAdmin },
    { name: 'REGISTRAR', model: prisma.registrar },
];

export async function GET(request: NextRequest) {
    const user = verifyToken(request);
    if (!user || user.role !== 'SYSTEM_ADMIN') return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    try {
        let allUsers: any[] = [];
        for (const m of ROLE_MODELS) {
            const users = await (m.model as any).findMany();
            allUsers = allUsers.concat(users.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: m.name,
                status: u.status, // ACTIVE, SUSPENDED, PENDING
                verified: u.status !== 'PENDING'
            })));
        }
        return NextResponse.json(allUsers);
    } catch (e: any) {
        return NextResponse.json({ error: 'Failed to fetch users', details: e.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const user = verifyToken(request);
    if (!user || user.role !== 'SYSTEM_ADMIN') return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    try {
        const { id, role, status } = await request.json();

        const m = ROLE_MODELS.find(r => r.name === role);
        if (!m) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

        const updatedUser = await (m.model as any).update({
            where: { id },
            data: { status }
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userRole: user.role,
                userId: user.id,
                action: `Updated user ${updatedUser.name} (${role}) status to ${status}`,
                details: `System Admin modified user status.`
            }
        });

        return NextResponse.json(updatedUser);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Failed to update user' }, { status: 500 });
    }
}
