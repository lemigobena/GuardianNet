import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    if (!['PROSECUTOR', 'JUDICIAL_ADMIN'].includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { caseId, charge, verdict, sentence } = await request.json();

    try {
        const record = await prisma.courtRecord.create({
            data: {
                charge,
                verdict: verdict || 'PENDING',
                sentence,
                caseId,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: 'COURT_RECORD_CREATED',
                userId: user.id,
                userRole: user.role,
                details: `Court record for case ${caseId} created`,
            },
        });

        return NextResponse.json(record, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Record creation failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    try {
        const records = await prisma.courtRecord.findMany({
            include: { case: true },
        });
        return NextResponse.json(records);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch court records' }, { status: 500 });
    }
}
