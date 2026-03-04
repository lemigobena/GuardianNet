import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken, verifyBiometricToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    if (user.role !== 'DETECTIVE') {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }
    if (!verifyBiometricToken(request, user.id)) {
        return NextResponse.json({ error: 'Biometric confirmation required' }, { status: 403 });
    }

    const { incidentId, classification } = await request.json();

    try {
        const caseObj = await prisma.case.create({
            data: { incidentId, detectiveId: user.id, classification },
        });

        await prisma.incident.update({
            where: { id: incidentId },
            data: { status: 'UNDER_INVESTIGATION' },
        });

        await prisma.auditLog.create({
            data: {
                userId: user.id,
                userRole: user.role,
                action: `Created Case ${caseObj.id} from Incident ${incidentId}`,
                biometricVerified: true,
            },
        });

        return NextResponse.json(caseObj, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    const allowed = ['DETECTIVE', 'SUPERVISOR', 'PROSECUTOR', 'JUDICIAL_ADMIN', 'SYSTEM_ADMIN'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    try {
        const cases = await prisma.case.findMany({ include: { incident: true }, orderBy: { createdAt: 'desc' } });
        return NextResponse.json(cases);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
