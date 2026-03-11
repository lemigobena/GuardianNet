import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken, verifyTokenString, verifyBiometricToken } from '../../../../lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    let user = verifyToken(request);

    // Fallback: if header is missing (some browsers/clients), accept token from query string
    if (!user) {
        const tokenParam = request.nextUrl.searchParams.get('token');
        if (tokenParam) {
            user = verifyTokenString(tokenParam);
        }
    }

    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const allowed = ['PATROL_OFFICER', 'SUPERVISOR', 'DETECTIVE', 'SYSTEM_ADMIN'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json(
            {
                error: 'Role not authorized',
                details: `Your role: ${user.role}`,
            },
            { status: 403 }
        );
    }

    const { id } = await params;
    const { status, descriptionUpdate } = await request.json();

    try {
        const existing = await prisma.incident.findUnique({ where: { id } });
        if (!existing) return NextResponse.json({ error: 'Incident not found' }, { status: 404 });

        const newDescription = descriptionUpdate
            ? `${existing.description}\n\n[UPDATE by ${user.role} ${user.id.substring(0, 8)}]: ${descriptionUpdate}`
            : existing.description;

        const updated = await prisma.incident.update({
            where: { id },
            data: { status, description: newDescription },
        });

        await prisma.auditLog.create({
            data: {
                action: `INCIDENT_UPDATED`,
                userId: user.id,
                userRole: user.role,
                details: `Updated incident ${id} status to ${status}`,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
    }
}
