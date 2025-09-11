'use server';
import { cookies } from 'next/headers';

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

/**
 * Simulates a user login by setting a session cookie.
 * @param userId The ID of the user to log in.
 */
export async function login(userId: string) {
    const isSecure = process.env.NEXT_PUBLIC_SECURE_COOKIES === 'true';
    cookies().set('session', userId, {
        httpOnly: true,
        secure: isSecure,
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
