import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyToken, getModelForRole } from '../../../../lib/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'guardian_net_super_secret_key';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const body = await request.json();
    const targetUserId = body.userId || user.id;
    const model = getModelForRole(user.role) as any;

    if (!model) return NextResponse.json({ error: 'Invalid role in token' }, { status: 400 });

    try {
        const dbUser = await model.findUnique({ where: { id: targetUserId } });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in that role table' }, { status: 404 });
        }

        const biometricToken = jwt.sign(
            { id: dbUser.id, role: user.role, biometricVerified: true },
            JWT_SECRET,
            { expiresIn: '5m' }
        );

        return NextResponse.json({ success: true, biometricToken });
    } catch {
        return NextResponse.json({ error: 'Biometric verification failed' }, { status: 500 });
    }
}
