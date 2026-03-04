import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const getModelForRole = (role) => {
    switch (role) {
        case 'CITIZEN': return prisma.citizen;
        case 'PATROL_OFFICER': return prisma.patrolOfficer;
        case 'DETECTIVE': return prisma.detective;
        case 'SUPERVISOR': return prisma.supervisor;
        case 'PROSECUTOR': return prisma.prosecutor;
        case 'JUDICIAL_ADMIN': return prisma.judicialAdmin;
        case 'FORENSIC_OFFICER': return prisma.forensicOfficer;
        case 'SYSTEM_ADMIN': return prisma.systemAdmin;
        default: return null;
    }
}

export const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    const assignedRole = role || 'CITIZEN';
    const model = getModelForRole(assignedRole);

    if (!model) return res.status(400).json({ error: 'Invalid role provided' });

    try {
        const userExists = await model.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ error: 'User already exists in this role' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await model.create({
            data: {
                name,
                email,
                passwordHash,
            },
        });

        if (user) {
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: assignedRole,
                token: generateToken(user.id, assignedRole),
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Search across all models since login UI does not specify a role
    const models = [
        { name: 'CITIZEN', model: prisma.citizen },
        { name: 'PATROL_OFFICER', model: prisma.patrolOfficer },
        { name: 'DETECTIVE', model: prisma.detective },
        { name: 'SUPERVISOR', model: prisma.supervisor },
        { name: 'PROSECUTOR', model: prisma.prosecutor },
        { name: 'JUDICIAL_ADMIN', model: prisma.judicialAdmin },
        { name: 'FORENSIC_OFFICER', model: prisma.forensicOfficer },
        { name: 'SYSTEM_ADMIN', model: prisma.systemAdmin }
    ];

    try {
        let foundUser = null;
        let foundRole = null;

        for (const m of models) {
            const user = await m.model.findUnique({ where: { email } });
            if (user) {
                foundUser = user;
                foundRole = m.name;
                break;
            }
        }

        if (foundUser && (await bcrypt.compare(password, foundUser.passwordHash))) {
            res.json({
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                role: foundRole,
                biometric_registered: foundUser.biometric_registered,
                token: generateToken(foundUser.id, foundRole),
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const verifyBiometric = async (req, res) => {
    // MOCK BIOMETRIC VERIFICATION ENDPOINT
    const targetUserId = req.body.userId || req.user.id;
    const targetRole = req.user.role; // The middleware validates and attaches the user's role

    const model = getModelForRole(targetRole);
    if (!model) return res.status(400).json({ error: 'Invalid role in token' });

    try {
        const user = await model.findUnique({ where: { id: targetUserId } });

        if (!user) {
            return res.status(404).json({ error: 'User not found in that role table' });
        }

        const biometricToken = jwt.sign(
            { id: user.id, role: targetRole, biometricVerified: true },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }
        );

        res.json({ success: true, biometricToken });
    } catch (error) {
        res.status(500).json({ error: 'Biometric verification failed' });
    }
};
