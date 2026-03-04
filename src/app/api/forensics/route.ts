import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const allowed = ['FORENSIC_OFFICER', 'DETECTIVE'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { caseId, findings, type } = await request.json();

    try {
        // When a detective creates a report, it's a "request" with PENDING status
        // When a forensic officer creates one, it can be marked COMPLETED
        const isRequest = user.role === 'DETECTIVE';

        // For detective requests, we need to find an available forensic officer to assign
        let officerId = user.id;
        if (isRequest) {
            const officer = await prisma.forensicOfficer.findFirst();
            if (!officer) return NextResponse.json({ error: 'No forensic officers available' }, { status: 400 });
            officerId = officer.id;
        }

        const report = await prisma.forensicReport.create({
            data: {
                findings,
                caseId,
                officerId,
                status: isRequest ? 'PENDING' : 'COMPLETED',
                type: type || 'GENERAL_ANALYSIS',
            },
        });

        await prisma.auditLog.create({
            data: {
                action: isRequest ? 'FORENSIC_REQUEST_CREATED' : 'FORENSIC_REPORT_CREATED',
                userId: user.id,
                userRole: user.role,
                details: `Forensic ${isRequest ? 'request' : 'report'} for case ${caseId}`,
            },
        });

        return NextResponse.json(report, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: 'Report creation failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    try {
        const reports = await prisma.forensicReport.findMany({
            include: { case: { include: { incident: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(reports);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
