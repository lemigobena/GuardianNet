import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET() {
    try {
        const counts = {
            citizen: await prisma.citizen.count(),
            patrolOfficer: await prisma.patrolOfficer.count(),
            detective: await prisma.detective.count(),
            supervisor: await prisma.supervisor.count(),
            prosecutor: await prisma.prosecutor.count(),
            judicialAdmin: await prisma.judicialAdmin.count(),
            forensicOfficer: await prisma.forensicOfficer.count(),
            registrar: await prisma.registrar.count(),
            systemAdmin: await prisma.systemAdmin.count(),
        };

        const firstAdmin = await prisma.systemAdmin.findFirst();
        const firstRegistrar = await prisma.registrar.findFirst();

        return NextResponse.json({
            status: 'connected',
            counts,
            firstAdminEmail: firstAdmin?.email || 'none',
            firstRegistrarEmail: firstRegistrar?.email || 'none',
        });
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
        }, { status: 500 });
    }
}
