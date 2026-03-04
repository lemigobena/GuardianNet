import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken, verifyBiometricToken } from '../../../../lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    if (user.role !== 'JUDICIAL_ADMIN') {
        return NextResponse.json({ error: 'Only Judicial Admin can update court records' }, { status: 403 });
    }

    // Require biometric validation for sealing a verdict
    if (!verifyBiometricToken(request, user.id)) {
        return NextResponse.json({ error: 'Biometric confirmation required to seal verdict' }, { status: 403 });
    }

    const { id } = await params;
    const { verdict, sentence } = await request.json();

    try {
        const updated = await prisma.courtRecord.update({
            where: { id },
            data: { verdict, sentence },
        });

        await prisma.auditLog.create({
            data: {
                action: `VERDICT_SEALED`,
                userId: user.id,
                userRole: user.role,
                details: `Sealed verdict ${verdict} for court record ${id}`,
                biometricVerified: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update court record' }, { status: 500 });
    }
}
