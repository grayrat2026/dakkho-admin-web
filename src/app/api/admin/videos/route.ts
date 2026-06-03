import { NextRequest, NextResponse } from 'next/server';
import { databases, dbId, Query, ID } from '@/lib/appwrite-server';
import { APPWRITE_COLLECTIONS } from '@/lib/constants';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const courseId = searchParams.get('courseId') || '';
    const published = searchParams.get('published') || '';

    const queries: unknown[] = [];
    if (courseId) queries.push(Query.equal('courseId', courseId));
    if (published === 'true') queries.push(Query.equal('isPublished', true));
    if (published === 'false') queries.push(Query.equal('isPublished', false));

    queries.push(Query.limit(limit));
    queries.push(Query.offset((page - 1) * limit));
    queries.push(Query.orderAsc('order'));

    const result = await databases.listDocuments(dbId, APPWRITE_COLLECTIONS.VIDEOS, queries);

    return NextResponse.json({ documents: result.documents, total: result.total });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const result = await databases.createDocument(dbId, APPWRITE_COLLECTIONS.VIDEOS, ID.unique(), data);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'CREATE_VIDEO', 'videos', result.$id, data);

    return NextResponse.json({ document: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { videoId, ...updates } = data;

    if (!videoId) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

    const result = await databases.updateDocument(dbId, APPWRITE_COLLECTIONS.VIDEOS, videoId, updates);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'UPDATE_VIDEO', 'videos', videoId, updates);

    return NextResponse.json({ document: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('id');

    if (!videoId) return NextResponse.json({ error: 'Video ID required' }, { status: 400 });

    await databases.deleteDocument(dbId, APPWRITE_COLLECTIONS.VIDEOS, videoId);

    const adminId = req.cookies.get('dakkho-admin-session')?.value || 'unknown';
    await logAudit(adminId, 'DELETE_VIDEO', 'videos', videoId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
