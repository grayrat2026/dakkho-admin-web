import { Client, Databases, Users, Query, ID, Permission, Role } from 'node-appwrite';

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

export const databases = new Databases(client);
export const users = new Users(client);
export const dbId = process.env.APPWRITE_DATABASE_ID!;
export { client, Query, ID, Permission, Role };
