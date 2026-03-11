import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../../lib/prisma';
import { getModelForRole, verifyToken } from '../../../../lib/auth';

export async function PUT(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
  const currentPassword = body.currentPassword || '';
  const newPassword = body.newPassword || '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'currentPassword and newPassword are required' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  }

  const model = getModelForRole(authUser.role) as any;
  if (!model) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const user = await model.findUnique({ where: { id: authUser.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);
  await model.update({ where: { id: authUser.id }, data: { passwordHash } });

  await prisma.auditLog.create({
    data: {
      action: 'PASSWORD_CHANGED',
      userId: authUser.id,
      userRole: authUser.role,
      details: `Password changed`,
    },
  });

  return NextResponse.json({ ok: true });
}

