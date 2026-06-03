import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, deleteFromR2 } from '@/lib/r2';
import { logAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const prefix = (formData.get('prefix') as string) || '';

    if (!file || !bucket) {
      return NextResponse.json({ error: 'File and bucket are required' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = prefix ? `${prefix}/${Date.now()}-${file.name}` : `${Date.now()}-${file.name}`;

    await uploadToR2(bucket, key, buffer, file.type);

    const url = `${process.env.R2_ENDPOINT}/${bucket}/${key}`;

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'UPLOAD_FILE', 'r2', key, { bucket, fileName: file.name, size: file.size });

    return NextResponse.json({ url, key, bucket });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bucket = searchParams.get('bucket');
    const key = searchParams.get('key');

    if (!bucket || !key) {
      return NextResponse.json({ error: 'Bucket and key are required' }, { status: 400 });
    }

    await deleteFromR2(bucket, key);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'DELETE_FILE', 'r2', key, { bucket });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
