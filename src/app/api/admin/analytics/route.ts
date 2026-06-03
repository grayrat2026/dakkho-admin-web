import { NextRequest, NextResponse } from 'next/server';
import { databases, dbId, Query } from '@/lib/appwrite-server';
import { APPWRITE_COLLECTIONS } from '@/lib/constants';

export async function GET(req: NextRequest) {
  try {
    const [usersRes, coursesRes, videosRes, enrollmentsRes] = await Promise.all([
      databases.listDocuments(dbId, APPWRITE_COLLECTIONS.USERS, [Query.limit(1)]),
      databases.listDocuments(dbId, APPWRITE_COLLECTIONS.COURSES, [Query.limit(1)]),
      databases.listDocuments(dbId, APPWRITE_COLLECTIONS.VIDEOS, [Query.limit(1)]),
      databases.listDocuments(dbId, APPWRITE_COLLECTIONS.ENROLLMENTS, [Query.limit(1)]),
    ]);

    const stats = {
      totalUsers: usersRes.total,
      totalCourses: coursesRes.total,
      totalVideos: videosRes.total,
      totalEnrollments: enrollmentsRes.total,
      activeSessions: 0,
      newSignupsToday: 0,
    };

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recentUsers = await databases.listDocuments(dbId, APPWRITE_COLLECTIONS.USERS, [
        Query.greaterThanEqual('$createdAt', today.toISOString()),
        Query.limit(1),
      ]);
      stats.newSignupsToday = recentUsers.total;
    } catch {}

    const recentEnrollments = await databases.listDocuments(dbId, APPWRITE_COLLECTIONS.ENROLLMENTS, [
      Query.limit(10),
      Query.orderDesc('$createdAt'),
    ]);

    const popularCourses = await databases.listDocuments(dbId, APPWRITE_COLLECTIONS.COURSES, [
      Query.limit(5),
      Query.orderDesc('totalStudents'),
    ]);

    return NextResponse.json({
      stats,
      recentEnrollments: recentEnrollments.documents,
      popularCourses: popularCourses.documents,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
