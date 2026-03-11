import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'guardian_net_super_secret_key';

export function generateToken(id: string, role: string) {
    return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });
}

export function getModelForRole(role: string) {
    switch (role) {
        case 'CITIZEN': return prisma.citizen;
        case 'PATROL_OFFICER': return prisma.patrolOfficer;
        case 'DETECTIVE': return prisma.detective;
        case 'SUPERVISOR': return prisma.supervisor;
        case 'PROSECUTOR': return prisma.prosecutor;
        case 'JUDICIAL_ADMIN': return prisma.judicialAdmin;
        case 'FORENSIC_OFFICER': return prisma.forensicOfficer;
        case 'SYSTEM_ADMIN': return prisma.systemAdmin;
        case 'REGISTRAR': return prisma.registrar;
        default: return null;
    }
}

export interface AuthUser {
    id: string;
    role: string;
}

export function verifyTokenString(token: string): AuthUser | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch {
        return null;
    }
}

export function verifyToken(request: NextRequest): AuthUser | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Resolve the canonical role for a user ID by checking the database.
 * This is used to guard against any mismatch between the JWT payload and the actual role.
 */
export async function resolveRoleFromDatabase(userId: string): Promise<string | null> {
    // Fast path: infer role from ID prefix (CT-, PO-, etc) and verify that record exists
    const prefix = userId.split('-')[0];
    const prefixMap: Record<string, string> = {
        CT: 'CITIZEN',
        PO: 'PATROL_OFFICER',
        DT: 'DETECTIVE',
        FO: 'FORENSIC_OFFICER',
        JD: 'JUDICIAL_ADMIN',
        PR: 'PROSECUTOR',
        SP: 'SUPERVISOR',
        RG: 'REGISTRAR',
        AD: 'SYSTEM_ADMIN',
    };

    const guessedRole = prefixMap[prefix];
    if (guessedRole) {
        const model = getModelForRole(guessedRole) as any;
        if (model) {
            const found = await model.findUnique({ where: { id: userId } });
            if (found) return guessedRole;
        }
    }

    // Fallback: scan all role tables (slower but robust for UUID-based IDs)
    const roleModels: { role: string; model: any }[] = [
        { role: 'CITIZEN', model: prisma.citizen },
        { role: 'PATROL_OFFICER', model: prisma.patrolOfficer },
        { role: 'DETECTIVE', model: prisma.detective },
        { role: 'SUPERVISOR', model: prisma.supervisor },
        { role: 'PROSECUTOR', model: prisma.prosecutor },
        { role: 'JUDICIAL_ADMIN', model: prisma.judicialAdmin },
        { role: 'FORENSIC_OFFICER', model: prisma.forensicOfficer },
        { role: 'SYSTEM_ADMIN', model: prisma.systemAdmin },
        { role: 'REGISTRAR', model: prisma.registrar },
    ];

    for (const { role, model } of roleModels) {
        const found = await model.findUnique({ where: { id: userId } });
        if (found) return role;
    }

    return null;
}

export function verifyBiometricToken(request: NextRequest, userId: string): boolean {
    const bioToken = request.headers.get('x-biometric-token');
    if (!bioToken) return false;

    try {
        const decoded = jwt.verify(bioToken, JWT_SECRET) as { id: string; biometricVerified: boolean };
        return decoded.biometricVerified && decoded.id === userId;
    } catch {
        return false;
    }
}
