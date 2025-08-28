
'use server';

import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {getCurrentUserId} from '@/lib/auth';
import {revalidatePath} from 'next/cache';
import { getColumnsForTable } from '@/lib/data';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function addRowAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const userId = await getCurrentUserId();
  
  if (!projectId || !tableName || !userId) {
    return {error: 'Missing required fields.'};
  }

  try {
    const projectPath = path.join(
      process.cwd(),
      'src',
      'database',
      userId,
      projectId
    );
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);

    if (!(await fileExists(dataFilePath))) {
        return { error: `Data file for table '${tableName}' not found.` };
    }

    const columns = await getColumnsForTable(projectId, tableId);
    if (!columns.length) {
        return { error: 'No columns found for this table.' };
    }

    const newRowValues: string[] = [];

    for (const col of columns) {
        let value = formData.get(col.column_name) as string | null;
        if (col.data_type === 'gen_random_uuid()' && !value) {
            value = uuidv4();
        }
        
        // Basic escaping for values containing commas
        if (value && value.includes(',')) {
            newRowValues.push(`"${value}"`);
        } else {
            newRowValues.push(value || '');
        }
    }

    const newRowCsv = `\n${newRowValues.join(',')}`;
    await fs.appendFile(dataFilePath, newRowCsv, 'utf8');

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return {success: true};
  } catch (error) {
    console.error('Failed to add row:', error);
    return {error: `An unexpected error occurred: ${(error as Error).message}`};
  }
}
