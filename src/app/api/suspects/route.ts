import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    if (!['DETECTIVE', 'PROSECUTOR'].includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { caseId, name, biometricReference } = await request.json();

    try {
        const suspect = await prisma.suspect.create({
            data: { caseId, name, biometricReference },
        });

        await prisma.auditLog.create({
            data: {
                action: 'SUSPECT_ADDED',
                userId: user.id,
                userRole: user.role,
                details: `Suspect ${name} added to case ${caseId}`,
            },
        });

        return NextResponse.json(suspect, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to add suspect' }, { status: 500 });
    }
}
