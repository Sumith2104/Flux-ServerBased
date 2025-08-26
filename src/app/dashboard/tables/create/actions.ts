'use server';

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export async function createTableAction(formData: FormData) {
    const tableName = formData.get('tableName') as string;
    const projectId = formData.get('projectId') as string;
    const userId = formData.get('userId') as string;
    const columnsStr = formData.get('columns') as string; // e.g., "id:number,name:text,email:text"

    if (!tableName || !projectId || !userId || !columnsStr) {
        return { error: 'Missing required fields.' };
    }

    try {
        const tableId = uuidv4();
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);

        // 1. Update tables.csv
        const tablesCsvPath = path.join(projectPath, 'tables.csv');
        const newTableCsvRow = `\n${tableId},${projectId},"${tableName}"`;
        try {
            await fs.appendFile(tablesCsvPath, newTableCsvRow, 'utf8');
        } catch (e) {
            const header = 'table_id,project_id,table_name';
            await fs.writeFile(tablesCsvPath, header + newTableCsvRow, 'utf8');
        }

        const columns = columnsStr.split(',').map(c => {
            const [name, type] = c.split(':');
            return { id: uuidv4(), name, type };
        });
        
        // 2. Update columns.csv
        const columnsCsvPath = path.join(projectPath, 'columns.csv');
        const columnsHeader = 'column_id,table_id,column_name,data_type';
        let newColumnsCsvRows = '';
        for (const col of columns) {
            newColumnsCsvRows += `\n${col.id},${tableId},${col.name},${col.type}`;
        }
        try {
            await fs.appendFile(columnsCsvPath, newColumnsCsvRows, 'utf8');
        } catch (e) {
            await fs.writeFile(columnsCsvPath, columnsHeader + newColumnsCsvRows, 'utf8');
        }

        // 3. Create the data file (e.g., customers.csv)
        const dataFilePath = path.join(projectPath, `${tableName}.csv`);
        const dataFileHeader = columns.map(c => c.name).join(',');
        await fs.writeFile(dataFilePath, dataFileHeader, 'utf8');
        
        return { success: true, tableId };
    } catch (error) {
        console.error('Table creation failed:', error);
        return { error: 'An unexpected error occurred.' };
    }
}
