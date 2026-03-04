import prisma from '../utils/prisma.js';

export const createCase = async (req, res) => {
    const { incidentId, classification } = req.body;

    try {
        const caseObj = await prisma.case.create({
            data: {
                incidentId,
                detectiveId: req.user.id,
                classification,
            }
        });

        await prisma.incident.update({
            where: { id: incidentId },
            data: { status: 'UNDER_INVESTIGATION' }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                userRole: req.user.role,
                action: `Created Case ${caseObj.id} from Incident ${incidentId}`,
                biometricVerified: true
            }
        });

        res.status(201).json(caseObj);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getCases = async (req, res) => {
    try {
        const cases = await prisma.case.findMany({ include: { incident: true }, orderBy: { createdAt: 'desc' } });
        res.json(cases);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
