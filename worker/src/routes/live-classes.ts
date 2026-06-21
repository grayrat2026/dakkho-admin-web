/**
 * Live Classes Admin Routes
 * Supports: Jitsi, Zoom, Google Meet, Custom, and LiveKit platforms
 * LiveKit rooms are auto-created when platform is 'livekit'
 */

import { Hono } from 'hono';
import type { Env } from '../env';
import type { AuthVariables } from '../lib/auth';
import { adminAuthMiddleware } from '../lib/auth';
import { logAudit } from '../lib/audit';
import { getErrorMessage } from '../lib/utils';
import { getLiveKitConfig, generateLiveKitToken, generateRoomName } from '../lib/livekit';

const liveClassRoutes = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

liveClassRoutes.use('*', adminAuthMiddleware);

// GET / — List live classes
liveClassRoutes.get('/', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const status = c.req.query('status');
    const platform = c.req.query('platform');

    let query = 'SELECT * FROM live_class_schedules';
    let countQuery = 'SELECT COUNT(*) as total FROM live_class_schedules';
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (platform) {
      conditions.push('platform = ?');
      params.push(platform);
    }

    if (conditions.length > 0) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where;
      countQuery += where;
    }

    query += ' ORDER BY scheduled_at DESC LIMIT ? OFFSET ?';

    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = (countResult as any)?.total || 0;

    const result = await c.env.DB.prepare(query).bind(...params, limit, offset).all();

    // Enrich with LiveKit URL if applicable
    const livekitConfig = await getLiveKitConfig(c.env.KV_CONFIG);
    const enriched = (result.results as any[]).map((cls) => {
      if (cls.platform === 'livekit' && livekitConfig) {
        cls.livekit_url = livekitConfig.url;
        cls.room_name = generateRoomName(cls.id);
      }
      return cls;
    });

    return c.json({ liveClasses: enriched, total });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST / — Schedule live class
liveClassRoutes.post('/', async (c) => {
  try {
    const data = await c.req.json();
    const { course_id, title, title_bn, description, instructor_id, technology_id, scheduled_at, duration_minutes, meeting_url, platform } = data;

    if (!title || !scheduled_at) {
      return c.json({ error: 'title and scheduled_at required' }, 400);
    }

    const user = c.get('user');
    const resolvedPlatform = platform || 'jitsi';
    const resolvedMeetingUrl = meeting_url || null;

    const result = await c.env.DB.prepare(`
      INSERT INTO live_class_schedules (course_id, title, title_bn, description, instructor_id, technology_id, scheduled_at, duration_minutes, meeting_url, platform, status, is_active, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', 1, ?)
    `).bind(
      course_id || null, title, title_bn || null, description || null,
      instructor_id || null, technology_id || null, scheduled_at,
      duration_minutes || 60, resolvedMeetingUrl, resolvedPlatform, user.id
    ).run();

    const scheduleId = (result.meta as any)?.last_row_id;

    // For LiveKit platform: return room name info
    let livekitInfo = null;
    if (resolvedPlatform === 'livekit') {
      const roomName = generateRoomName(scheduleId);
      const livekitConfig = await getLiveKitConfig(c.env.KV_CONFIG);
      livekitInfo = {
        platform: 'livekit',
        roomName,
        url: livekitConfig?.url || null,
        note: 'LiveKit room will be auto-created when instructor starts the class',
      };
    }

    await logAudit(c.env, user.id, 'CREATE_LIVE_CLASS', 'live_classes', String(scheduleId), { ...data, livekitInfo });

    return c.json({
      success: true,
      message: 'Live class scheduled successfully',
      scheduleId,
      livekitInfo,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// GET /:id — Get live class detail
liveClassRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const cls = await c.env.DB.prepare(
      'SELECT * FROM live_class_schedules WHERE id = ?'
    ).bind(id).first();

    if (!cls) {
      return c.json({ error: 'Live class not found' }, 404);
    }

    const result: any = { ...cls };

    // Add LiveKit info if applicable
    if ((cls as any).platform === 'livekit') {
      const livekitConfig = await getLiveKitConfig(c.env.KV_CONFIG);
      result.room_name = generateRoomName((cls as any).id);
      if (livekitConfig) {
        result.livekit_url = livekitConfig.url;
      }
    }

    // Participant count from KV
    const participantCount = await c.env.KV_CONFIG.get(`LIVEKIT_PARTICIPANTS:${(cls as any).id}`);
    result.participant_count = participantCount ? parseInt(participantCount) : 0;

    return c.json({ liveClass: result });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /:id/host — Generate LiveKit host token for instructor/admin
liveClassRoutes.post('/:id/host', async (c) => {
  try {
    const id = c.req.param('id');
    const cls = await c.env.DB.prepare(
      'SELECT * FROM live_class_schedules WHERE id = ?'
    ).bind(id).first();

    if (!cls) {
      return c.json({ error: 'Live class not found' }, 404);
    }

    const liveClass = cls as any;

    if (liveClass.platform !== 'livekit') {
      return c.json({ error: 'Host token is only available for LiveKit platform classes' }, 400);
    }

    const livekitConfig = await getLiveKitConfig(c.env.KV_CONFIG);
    if (!livekitConfig) {
      return c.json({ error: 'LiveKit is not configured' }, 503);
    }

    const user = c.get('user');
    const roomName = generateRoomName(liveClass.id);
    const token = await generateLiveKitToken({
      apiKey: livekitConfig.apiKey,
      apiSecret: livekitConfig.apiSecret,
      identity: `host-${user.id}`,
      name: user.name || user.email || 'Host',
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canAdmin: true,
      ttl: 4 * 60 * 60, // 4 hours
      metadata: JSON.stringify({
        userId: user.id,
        role: 'host',
        classId: liveClass.id,
        courseId: liveClass.course_id || null,
      }),
    });

    // Update class status to 'live'
    await c.env.DB.prepare(
      "UPDATE live_class_schedules SET status = 'live', updated_at = datetime('now') WHERE id = ?"
    ).bind(liveClass.id).run();

    await logAudit(c.env, user.id, 'START_LIVE_CLASS', 'live_classes', String(liveClass.id), { platform: 'livekit', roomName });

    return c.json({
      token,
      url: livekitConfig.url,
      roomName,
      identity: `host-${user.id}`,
      classId: liveClass.id,
      title: liveClass.title,
    });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// POST /:id/end — End a live class
liveClassRoutes.post('/:id/end', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    await c.env.DB.prepare(
      "UPDATE live_class_schedules SET status = 'completed', is_active = 0, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();

    // Clean up participant count in KV
    await c.env.KV_CONFIG.delete(`LIVEKIT_PARTICIPANTS:${id}`);

    await logAudit(c.env, user.id, 'END_LIVE_CLASS', 'live_classes', id);

    return c.json({ success: true, message: 'Live class ended' });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// PUT /:id — Update live class
liveClassRoutes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const user = c.get('user');

    const updates: string[] = [];
    const params: any[] = [];

    const allowedFields = ['course_id', 'title', 'title_bn', 'description', 'instructor_id', 'technology_id', 'scheduled_at', 'duration_minutes', 'meeting_url', 'platform', 'status', 'recording_url', 'is_active'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    params.push(id);

    await c.env.DB.prepare(
      `UPDATE live_class_schedules SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    await logAudit(c.env, user.id, 'UPDATE_LIVE_CLASS', 'live_classes', id, data);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

// DELETE /:id — Cancel live class
liveClassRoutes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = c.get('user');

    await c.env.DB.prepare(`
      UPDATE live_class_schedules SET status = 'cancelled', is_active = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    // Clean up KV
    await c.env.KV_CONFIG.delete(`LIVEKIT_PARTICIPANTS:${id}`);

    await logAudit(c.env, user.id, 'CANCEL_LIVE_CLASS', 'live_classes', id);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: getErrorMessage(error) }, 500);
  }
});

export default liveClassRoutes;
