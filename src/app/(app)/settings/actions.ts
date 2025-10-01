
'use server';

import { getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const DB_PATH = '';

export async function deleteProjectAction(projectId: string) {
    const userId = await getCurrentUserId();
    if (!projectId || !userId) {
        return { error: 'Missing required fields for project deletion.' };
    }

    try {
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/projects');
        return { success: true };

    } catch (error) {
        console.error('Failed to delete project:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}


export async function clearOrganizationAction() {
    const userId = await getCurrentUserId();
    if (!userId) {
        return { error: 'User not authenticated.' };
    }

    try {
        return { success: true };

    } catch (error) {
        console.error('Failed to clear organization:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}
