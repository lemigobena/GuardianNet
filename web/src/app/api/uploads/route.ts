import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../lib/auth';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    const user = verifyToken(request);
    if (!user) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadDir, { recursive: true });

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const targetPath = path.join(uploadDir, uniqueName);

        await fs.writeFile(targetPath, buffer);

        const url = `/uploads/${uniqueName}`;

        return NextResponse.json(
            {
                url,
                originalName: file.name,
                size: file.size,
                type: file.type,
            },
            { status: 201 },
        );
    } catch (err) {
        console.error('File upload failed', err);
        return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
    }
}

