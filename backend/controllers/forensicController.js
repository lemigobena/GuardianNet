import prisma from '../utils/prisma.js';

export const createReport = async (req, res) => {
    try {
        const { caseId, findings } = req.body;

        const report = await prisma.forensicReport.create({
            data: {
                findings,
                caseId,
                officerId: req.user.id
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'FORENSIC_REPORT_CREATED',
                userId: req.user.id,
                userRole: req.user.role,
                details: `Forensic report for case ${caseId}`,
            }
        });

        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: 'Report creation failed' });
    }
};

export const getReportsForCase = async (req, res) => {
    try {
        const { id } = req.params;
        const reports = await prisma.forensicReport.findMany({
            where: { caseId: id },
            include: { officer: { select: { name: true, role: true } } }
        });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
};
