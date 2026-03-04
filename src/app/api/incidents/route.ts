import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    if (!['CITIZEN', 'PATROL_OFFICER'].includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { description, location } = await request.json();

    try {
        const incident = await prisma.incident.create({
            data: { citizenId: user.id, description, location },
        });

        await prisma.auditLog.create({
            data: { userId: user.id, userRole: user.role, action: `Created Incident ${incident.id}` },
        });

        return NextResponse.json(incident, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    try {
        let incidents;
        if (user.role === 'CITIZEN') {
            incidents = await prisma.incident.findMany({ where: { citizenId: user.id }, orderBy: { createdAt: 'desc' } });
        } else {
            incidents = await prisma.incident.findMany({ orderBy: { createdAt: 'desc' } });
        }
        return NextResponse.json(incidents);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
