/**
 * LiveKit Integration — Token generation & webhook helpers
 *
 * Generates JWT access tokens for LiveKit rooms using Web Crypto API
 * (compatible with Cloudflare Workers runtime — no Node.js deps needed).
 *
 * Credentials are stored in Workers KV (never hardcoded):
 *   KV_CONFIG:LIVEKIT_API_KEY
 *   KV_CONFIG:LIVEKIT_API_SECRET
 *   KV_CONFIG:LIVEKIT_URL
 */

import type { Env } from '../env';

// ─── KV Key Constants ───
const KV_LIVEKIT_API_KEY = 'LIVEKIT_API_KEY';
const KV_LIVEKIT_API_SECRET = 'LIVEKIT_API_SECRET';
const KV_LIVEKIT_URL = 'LIVEKIT_URL';

// ─── Credential Fetching ───

export async function getLiveKitConfig(kv: KVNamespace): Promise<{
  apiKey: string;
  apiSecret: string;
  url: string;
} | null> {
  const [apiKey, apiSecret, url] = await Promise.all([
    kv.get(KV_LIVEKIT_API_KEY),
    kv.get(KV_LIVEKIT_API_SECRET),
    kv.get(KV_LIVEKIT_URL),
  ]);

  if (!apiKey || !apiSecret || !url) return null;
  return { apiKey, apiSecret, url };
}

// ─── JWT Token Generation (Web Crypto) ───

interface LiveKitTokenOptions {
  /** LiveKit API Key (iss claim) */
  apiKey: string;
  /** LiveKit API Secret (signing key) */
  apiSecret: string;
  /** Unique identity for the participant */
  identity: string;
  /** Display name for the participant */
  name?: string;
  /** Room name to join */
  room: string;
  /** Whether participant can publish audio/video */
  canPublish?: boolean;
  /** Whether participant can subscribe to other participants */
  canSubscribe?: boolean;
  /** Whether participant can publish data (chat, etc.) */
  canPublishData?: boolean;
  /** Whether this is a room-level admin (can update room, remove participants) */
  canAdmin?: boolean;
  /** Token validity in seconds (default: 4 hours) */
  ttl?: number;
  /** Custom metadata string */
  metadata?: string;
}

/**
 * Generate a LiveKit access token (JWT) using Web Crypto API.
 * Compatible with Cloudflare Workers — no Node.js dependencies.
 */
export async function generateLiveKitToken(options: LiveKitTokenOptions): Promise<string> {
  const {
    apiKey,
    apiSecret,
    identity,
    name,
    room,
    canPublish = true,
    canSubscribe = true,
    canPublishData = true,
    canAdmin = false,
    ttl = 4 * 60 * 60, // 4 hours
    metadata,
  } = options;

  const now = Math.floor(Date.now() / 1000);

  // JWT Header
  const header = { alg: 'HS256', typ: 'JWT' };

  // JWT Payload with LiveKit video grant
  const payload: Record<string, unknown> = {
    iss: apiKey,
    sub: identity,
    iat: now,
    exp: now + ttl,
    nbf: now,
    video: {
      roomJoin: true,
      room,
      canPublish,
      canSubscribe,
      canPublishData,
      canAdmin,
    },
  };

  if (name) payload.name = name;
  if (metadata) payload.metadata = metadata;

  // Base64url encode
  const base64url = (data: Uint8Array | object) => {
    const str = data instanceof Uint8Array
      ? String.fromCharCode(...data)
      : JSON.stringify(data);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);
  const message = `${encodedHeader}.${encodedPayload}`;

  // Sign with HMAC-SHA256
  const keyData = new TextEncoder().encode(apiSecret);
  const messageData = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const encodedSignature = base64url(new Uint8Array(signature));

  return `${message}.${encodedSignature}`;
}

// ─── Room Name Generator ───

/**
 * Generate a deterministic room name for a scheduled live class.
 * Format: dakkho-class-{scheduleId}
 */
export function generateRoomName(scheduleId: number | string): string {
  return `dakkho-class-${scheduleId}`;
}

// ─── Webhook Verification ───

/**
 * Verify a LiveKit webhook JWT signature.
 * LiveKit sends webhooks as signed JWTs — we verify using the API secret.
 */
export async function verifyLiveKitWebhook(
  token: string,
  apiSecret: string
): Promise<Record<string, unknown> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    // Verify signature
    const keyData = new TextEncoder().encode(apiSecret);
    const messageData = new TextEncoder().encode(message);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode base64url signature
    const sigStr = atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array([...sigStr].map(c => c.charCodeAt(0)));

    const valid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, messageData);
    if (!valid) return null;

    // Decode payload
    const payloadStr = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}
