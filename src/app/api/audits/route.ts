import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function GET(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(logs);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
}
