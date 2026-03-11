import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';
import bcrypt from 'bcrypt';

function generateRegistrarId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'REG-';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let pw = '';
  for (let i = 0; i < 10; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
}

export async function POST(request: NextRequest) {
  const user = verifyToken(request);
  if (!user || user.role !== 'SYSTEM_ADMIN') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }
  const body = await request.json();
  const { name, email, phone, department, address, dateOfBirth } = body;
  const id = generateRegistrarId();
  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const registrar = await prisma.registrar.create({
    data: {
      id,
      name,
      email,
      phone,
      department,
      address,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      passwordHash,
      biometric_registered: false,
    }
  });
  await prisma.auditLog.create({
    data: {
      action: 'REGISTRAR_CREATED',
      userId: user.id,
      userRole: user.role,
      details: `Registrar ${id} created by admin ${user.id}`,
    }
  });
  return NextResponse.json({ id, tempPassword, registrar });
}
