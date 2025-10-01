
'use server';

import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function createProjectAction(formData: FormData) {
  const projectName = formData.get('projectName') as string;
  const userId = await getCurrentUserId();

  if (!projectName || !userId) {
    return { success: false, error: 'Project name is required and user must be logged in.' };
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: projectName,
        userId: userId,
      },
    });
    return { success: true, projectId: project.id };
  } catch (error: any) {
    console.error('Project creation failed:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'A project with this name already exists for your account.' };
    }
    return { success: false, error: 'An unexpected error occurred.' };
  }
}
