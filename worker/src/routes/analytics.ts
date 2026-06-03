/**
 * Analytics routes — GET /, GET /charts
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { listDocuments, Query } from '../lib/appwrite';
import { APPWRITE_COLLECTIONS } from '../lib/types';
import { getErrorMessage } from '../lib/utils';

const analyticsRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Apply auth middleware
analyticsRoutes.use('*', adminAuthMiddleware);

// GET / — Get analytics stats
analyticsRoutes.get('/', async (c) => {
  try {
    const [usersRes, coursesRes, videosRes, enrollmentsRes] = await Promise.all([
      listDocuments(c.env, APPWRITE_COLLECTIONS.USERS, [Query.limit(1)]),
      listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, [Query.limit(1)]),
      listDocuments(c.env, APPWRITE_COLLECTIONS.VIDEOS, [Query.limit(1)]),
      listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [Query.limit(1)]),
    ]);

    const stats = {
      totalUsers: usersRes.total,
      totalCourses: coursesRes.total,
      totalVideos: videosRes.total,
      totalEnrollments: enrollmentsRes.total,
      activeSessions: 0,
      newSignupsToday: 0,
    };

    // Try to get today's signups
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const recentUsers = await listDocuments(c.env, APPWRITE_COLLECTIONS.USERS, [
        Query.greaterThanEqual('$createdAt', today.toISOString()),
        Query.limit(1),
      ]);
      stats.newSignupsToday = recentUsers.total;
    } catch {
      // Ignore — may fail if query not indexed
    }

    // Get recent enrollments and popular courses in parallel
    const [recentEnrollments, popularCourses] = await Promise.all([
      listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
        Query.limit(10),
        Query.orderDesc('$createdAt'),
      ]),
      listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, [
        Query.limit(5),
        Query.orderDesc('totalStudents'),
      ]),
    ]);

    // Get active sessions from D1
    try {
      const activeSessions = await c.env.DB.prepare(
        "SELECT COUNT(*) as count FROM admin_sessions WHERE is_active = 1 AND expires_at > datetime('now')"
      ).first<{ count: number }>();
      stats.activeSessions = activeSessions?.count || 0;
    } catch {
      // Ignore D1 errors
    }

    // Get recent audit logs for activity timeline
    let recentLogs: unknown[] = [];
    try {
      const logsResult = await c.env.DB.prepare(
        'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10'
      ).all();
      recentLogs = logsResult.results || [];
    } catch {
      // Ignore D1 errors
    }

    return c.json({
      stats,
      recentEnrollments: recentEnrollments.documents,
      popularCourses: popularCourses.documents,
      recentLogs,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

// GET /charts — Get chart data (real analytics from database)
analyticsRoutes.get('/charts', async (c) => {
  try {
    // Calculate date range for last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const sixMonthsAgoISO = sixMonthsAgo.toISOString();

    // Month names for the last 6 months
    const monthNames: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthNames.push(d.toLocaleString('en', { month: 'short' }));
    }

    // Fetch all data in parallel
    const [enrollmentsRes, coursesRes, usersRes] = await Promise.all([
      listDocuments(c.env, APPWRITE_COLLECTIONS.ENROLLMENTS, [
        Query.greaterThanEqual('$createdAt', sixMonthsAgoISO),
        Query.limit(5000),
        Query.orderAsc('$createdAt'),
      ]).catch(() => ({ documents: [] as Record<string, unknown>[], total: 0 })),
      listDocuments(c.env, APPWRITE_COLLECTIONS.COURSES, [
        Query.limit(5000),
      ]).catch(() => ({ documents: [] as Record<string, unknown>[], total: 0 })),
      listDocuments(c.env, APPWRITE_COLLECTIONS.USERS, [
        Query.greaterThanEqual('$createdAt', sixMonthsAgoISO),
        Query.limit(5000),
        Query.orderAsc('$createdAt'),
      ]).catch(() => ({ documents: [] as Record<string, unknown>[], total: 0 })),
    ]);

    // Build enrollment trend (monthly counts)
    const enrollmentByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) enrollmentByMonth.set(monthNames[i], 0);

    for (const doc of enrollmentsRes.documents) {
      const created = doc.$createdAt as string;
      if (created) {
        const d = new Date(created);
        const monthKey = d.toLocaleString('en', { month: 'short' });
        if (enrollmentByMonth.has(monthKey)) {
          enrollmentByMonth.set(monthKey, (enrollmentByMonth.get(monthKey) || 0) + 1);
        }
      }
    }

    const enrollmentTrend = monthNames.map(month => ({
      month,
      enrollments: enrollmentByMonth.get(month) || 0,
    }));

    // Build course distribution by level
    const levelCounts: Record<string, number> = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    for (const doc of coursesRes.documents) {
      const level = String(doc.level || 'beginner').toLowerCase();
      if (levelCounts[level] !== undefined) {
        levelCounts[level]++;
      } else {
        levelCounts['beginner']++;
      }
    }

    const courseDistribution = Object.entries(levelCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));

    // Build user growth (cumulative monthly counts)
    const usersByMonth = new Map<string, number>();
    for (let i = 0; i < 6; i++) usersByMonth.set(monthNames[i], 0);

    for (const doc of usersRes.documents) {
      const created = doc.$createdAt as string;
      if (created) {
        const d = new Date(created);
        const monthKey = d.toLocaleString('en', { month: 'short' });
        if (usersByMonth.has(monthKey)) {
          usersByMonth.set(monthKey, (usersByMonth.get(monthKey) || 0) + 1);
        }
      }
    }

    // Make cumulative
    let cumulative = 0;
    const userGrowth = monthNames.map(month => {
      cumulative += usersByMonth.get(month) || 0;
      return { month, users: cumulative };
    });

    return c.json({
      enrollmentTrend,
      courseDistribution,
      userGrowth,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    return c.json({ error: message }, 500);
  }
});

export default analyticsRoutes;
