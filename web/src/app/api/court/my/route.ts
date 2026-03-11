import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyToken } from '../../../../lib/auth';

export async function GET(request: NextRequest) {
  const user = verifyToken(request);
  if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  if (user.role !== 'CITIZEN') {
    return NextResponse.json({ error: 'Only citizens can view their cases' }, { status: 403 });
  }

  try {
    const records = await prisma.courtRecord.findMany({
      where: {
        case: {
          incident: {
            citizenId: user.id,
          },
        },
      },
      include: {
        case: {
          include: {
            incident: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to fetch citizen cases', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

