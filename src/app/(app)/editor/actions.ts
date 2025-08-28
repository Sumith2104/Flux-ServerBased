
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function addRowAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableName = formData.get('tableName') as string;
  const columnsString = formData.get('columns') as string;

  const userId = await getCurrentUserId();

  if (!projectId || !tableName || !userId || !columnsString) {
    return { error: 'Missing required fields.' };
  }

  const columns: { column_name: string; data_type: string }[] = JSON.parse(columnsString);

  try {
    const dataFilePath = path.join(
      process.cwd(),
      'src',
      'database',
      userId,
      projectId,
      `${tableName}.csv`
    );

    // Construct the new row, ensuring values are in the correct order
    const newRowValues = columns.map(col => {
        let value: string;
        if (col.data_type === 'gen_random_uuid()') {
            value = uuidv4();
        } else {
            value = formData.get(col.column_name) as string;
        }

        // Basic CSV escaping: if value contains comma, newline or double quote, wrap it in double quotes.
        // Also, double up any existing double quotes.
        if (value && /[",\n]/.test(value)) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
    });
    
    const newRow = '\n' + newRowValues.join(',');

    await fs.appendFile(dataFilePath, newRow, 'utf8');

    // Revalidate the editor page to show the new data
    revalidatePath(`/editor?tableId=.*&tableName=${tableName}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to add row:', error);
    return { error: `An unexpected error occurred: ${(error as Error).message}` };
  }
}
