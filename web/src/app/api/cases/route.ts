import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken, verifyBiometricToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    if (!['DETECTIVE', 'PATROL_OFFICER'].includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }
    // Fingerprint hardware requirement removed per specs

    const { incidentId, classification } = await request.json();

    try {
        const caseData: any = {
            incidentId,
            classification: classification || (user.role === 'PATROL_OFFICER' ? 'FIELD_ESCALATION' : undefined),
        };

        if (user.role === 'DETECTIVE') {
            caseData.detectiveId = user.id;
        } else if (user.role === 'PATROL_OFFICER') {
            caseData.status = 'PENDING_ASSIGNMENT';
        }

        const caseObj = await prisma.case.create({ data: caseData });

        // Only move the Incident into UNDER_INVESTIGATION when this is a true escalation
        // (Detective-created case, or non-FIELD_EVIDENCE classification).
        const isLightweightFieldCase =
            user.role === 'PATROL_OFFICER' && (caseData.classification === 'FIELD_EVIDENCE');

        if (!isLightweightFieldCase) {
            await prisma.incident.update({
                where: { id: incidentId },
                data: { status: 'UNDER_INVESTIGATION' },
            });
        }

        await prisma.auditLog.create({
            data: {
                userId: user.id,
                userRole: user.role,
                action: `Created Case ${caseObj.id} from Incident ${incidentId}`,
                biometricVerified: user.role === 'DETECTIVE',
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
    const allowed = ['DETECTIVE', 'SUPERVISOR', 'PROSECUTOR', 'JUDICIAL_ADMIN', 'SYSTEM_ADMIN', 'PATROL_OFFICER', 'FORENSIC_OFFICER'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    try {
        let where: any = {};
        if (user.role === 'DETECTIVE') {
            // Detectives only see cases that are explicitly assigned to them
            where = { detectiveId: user.id };
        } else if (user.role === 'FORENSIC_OFFICER') {
            // Forensic officers only see cases where they have an assigned report
            where = { reports: { some: { officerId: user.id } } };
        }

        const cases = await prisma.case.findMany({
            where,
            include: { incident: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(cases);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
