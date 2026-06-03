import { NextRequest, NextResponse } from 'next/server';
import { Client, Account } from 'node-appwrite';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const client = new Client();
    client
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    const account = new Account(client);

    const session = await account.createEmailPasswordSession(email, password);

    const user = await account.get();

    const serverClient = new Client();
    serverClient
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    const { Users } = await import('node-appwrite');
    const users = new Users(serverClient);
    const prefs = await users.getPrefs(user.$id);

    if (prefs?.role !== 'admin') {
      try { await account.deleteSession(session.$id); } catch {}
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.adminSession.upsert({
      where: { userId: user.$id },
      update: { email: user.email, name: user.name, role: 'admin', expiresAt },
      create: { userId: user.$id, email: user.email, name: user.name, role: 'admin', expiresAt },
    });

    const response = NextResponse.json({
      success: true,
      user: { id: user.$id, email: user.email, name: user.name, role: 'admin' },
    });

    response.cookies.set('dakkho-admin-session', user.$id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    console.error('Login error:', error);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('dakkho-admin-session', '', { maxAge: 0, path: '/' });
  return response;
}
