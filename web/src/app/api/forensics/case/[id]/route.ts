import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const { id } = await params;

    try {
        const caseRecord = await prisma.case.findUnique({ where: { id } });
        if (!caseRecord) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

        // Detectives can only see forensic reports for cases assigned to them
        if (user.role === 'DETECTIVE' && caseRecord.detectiveId !== user.id) {
            return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
        }

        const reports = await prisma.forensicReport.findMany({
            where: { caseId: id },
            include: { officer: { select: { name: true } } },
        });
        return NextResponse.json(reports);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
