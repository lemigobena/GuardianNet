import prisma from '../utils/prisma.js';

export const createIncident = async (req, res) => {
    const { description, location } = req.body;

    try {
        const incident = await prisma.incident.create({
            data: {
                citizenId: req.user.id,
                description,
                location,
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: { userId: req.user.id, userRole: req.user.role, action: `Created Incident ${incident.id}` }
        });

        res.status(201).json(incident);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const getIncidents = async (req, res) => {
    try {
        let incidents;
        if (req.user.role === 'CITIZEN') {
            incidents = await prisma.incident.findMany({ where: { citizenId: req.user.id }, orderBy: { createdAt: 'desc' } });
        } else {
            incidents = await prisma.incident.findMany({ orderBy: { createdAt: 'desc' } });
        }
        res.json(incidents);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
