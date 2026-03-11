import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { getModelForRole, verifyToken } from '../../../lib/auth';

const SAFE_FIELDS_BY_ROLE: Record<string, string[]> = {
  CITIZEN: ['name', 'email', 'phone', 'address'],
  PATROL_OFFICER: ['name', 'email', 'badgeNumber', 'station', 'rank', 'department'],
  DETECTIVE: ['name', 'email', 'badgeNumber', 'unit', 'department'],
  FORENSIC_OFFICER: ['name', 'email', 'lab', 'specialization', 'department'],
  JUDICIAL_ADMIN: ['name', 'email', 'court', 'title'],
  PROSECUTOR: ['name', 'email', 'office'],
  SUPERVISOR: ['name', 'email', 'department', 'region'],
  REGISTRAR: ['name', 'email', 'phone', 'department', 'address'],
  SYSTEM_ADMIN: ['name', 'email'],
};

function maskNationalId(nationalIdNumber: unknown) {
  if (typeof nationalIdNumber !== 'string') return null;
  const digits = nationalIdNumber.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***-***-${digits.slice(-4)}`;
}

function pickAllowed(role: string, body: Record<string, unknown>) {
  const allowed = new Set(SAFE_FIELDS_BY_ROLE[role] || ['name', 'email']);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!allowed.has(k)) continue;
    if (typeof v === 'string') out[k] = v.trim();
    else if (v === null) out[k] = null;
  }
  return out;
}

export async function GET(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const model = getModelForRole(authUser.role) as any;
  if (!model) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const user = await model.findUnique({ where: { id: authUser.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const allowed = SAFE_FIELDS_BY_ROLE[authUser.role] || ['name', 'email'];
  const profile: Record<string, unknown> = { id: user.id, role: authUser.role };
  for (const f of allowed) profile[f] = user[f];

  // Read-only identity metadata (visible but not editable)
  if (typeof user.jurisdiction === 'string' && user.jurisdiction.length) profile.jurisdiction = user.jurisdiction;
  const masked = maskNationalId(user.nationalIdNumber);
  if (masked) profile.nationalIdMasked = masked;

  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest) {
  const authUser = verifyToken(request);
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const model = getModelForRole(authUser.role) as any;
  if (!model) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const body = (await request.json()) as Record<string, unknown>;
  const data = pickAllowed(authUser.role, body);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  // If email is changing, ensure unique within role table
  if (typeof data.email === 'string' && data.email.length) {
    const existing = await model.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== authUser.id) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
  }

  const updated = await model.update({ where: { id: authUser.id }, data });

  // Minimal audit
  await prisma.auditLog.create({
    data: {
      action: 'PROFILE_UPDATED',
      userId: authUser.id,
      userRole: authUser.role,
      details: `Updated profile fields: ${Object.keys(data).join(', ')}`,
    },
  });

  const allowed = SAFE_FIELDS_BY_ROLE[authUser.role] || ['name', 'email'];
  const profile: Record<string, unknown> = { id: updated.id, role: authUser.role };
  for (const f of allowed) profile[f] = updated[f];
  return NextResponse.json(profile);
}

