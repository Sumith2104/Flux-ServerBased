'use server';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// This is a mock authentication service.
// In a real application, this would involve session management, database lookups, etc.

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


async function findUserById(userId: string) {
    const usersCsvPath = path.join(process.cwd(), 'src', 'database', 'users.csv');
    try {
        const data = await fs.readFile(usersCsvPath, 'utf8');
        const rows = data.trim().split('\n');
        const header = rows[0].split(',');
        const users = rows.slice(1).map(row => {
            const values = row.split(',');
            return header.reduce((obj, nextKey, index) => {
                obj[nextKey.trim()] = values[index].trim();
                return obj;
            }, {} as Record<string, string>);
        });
        return users.find(u => u.id === userId);
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
