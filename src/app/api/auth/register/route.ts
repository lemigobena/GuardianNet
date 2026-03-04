import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../../lib/prisma';
import { generateToken, getModelForRole } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
    const { name, email, password, role } = await request.json();
    const assignedRole = role || 'CITIZEN';
    const model = getModelForRole(assignedRole) as any;

    if (!model) return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });

    try {
        const userExists = await model.findUnique({ where: { email } });
        if (userExists) {
            return NextResponse.json({ error: 'User already exists in this role' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await model.create({
            data: { name, email, passwordHash },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: assignedRole,
            token: generateToken(user.id, assignedRole),
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
    }
}
