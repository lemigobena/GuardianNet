import prisma from '../utils/prisma.js';

export const createCourtRecord = async (req, res) => {
    try {
        const { caseId, charge, verdict, sentence } = req.body;

        const record = await prisma.courtRecord.create({
            data: {
                charge,
                verdict: verdict || 'PENDING',
                sentence,
                caseId
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'COURT_RECORD_CREATED',
                userId: req.user.id,
                userRole: req.user.role,
                details: `Court record for case ${caseId} created`,
            }
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: 'Record creation failed' });
    }
};

export const getCourtRecords = async (req, res) => {
    try {
        const records = await prisma.courtRecord.findMany({
            include: { case: true }
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch court records' });
    }
};
