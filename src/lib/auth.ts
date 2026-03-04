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
        default: return null;
    }
}

export interface AuthUser {
    id: string;
    role: string;
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
