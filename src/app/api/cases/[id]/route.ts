import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken, verifyBiometricToken } from '../../../../lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const allowed = ['DETECTIVE', 'PROSECUTOR'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { id } = await params;
    const { locked, classification } = await request.json();

    try {
        const data: any = {};
        if (locked !== undefined) data.locked = locked;
        if (classification !== undefined) data.classification = classification;

        const updated = await prisma.case.update({
            where: { id },
            data,
        });

        await prisma.auditLog.create({
            data: {
                action: `CASE_UPDATED`,
                userId: user.id,
                userRole: user.role,
                details: `Updated case ${id} (Locked: ${locked})`,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
    }
}
