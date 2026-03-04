import prisma from '../utils/prisma.js';

export const addSuspect = async (req, res) => {
    try {
        const { caseId, name, biometricReference } = req.body;

        const suspect = await prisma.suspect.create({
            data: {
                caseId,
                name,
                biometricReference
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'SUSPECT_ADDED',
                userId: req.user.id,
                userRole: req.user.role,
                details: `Suspect ${name} added to case ${caseId}`,
            }
        });

        res.status(201).json(suspect);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add suspect' });
    }
};

export const getSuspectsForCase = async (req, res) => {
    try {
        const { id } = req.params;
        const suspects = await prisma.suspect.findMany({
            where: { caseId: id }
        });
        res.json(suspects);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suspects' });
    }
};
