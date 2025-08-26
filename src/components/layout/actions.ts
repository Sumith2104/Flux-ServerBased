'use server';

import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {getCurrentUserId} from '@/lib/auth';

function sanitizeForUrl(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Allow spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/(^-|-$)/g, '');
}

export async function createProjectAction(formData: FormData) {
  const projectName = formData.get('projectName') as string;
  const userId = await getCurrentUserId();

  if (!projectName || !userId) {
    return {error: 'Project name is required and user must be logged in.'};
  }

  try {
    const projectId = sanitizeForUrl(projectName);
    const createdAt = new Date().toISOString();
    
    const userFolderPath = path.join(process.cwd(), 'src', 'database', userId);
    const projectFolderPath = path.join(userFolderPath, projectId);
    const projectsCsvPath = path.join(userFolderPath, 'projects.csv');
    
    // 1. Create the project's folder
    await fs.mkdir(projectFolderPath, {recursive: true});

    // 2. Append project to projects.csv
    const newProjectCsvRow = `\n${projectId},${userId},"${projectName}",${createdAt}`;
    try {
      await fs.appendFile(projectsCsvPath, newProjectCsvRow, 'utf8');
    } catch (error) {
      // If file doesn't exist, create it with header
      const header = 'project_id,user_id,display_name,created_at';
      await fs.writeFile(projectsCsvPath, header + newProjectCsvRow, 'utf8');
    }

    return {success: true, projectId};
  } catch (error) {
    console.error('Project creation failed:', error);
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        return { error: 'A project with this name already exists.' };
    }
    return {error: 'An unexpected error occurred.'};
  }
}
