'use server';

import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {getCurrentUserId} from '@/lib/auth';

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

export async function createProjectAction(formData: FormData) {
  const projectName = formData.get('projectName') as string;
  const userId = await getCurrentUserId();

  if (!projectName || !userId) {
    return {error: 'Project name is required and user must be logged in.'};
  }

  try {
    const projectId = uuidv4();
    const createdAt = new Date().toISOString();
    
    const userFolderPath = path.join(process.cwd(), 'src', 'database', userId);
    const projectFolderPath = path.join(userFolderPath, projectId);
    const projectsCsvPath = path.join(userFolderPath, 'projects.csv');
    
    // 1. Create the user and project folders
    await fs.mkdir(projectFolderPath, {recursive: true});

    // 2. Append project to projects.csv
    const header = 'project_id,user_id,display_name,created_at';
    const newProjectCsvRow = `${projectId},${userId},"${projectName}",${createdAt}`;

    const projectsFileExists = await fileExists(projectsCsvPath);
    
    if (projectsFileExists) {
        // Append to existing file
        await fs.appendFile(projectsCsvPath, `\n${newProjectCsvRow}`, 'utf8');
    } else {
        // Create new file with header
        await fs.writeFile(projectsCsvPath, `${header}\n${newProjectCsvRow}`, 'utf8');
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
