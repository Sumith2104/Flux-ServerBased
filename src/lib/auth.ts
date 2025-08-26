'use server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// This is a mock authentication service.
// In a real application, this would involve session management, database lookups, etc.

export interface User {
    id: string;
    email: string;
    password?: string;
    created_at: string;
}

/**
 * Retrieves the current user's ID from the session cookie.
 */
export async function getCurrentUserId(): Promise<string | null> {
    const session = cookies().get('session');
    if (session) {
      return session.value;
    }
    return null; 
}


export async function findUserById(userId: string): Promise<User | null> {
    const usersCsvPath = path.join(process.cwd(), 'src', 'database', 'users.csv');
    try {
        const data = await fs.readFile(usersCsvPath, 'utf8');
        const rows = data.trim().split('\n');
        if (rows.length < 2) return null;
        const header = rows[0].split(',');
        const users = rows.slice(1).map(row => {
            const values = row.split(',');
            return header.reduce((obj, nextKey, index) => {
                obj[nextKey.trim()] = values[index]?.trim().replace(/^"|"$/g, '');
                return obj;
            }, {} as Record<string, string>);
        });
        const user = users.find(u => u.id === userId);
        return user as User || null;
    } catch (error) {
        console.error("Failed to read or parse users.csv", error);
        return null;
    }
}


/**
 * Simulates a user login by setting a session cookie.
 * @param userId The ID of the user to log in.
 */
export async function login(userId: string) {
    cookies().set('session', userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
      });
}

/**
 * Simulates a user logout by deleting the session cookie.
 */
export async function logout() {
    cookies().delete('session');
}
