import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const { id } = await params;

    try {
        const suspects = await prisma.suspect.findMany({
            where: { caseId: id },
        });
        return NextResponse.json(suspects);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch suspects' }, { status: 500 });
    }
}
