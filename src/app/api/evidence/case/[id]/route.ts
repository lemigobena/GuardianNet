import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    const allowed = ['DETECTIVE', 'PROSECUTOR', 'JUDICIAL_ADMIN', 'SUPERVISOR'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { id } = await params;

    try {
        const evidence = await prisma.evidence.findMany({
            where: { caseId: id },
            include: {
                detective: { select: { name: true } },
                forensicOfficer: { select: { name: true } },
            },
        });
        return NextResponse.json(evidence);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });
    }
}
