

'use server';

import type { User } from '@/lib/auth';
import prisma from '@/lib/prisma';


export async function findUserById(userId: string): Promise<User | null> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (user) {
            // Ensure the returned object matches the User interface
            return {
                id: user.id,
                email: user.email,
                created_at: user.createdAt.toISOString(),
            };
        }
        return null;
    } catch (error) {
        console.error('Failed to find user by ID:', error);
        return null;
    }
}
