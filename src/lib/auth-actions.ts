
'use server';

import type { User } from '@/lib/auth';

export async function findUserById(userId: string): Promise<User | null> {
    // This is mock data. Replace with your actual database query.
    if (userId === '123e4567-e89b-12d3-a456-426614174000') {
        return {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user@example.com',
            created_at: new Date().toISOString(),
        };
    }
    return null;
}
