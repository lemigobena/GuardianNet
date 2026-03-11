import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const allowed = ['PROSECUTOR', 'SYSTEM_ADMIN'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await request.json();
        
        const updatedCase = await prisma.case.update({
            where: { id },
            data: {
                status: 'DECLINED_PROSECUTION',
            }
        });

        // Add to audit log
        await prisma.auditLog.create({
            data: {
                userRole: user.role,
                userId: user.id,
                action: 'PROSECUTION_DECLINED',
                details: `Prosecution declined. Reason: ${body.reason}`,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'Unknown',
            }
        });

        return NextResponse.json(updatedCase);
    } catch (error) {
        console.error('Error declining prosecution:', error);
        return NextResponse.json({ error: 'Failed to decline prosecution' }, { status: 500 });
    }
}
