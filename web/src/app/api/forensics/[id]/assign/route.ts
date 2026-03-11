import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  if (!['SUPERVISOR', 'SYSTEM_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Only Supervisors can assign forensic officers' }, { status: 403 });
  }

  const { id } = await params;
  const { officerId } = await request.json();

  try {
    const officer = await prisma.forensicOfficer.findUnique({ where: { id: officerId } });
    if (!officer) {
      return NextResponse.json({ error: 'Forensic officer not found' }, { status: 400 });
    }

    const report = await prisma.forensicReport.update({
      where: { id },
      data: {
        officerId,
        status: 'PENDING',
      },
    });

    // When a forensic officer is assigned, link all case evidence to that officer
    await prisma.evidence.updateMany({
      where: { caseId: report.caseId },
      data: { forensicOfficerId: officerId },
    });

    await prisma.auditLog.create({
      data: {
        action: 'FORENSIC_ASSIGNMENT',
        userId: user.id,
        userRole: user.role,
        details: `Supervisor assigned forensic report ${id} to officer ${officerId} and routed case evidence`,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign forensic officer' }, { status: 500 });
  }
}

