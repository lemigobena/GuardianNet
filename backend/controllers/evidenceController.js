import prisma from '../utils/prisma.js';

export const uploadEvidence = async (req, res) => {
    try {
        const { caseId, description } = req.body;

        // The file is automatically uploaded to cloudinary by the middleware
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const fileUrl = req.file.path;

        const data = {
            type: req.file.mimetype.includes('image') ? 'IMAGE' : 'DOCUMENT',
            fileUrl,
            description: description || 'No description provided',
            caseId,
        };

        if (req.user.role === 'DETECTIVE') {
            data.detectiveId = req.user.id;
        } else if (req.user.role === 'FORENSIC_OFFICER') {
            data.forensicOfficerId = req.user.id;
        }

        const evidence = await prisma.evidence.create({ data });

        await prisma.auditLog.create({
            data: {
                action: 'EVIDENCE_UPLOAD',
                userId: req.user.id,
                userRole: req.user.role,
                details: `Evidence uploaded for case ${caseId}`,
            }
        });

        res.status(201).json(evidence);
    } catch (error) {
        res.status(500).json({ error: 'Evidence upload failed' });
    }
};

export const getEvidenceForCase = async (req, res) => {
    try {
        const { id } = req.params;
        const evidence = await prisma.evidence.findMany({
            where: { caseId: id },
            include: {
                detective: { select: { name: true } },
                forensicOfficer: { select: { name: true } }
            }
        });
        res.json(evidence);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch evidence' });
    }
};
