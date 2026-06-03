import { NextRequest, NextResponse } from 'next/server';
import { databases, dbId, Query, ID } from '@/lib/appwrite-server';
import { APPWRITE_COLLECTIONS } from '@/lib/constants';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const queries: unknown[] = [Query.limit(limit), Query.offset((page - 1) * limit), Query.orderDesc('$createdAt')];

    const result = await databases.listDocuments(dbId, APPWRITE_COLLECTIONS.INSTITUTES, queries);

    return NextResponse.json({ documents: result.documents, total: result.total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await databases.createDocument(dbId, APPWRITE_COLLECTIONS.INSTITUTES, ID.unique(), data);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'CREATE_INSTITUTE', 'institutes', result.$id, data);

    return NextResponse.json({ document: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { instituteId, ...updates } = data;
    if (!instituteId) return NextResponse.json({ error: 'Institute ID required' }, { status: 400 });

    const result = await databases.updateDocument(dbId, APPWRITE_COLLECTIONS.INSTITUTES, instituteId, updates);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'UPDATE_INSTITUTE', 'institutes', instituteId, updates);

    return NextResponse.json({ document: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instituteId = searchParams.get('id');
    if (!instituteId) return NextResponse.json({ error: 'Institute ID required' }, { status: 400 });

    await databases.deleteDocument(dbId, APPWRITE_COLLECTIONS.INSTITUTES, instituteId);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'DELETE_INSTITUTE', 'institutes', instituteId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
