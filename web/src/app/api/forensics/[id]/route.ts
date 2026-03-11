import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken, verifyBiometricToken } from '../../../../lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    if (user.role !== 'FORENSIC_OFFICER') {
        return NextResponse.json({ error: 'Only Forensic Officer can update lab reports' }, { status: 403 });
    }

    const { id } = await params;
    const { status, findings } = await request.json();

    try {
        const updated = await prisma.forensicReport.update({
            where: { id },
            data: { status, findings },
        });

        await prisma.auditLog.create({
            data: {
                action: `FORENSIC_REPORT_UPDATED`,
                userId: user.id,
                userRole: user.role,
                details: `Updated forensic report ${id} status to ${status}`,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update forensic report' }, { status: 500 });
    }
}
