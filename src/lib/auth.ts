'use server';
import { cookies } from 'next/headers';

// This is a mock authentication service.
// In a real application, this would involve session management, database lookups, etc.

const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

/**
 * Retrieves the current user's ID. In this mock implementation,
 * it returns a hardcoded UUID.
 */
export async function getCurrentUserId(): Promise<string | null> {
    // In a real app, you would verify a session cookie or JWT here.
    const session = cookies().get('session');
    // For now, we'll just return the mock user ID if any "session" exists.
    if (session) {
      return MOCK_USER_ID;
    }
    // Simulate no user logged in
    return null; 
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
