import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '../../../../lib/prisma';
import { generateToken, getModelForRole, verifyToken } from '../../../../lib/auth';
function generateRandomId(role: string) {
    const rolePrefix: Record<string, string> = {
        CITIZEN: 'CT',
        PATROL_OFFICER: 'PO',
        DETECTIVE: 'DT',
        FORENSIC_OFFICER: 'FO',
        JUDICIAL_ADMIN: 'JD',
        PROSECUTOR: 'PR',
        SUPERVISOR: 'SP',
        REGISTRAR: 'RG',
        SYSTEM_ADMIN: 'AD',
    };

    const prefix = rolePrefix[role] || role.split('_').map(w => w[0]).join('').toUpperCase();
    const digits = '0123456789';
    let id = `${prefix}-`;
    for (let i = 0; i < 10; i++) {
        id += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return id;
}

export async function POST(request: NextRequest) {
    // 1. Authenticate Request
    const authUser = verifyToken(request);
    if (!authUser) {
        return NextResponse.json({ error: 'Unauthorized. Registration requires an active session.' }, { status: 401 });
    }

    // 2. Authorization Rules
    const body = await request.json();
    const { name, email, password, role } = body;
    const assignedRole = role || 'CITIZEN';

    if (authUser.role !== 'SYSTEM_ADMIN' && authUser.role !== 'REGISTRAR') {
        return NextResponse.json({ error: 'Forbidden. Only Registrars and Admins can create accounts.' }, { status: 403 });
    }

    if (authUser.role === 'REGISTRAR' && (assignedRole === 'REGISTRAR' || assignedRole === 'SYSTEM_ADMIN')) {
        return NextResponse.json({ error: 'Forbidden. Registrars cannot create other Registrars or System Admins.' }, { status: 403 });
    }

    const model = getModelForRole(assignedRole) as any;
    if (!model) return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });

    try {
        const userExists = await model.findUnique({ where: { email } });
        if (userExists) {
            return NextResponse.json({ error: 'User already exists in this role' }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Assign random ID for all except admin/registrar
        let id = undefined;
        if (assignedRole !== 'SYSTEM_ADMIN' && assignedRole !== 'REGISTRAR') {
            id = generateRandomId(assignedRole);
        }

        // Prepare role-specific details
        const roleDetails: Record<string, any> = (() => {
            const d = { ...body };
            delete d.password;
            delete d.role;
            delete d.name;
            delete d.email;

            // Handle date strings if present
            if (d.dateOfBirth) {
                d.dateOfBirth = new Date(d.dateOfBirth);
            }
            
            // Ensure boolean types for specific fields
            if (d.identityVerified !== undefined) d.identityVerified = Boolean(d.identityVerified);
            if (d.employmentVerified !== undefined) d.employmentVerified = Boolean(d.employmentVerified);

            return d;
        })();

        const user = await model.create({
            data: { 
                id,
                name,
                email,
                passwordHash,
                biometric_registered: true,
                ...roleDetails 
            },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'USER_REGISTERED',
                userId: authUser.id,
                userRole: authUser.role,
                details: `Registered ${assignedRole} (${user.id}) by ${authUser.role} ${authUser.id}`,
                biometricVerified: false,
            }
        });

        // Don't auto-login the creator as the new user!
        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: assignedRole,
            message: 'Account successfully registered'
        }, { status: 201 });
    } catch (error: any) {
        console.error('[auth/register] failed', error);
        return NextResponse.json({ error: 'Server error', details: error.message }, { status: 500 });
    }
}
