import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    if (!['DETECTIVE', 'FORENSIC_OFFICER'].includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { caseId, description, type, fileUrl } = await request.json();

    try {
        const data: any = {
            type: type || 'DOCUMENT',
            fileUrl: fileUrl || '',
            description: description || 'No description provided',
            caseId,
        };

        if (user.role === 'DETECTIVE') data.detectiveId = user.id;
        else if (user.role === 'FORENSIC_OFFICER') data.forensicOfficerId = user.id;

        const evidence = await prisma.evidence.create({ data });

        await prisma.auditLog.create({
            data: {
                action: 'EVIDENCE_UPLOAD',
                userId: user.id,
                userRole: user.role,
                details: `Evidence uploaded for case ${caseId}`,
            },
        });

        return NextResponse.json(evidence, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Evidence upload failed' }, { status: 500 });
    }
}
