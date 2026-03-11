import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { verifyToken } from '../../../../../lib/auth';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authUser = verifyToken(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (authUser.role !== 'SUPERVISOR' && authUser.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { detectiveId?: string };
  const detectiveId = (body.detectiveId || '').trim();
  if (!detectiveId) return NextResponse.json({ error: 'detectiveId is required' }, { status: 400 });

  const det = await prisma.detective.findUnique({ where: { id: detectiveId } });
  if (!det) return NextResponse.json({ error: 'Detective not found' }, { status: 404 });

  const c = await prisma.case.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  const updated = await prisma.case.update({ where: { id }, data: { detectiveId } });

  await prisma.auditLog.create({
    data: {
      action: 'CASE_ASSIGNED',
      userId: authUser.id,
      userRole: authUser.role,
      details: `Assigned case ${id} to detective ${detectiveId}`,
    },
  });

  return NextResponse.json(updated);
}

