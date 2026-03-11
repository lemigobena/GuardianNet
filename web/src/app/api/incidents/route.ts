import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const tokenUser = verifyToken(request);
    if (!tokenUser) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    // For reporting, trust the ID prefix: CT-********** are citizens.
    const idPrefix = tokenUser.id.split('-')[0];
    const effectiveRole = idPrefix === 'CT' ? 'CITIZEN' : tokenUser.role;

    if (effectiveRole !== 'CITIZEN') {
        return NextResponse.json(
            { error: 'Role not authorized', details: `Your role (by ID prefix): ${effectiveRole}` },
            { status: 403 }
        );
    }

    const { description, location } = await request.json();

    try {
        const incident = await prisma.incident.create({
            data: { citizenId: tokenUser.id, description, location },
        });

        await prisma.auditLog.create({
            data: { userId: tokenUser.id, userRole: effectiveRole, action: `Created Incident ${incident.id}` },
        });

        return NextResponse.json(incident, { status: 201 });
    } catch (error: any) {
        console.error('Failed to create incident', error);
        return NextResponse.json(
            { error: 'Server error', details: error?.message || 'Unknown error' },
            { status: 500 }
        );
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
