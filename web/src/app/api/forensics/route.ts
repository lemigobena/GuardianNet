import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { verifyToken } from '../../../lib/auth';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const allowed = ['FORENSIC_OFFICER', 'DETECTIVE'];
    if (!allowed.includes(user.role)) {
        return NextResponse.json({ error: 'Role not authorized' }, { status: 403 });
    }

    const { caseId, findings, type, evidenceUsed } = await request.json();

    try {
        const isDetectiveRequest = user.role === 'DETECTIVE';

        // Ensure the detective is assigned to this case before they can request forensics
        if (isDetectiveRequest) {
            const caseRecord = await prisma.case.findUnique({ where: { id: caseId } });
            if (!caseRecord || caseRecord.detectiveId !== user.id) {
                return NextResponse.json({ error: 'Only the assigned detective can request forensics for this case' }, { status: 403 });
            }
        }

        let officerId = user.id;

        if (isDetectiveRequest) {
            // For detective requests, find an available forensic officer as a suggested assignee.
            // The Supervisor will officially confirm/override this via the assign endpoint.
            const officer = await prisma.forensicOfficer.findFirst();
            if (!officer) return NextResponse.json({ error: 'No forensic officers available' }, { status: 400 });
            officerId = officer.id;
        }

        if (!isDetectiveRequest) {
            // Forensic officer fulfills an assigned report
            const existing = await prisma.forensicReport.findFirst({
                where: { caseId, officerId: user.id, status: 'PENDING' }
            });

            if (existing) {
                const updatedReport = await prisma.forensicReport.update({
                    where: { id: existing.id },
                    data: {
                        findings,
                        status: 'COMPLETED',
                        resultSummary: evidenceUsed || null,
                    }
                });

                await prisma.auditLog.create({
                    data: {
                        action: 'FORENSIC_REPORT_COMPLETED',
                        userId: user.id,
                        userRole: user.role,
                        details: `Forensic report completed for case ${caseId}`,
                    },
                });

                return NextResponse.json(updatedReport, { status: 200 });
            }
        }

        // Fallback or Detective creation
        const report = await prisma.forensicReport.create({
            data: {
                findings,
                caseId,
                officerId,
                status: isDetectiveRequest ? 'PENDING_ASSIGNMENT' : 'COMPLETED',
                type: type || (isDetectiveRequest ? 'FORENSIC_REQUEST' : 'LAB_ANALYSIS'),
                resultSummary: evidenceUsed || null,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: isDetectiveRequest ? 'FORENSIC_REQUEST_CREATED' : 'FORENSIC_REPORT_CREATED',
                userId: user.id,
                userRole: user.role,
                details: `Forensic ${isDetectiveRequest ? 'request' : 'report'} for case ${caseId}`,
            },
        });

        return NextResponse.json(report, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Report creation failed' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    try {
        let where: any = {};

        if (user.role === 'FORENSIC_OFFICER') {
            // Forensic officers only see requests explicitly assigned to them and already approved by a Supervisor
            where = {
                officerId: user.id,
                status: { not: 'PENDING_ASSIGNMENT' },
            };
        } else if (user.role === 'DETECTIVE') {
            // Detectives only see reports linked to their own cases
            where = {
                case: {
                    detectiveId: user.id,
                },
            };
        }

        const reports = await prisma.forensicReport.findMany({
            where,
            include: { case: { include: { incident: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(reports);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }
}
