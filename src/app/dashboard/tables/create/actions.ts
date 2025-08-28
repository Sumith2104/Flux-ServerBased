
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

async function getFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return ''; // File doesn't exist, return empty string
        }
        throw error;
    }
}

export async function createTableAction(formData: FormData) {
  const tableName = formData.get('tableName') as string;
  const description = formData.get('description') as string;
  const projectId = formData.get('projectId') as string;
  const columnsStr = formData.get('columns') as string;
  const csvContent = formData.get('csvContent') as string | null;
  const userId = await getCurrentUserId();

  if (!tableName || !projectId || !userId || !columnsStr) {
    return {error: 'Missing required fields.'};
  }

  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return { error: 'Table name can only contain letters, numbers, and underscores.' };
  }

  try {
    const tableId = uuidv4();
    const createdAt = new Date().toISOString();
    const projectPath = path.join(
      process.cwd(),
      'src',
      'database',
      userId,
      projectId
    );
    await fs.mkdir(projectPath, {recursive: true});

    // 1. Update tables.csv
    const tablesCsvPath = path.join(projectPath, 'tables.csv');
    const newTableCsvRow = `\n${tableId},${projectId},"${tableName}","${description || ''}",${createdAt},${createdAt}`;
    
    const tablesCsvContent = await getFileContent(tablesCsvPath);
    if (!tablesCsvContent.trim()) {
        const header = 'table_id,project_id,table_name,description,created_at,updated_at';
        await fs.writeFile(tablesCsvPath, header + newTableCsvRow, 'utf8');
    } else {
        await fs.appendFile(tablesCsvPath, newTableCsvRow, 'utf8');
    }

    const columns = columnsStr.split(',').map(c => {
      const [name, type, alignment] = c.split(':');
      if (!name || !type || !['text', 'number', 'date', 'gen_random_uuid()', 'now_date()', 'now_time()'].includes(type.trim())) {
          throw new Error(`Invalid column definition: ${c}`);
      }
      return {id: uuidv4(), name: name.trim(), type: type.trim(), alignment: alignment.trim() || 'left'};
    });

    if (columns.length === 0) {
        return { error: 'You must define at least one column.' };
    }

    // 2. Update columns.csv
    const columnsCsvPath = path.join(projectPath, 'columns.csv');
    let newColumnsCsvRows = '';
    for (const col of columns) {
      newColumnsCsvRows += `\n${col.id},${tableId},${col.name},${col.type},${col.alignment}`;
    }

    const columnsCsvContent = await getFileContent(columnsCsvPath);
    if (!columnsCsvContent.trim()) {
        const header = 'column_id,table_id,column_name,data_type,alignment';
        await fs.writeFile(columnsCsvPath, header + newColumnsCsvRows, 'utf8');
    } else {
        await fs.appendFile(columnsCsvPath, newColumnsCsvRows, 'utf8');
    }
    

    // 3. Create the data file (e.g., users.csv)
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);
    if (await fileExists(dataFilePath)) {
        return { error: `A data file named '${tableName}.csv' already exists.` };
    }
    
    if (csvContent) {
        // If CSV content is provided, write it directly to the file.
        await fs.writeFile(dataFilePath, csvContent, 'utf8');
    } else {
        // Otherwise, create an empty file with just the header.
        const dataFileHeader = columns.map(c => c.name).join(',');
        await fs.writeFile(dataFilePath, dataFileHeader, 'utf8');
    }

    return {success: true, tableId};
  } catch (error) {
    console.error('Table creation failed:', error);
    return {error: `An unexpected error occurred: ${(error as Error).message}`};
  }
}
