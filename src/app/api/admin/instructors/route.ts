import { NextRequest, NextResponse } from 'next/server';
import { databases, dbId, Query, ID } from '@/lib/appwrite-server';
import { APPWRITE_COLLECTIONS } from '@/lib/constants';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const queries: unknown[] = [];
    if (search) queries.push(Query.search('name', search));
    queries.push(Query.limit(limit));
    queries.push(Query.offset((page - 1) * limit));
    queries.push(Query.orderDesc('$createdAt'));

    const result = await databases.listDocuments(dbId, APPWRITE_COLLECTIONS.INSTRUCTORS, queries);

    return NextResponse.json({ documents: result.documents, total: result.total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const result = await databases.createDocument(dbId, APPWRITE_COLLECTIONS.INSTRUCTORS, ID.unique(), data);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'CREATE_INSTRUCTOR', 'instructors', result.$id, data);

    return NextResponse.json({ document: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { instructorId, ...updates } = data;

    if (!instructorId) return NextResponse.json({ error: 'Instructor ID required' }, { status: 400 });

    const result = await databases.updateDocument(dbId, APPWRITE_COLLECTIONS.INSTRUCTORS, instructorId, updates);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'UPDATE_INSTRUCTOR', 'instructors', instructorId, updates);

    return NextResponse.json({ document: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const instructorId = searchParams.get('id');

    if (!instructorId) return NextResponse.json({ error: 'Instructor ID required' }, { status: 400 });

    await databases.deleteDocument(dbId, APPWRITE_COLLECTIONS.INSTRUCTORS, instructorId);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'DELETE_INSTRUCTOR', 'instructors', instructorId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
