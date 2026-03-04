import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    if (user.role !== 'FORENSIC_OFFICER') {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { caseId, findings } = await request.json();

    try {
        const report = await prisma.forensicReport.create({
            data: { findings, caseId, officerId: user.id },
        });

        await prisma.auditLog.create({
            data: {
                action: 'FORENSIC_REPORT_CREATED',
                userId: user.id,
                userRole: user.role,
                details: `Forensic report for case ${caseId}`,
            },
        });

        return NextResponse.json(report, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Report creation failed' }, { status: 500 });
    }
}
