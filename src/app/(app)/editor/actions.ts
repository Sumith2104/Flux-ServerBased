

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

async function readCsvFile(filePath: string): Promise<string[][]> {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return data.trim().split('\n').map(row => row.split(','));
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeCsvFile(filePath: string, data: string[][]): Promise<void> {
    const content = data.map(row => row.join(',')).join('\n');
    await fs.writeFile(filePath, content, 'utf8');
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

    const newRowObject: Record<string, any> = {};
    const now = new Date();
    const timeZone = 'Asia/Kolkata';

    for (const col of columns) {
        let value = formData.get(col.column_name) as string | null;
        if (col.column_name === 'id') {
            value = uuidv4();
        } else if (col.data_type === 'gen_random_uuid()' && !value) {
            value = uuidv4();
        } else if (col.data_type === 'now_date()') {
            value = now.toLocaleDateString('en-CA', { timeZone }); // YYYY-MM-DD
        } else if (col.data_type === 'now_time()') {
            value = now.toLocaleTimeString('en-GB', { hour12: false, timeZone }); // HH:MM:SS
        }
        newRowObject[col.column_name] = value || '';
    }

    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    const rows = fileContent.trim().split('\n');
    let header = rows[0] ? rows[0].split(',') : columns.map(c => c.column_name);

    if (!header.includes('id')) {
        header = ['id', ...header];
        newRowObject['id'] = uuidv4();
        
        const updatedHeader = header.join(',');
        const updatedRows = rows.slice(1).map(row => `,${row}`); 
        await fs.writeFile(dataFilePath, [updatedHeader, ...updatedRows].join('\n'), 'utf8');
    }

    const orderedValues = header.map(h => {
        const value = newRowObject[h];
        if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
        }
        return value;
    });


    const newRowCsv = `\n${orderedValues.join(',')}`;
    await fs.appendFile(dataFilePath, newRowCsv, 'utf8');

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return {success: true};
  } catch (error) {
    console.error('Failed to add row:', error);
    return {error: `An unexpected error occurred: ${(error as Error).message}`};
  }
}

export async function editRowAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const rowId = formData.get('rowId') as string;
  const userId = await getCurrentUserId();
  
  if (!projectId || !tableName || !userId || !rowId) {
    return {error: 'Missing required fields for editing.'};
  }

  try {
    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);

    if (!(await fileExists(dataFilePath))) {
        return { error: `Data file for table '${tableName}' not found.` };
    }

    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    const rows = fileContent.trim().split('\n');
    const header = rows[0].split(',');
    const idColumnIndex = header.indexOf('id');
    
    if (idColumnIndex === -1) {
      return {error: "Cannot edit row: 'id' column not found."};
    }

    const columns = await getColumnsForTable(projectId, tableId);
    
    const updatedRows = rows.map((row, index) => {
        if (index === 0) return row; // Keep header as is

        const values = row.split(',');
        if (values[idColumnIndex] === rowId) {
            const newValues = header.map(colName => {
                if (colName === 'id') {
                    return rowId;
                }
                const newValue = formData.get(colName) as string | null;
                const formattedValue = (newValue && newValue.includes(',')) ? `"${newValue}"` : newValue;
                return formattedValue || '';
            });
            return newValues.join(',');
        }
        return row;
    });

    const newContent = updatedRows.join('\n');
    await fs.writeFile(dataFilePath, newContent, 'utf8');

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return {success: true};
  } catch (error) {
    console.error('Failed to edit row:', error);
    return {error: `An unexpected error occurred: ${(error as Error).message}`};
  }
}


export async function deleteRowAction(projectId: string, tableId: string, tableName: string, rowId: string) {
    const userId = await getCurrentUserId();
    if (!projectId || !tableName || !userId || !rowId) {
        return { error: 'Missing required fields for deletion.' };
    }

    try {
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
        const dataFilePath = path.join(projectPath, `${tableName}.csv`);

        if (!(await fileExists(dataFilePath))) {
            return { error: `Data file for table '${tableName}' not found.` };
        }

        const fileContent = await fs.readFile(dataFilePath, 'utf8');
        const rows = fileContent.trim().split('\n');
        const header = rows[0];
        const headerCols = header.split(',');
        const idColumnIndex = headerCols.indexOf('id');

        if (idColumnIndex === -1) {
            return { error: "Cannot delete row: 'id' column not found in the data file." };
        }
        
        const rowsToKeep = rows.slice(1).filter(row => {
            const values = row.split(',');
            return values[idColumnIndex] !== rowId;
        });

        const newContent = [header, ...rowsToKeep].join('\n');
        await fs.writeFile(dataFilePath, newContent, 'utf8');

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to delete row:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}

export async function addColumnAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const columnName = formData.get('columnName') as string;
  const columnType = formData.get('columnType') as string;
  const alignment = formData.get('alignment') as string || 'left';
  const userId = await getCurrentUserId();

  if (!projectId || !tableId || !tableName || !columnName || !columnType || !userId) {
    return { error: 'Missing required fields.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(columnName)) {
    return { error: 'Column name can only contain letters, numbers, and underscores.' };
  }
  
  try {
    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
    
    // 1. Update columns.csv
    const columnsCsvPath = path.join(projectPath, 'columns.csv');
    const newColumnId = uuidv4();
    const newColumnCsvRow = `\n${newColumnId},${tableId},${columnName},${columnType},${alignment}`;
    
    const columnsFileContent = await readCsvFile(columnsCsvPath);
    if(columnsFileContent.length > 0 && columnsFileContent[0].length < 5) {
        // Old format, need to update header
        const header = 'column_id,table_id,column_name,data_type,alignment';
        const updatedContent = [header];
        const oldColumns = await getFileContent(columnsCsvPath);
        oldColumns.split('\n').slice(1).forEach(row => {
            if(row) updatedContent.push(`${row},left`);
        });
        await fs.writeFile(columnsCsvPath, updatedContent.join('\n') + newColumnCsvRow, 'utf8');
    } else {
        await fs.appendFile(columnsCsvPath, newColumnCsvRow, 'utf8');
    }


    // 2. Update the data file (e.g., users.csv)
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);
    const fileContent = await fs.readFile(dataFilePath, 'utf8');
    const rows = fileContent.trim().split('\n');
    
    if (rows.length > 0) {
      // Add column to header
      rows[0] = `${rows[0]},${columnName}`;

      // Add empty value for new column to each data row
      for (let i = 1; i < rows.length; i++) {
        rows[i] = `${rows[i]},`;
      }
      const updatedContent = rows.join('\n');
      await fs.writeFile(dataFilePath, updatedContent, 'utf8');
    } else {
        // If the file is empty, just write the new header
        await fs.writeFile(dataFilePath, columnName, 'utf8');
    }

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to add column:', error);
    return { error: `An unexpected error occurred: ${(error as Error).message}` };
  }
}


export async function deleteTableAction(projectId: string, tableId: string, tableName: string) {
    const userId = await getCurrentUserId();
    if (!projectId || !tableId || !tableName || !userId) {
        return { error: 'Missing required fields for table deletion.' };
    }

    try {
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
        
        // 1. Delete the data file (e.g., users.csv)
        const dataFilePath = path.join(projectPath, `${tableName}.csv`);
        if (await fileExists(dataFilePath)) {
            await fs.unlink(dataFilePath);
        }

        // 2. Remove table from tables.csv
        const tablesCsvPath = path.join(projectPath, 'tables.csv');
        const tablesData = await readCsvFile(tablesCsvPath);
        if(tablesData.length > 0) {
            const newTablesData = tablesData.filter(row => row[0] !== tableId);
            await writeCsvFile(tablesCsvPath, newTablesData);
        }

        // 3. Remove columns from columns.csv
        const columnsCsvPath = path.join(projectPath, 'columns.csv');
        const columnsData = await readCsvFile(columnsCsvPath);
        if(columnsData.length > 0) {
            const newColumnsData = columnsData.filter(row => row[1] !== tableId);
            await writeCsvFile(columnsCsvPath, newColumnsData);
        }

        revalidatePath(`/editor`);
        revalidatePath(`/dashboard`); // To update analytics
        return { success: true };

    } catch (error) {
        console.error('Failed to delete table:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}

async function getFileContent(filePath: string): Promise<string> {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return ''; 
        }
        throw error;
    }
}


export async function importCsvAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const csvContent = formData.get('csvContent') as string;
  const userId = await getCurrentUserId();

  if (!projectId || !tableId || !tableName || !csvContent || !userId) {
    return { error: 'Missing required fields for CSV import.' };
  }

  try {
    const tableColumns = await getColumnsForTable(projectId, tableId);
    const expectedHeader = tableColumns.map(c => c.column_name);

    const rows = csvContent.trim().split('\n');
    const csvHeader = rows[0].trim().split(',').map(h => h.replace(/^"|"$/g, ''));

    // Column compatibility check
    if (JSON.stringify(csvHeader) !== JSON.stringify(expectedHeader)) {
      return { 
        error: `CSV header does not match table structure. Expected: ${expectedHeader.join(',')}` 
      };
    }
    
    const dataRows = rows.slice(1);
    const now = new Date();
    const timeZone = 'Asia/Kolkata';

    const processedRows = dataRows.map((row, rowIndex) => {
        const values = row.split(',');
        if (values.length !== expectedHeader.length) {
            throw new Error(`Row ${rowIndex + 2} has an incorrect number of columns. Expected ${expectedHeader.length}, got ${values.length}.`);
        }

        const newRow = values.map((val, colIndex) => {
            const column = tableColumns[colIndex];
            const value = val.trim();

            // Data value validation
            if (column.data_type === 'number' && value && isNaN(Number(value))) {
                throw new Error(`Invalid number format in row ${rowIndex + 2}, column '${column.column_name}': "${value}"`);
            }
            if (column.data_type === 'date' && value && isNaN(Date.parse(value))) {
                throw new Error(`Invalid date format in row ${rowIndex + 2}, column '${column.column_name}': "${value}"`);
            }

            // Auto-generate values for special types if the CSV value is empty
            if (!value) {
                if (column.data_type === 'gen_random_uuid()') return uuidv4();
                if (column.data_type === 'now_date()') return now.toLocaleDateString('en-CA', { timeZone });
                if (column.data_type === 'now_time()') return now.toLocaleTimeString('en-GB', { hour12: false, timeZone });
            }
            
            // Handle commas within values by quoting
            return value.includes(',') ? `"${value}"` : value;
        });

        return newRow.join(',');
    });

    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);
    
    await fs.appendFile(dataFilePath, '\n' + processedRows.join('\n'), 'utf8');

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return { success: true, importedCount: processedRows.length };

  } catch (error) {
    console.error('Failed to import CSV:', error);
    return { error: `An unexpected error occurred: ${(error as Error).message}` };
  }
}
