'use server';

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

function sanitizeForUrl(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function createProjectAction(formData: FormData) {
  const projectName = formData.get('projectName') as string;
  const userId = formData.get('userId') as string; // This would come from session in a real app

  if (!projectName || !userId) {
    return { error: 'Project name and user ID are required.' };
  }

  try {
    const projectId = sanitizeForUrl(projectName);
    const createdAt = new Date().toISOString();
    const newProjectCsvRow = `\n${projectId},${userId},"${projectName}",${createdAt}`;

    const userFolderPath = path.join(process.cwd(), 'src', 'database', userId);
    const projectFolderPath = path.join(userFolderPath, projectId);
    const projectsCsvPath = path.join(userFolderPath, 'projects.csv');

    // 1. Create project folder
    await fs.mkdir(projectFolderPath, { recursive: true });

    // 2. Append project to projects.csv
    try {
      await fs.appendFile(projectsCsvPath, newProjectCsvRow, 'utf8');
    } catch (error) {
      // If file doesn't exist, create it with header
      const header = 'project_id,user_id,display_name,created_at';
      await fs.writeFile(projectsCsvPath, header + newProjectCsvRow, 'utf8');
    }

    return { success: true, projectId };
  } catch (error) {
    console.error('Project creation failed:', error);
    return { error: 'An unexpected error occurred.' };
  }
}
