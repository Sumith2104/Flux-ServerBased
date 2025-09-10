

'use server';

import {v4 as uuidv4} from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import {getCurrentUserId} from '@/lib/auth';
import {revalidatePath} from 'next/cache';
import { getColumnsForTable, getConstraintsForTable, getTableData, Constraint, getConstraintsForProject, Table, getTablesForProject, Column } from '@/lib/data';

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
        return data.trim().split('\n').map(row => {
            // This regex handles comma-separated values, including quoted strings that contain commas
            return (row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(v => v.trim().replace(/^"|"$/g, ''));
        });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeCsvFile(filePath: string, data: string[][]): Promise<void> {
    const content = data.map(row => row.map(cell => {
        // Add quotes if the cell contains a comma
        return cell.includes(',') ? `"${cell}"` : cell;
    }).join(',')).join('\n');
    await fs.writeFile(filePath, content, 'utf8');
}

// --- Constraint Validation Helpers ---

async function validatePrimaryKey(projectId: string, tableId: string, newRow: Record<string, any>, existingRows: Record<string, any>[], rowIdToExclude?: string) {
    const pkConstraints = (await getConstraintsForTable(projectId, tableId)).filter(c => c.type === 'PRIMARY KEY');
    if (pkConstraints.length === 0) return;

    for (const constraint of pkConstraints) {
        const pkColumns = constraint.column_names.split(',');
        const pkValue = pkColumns.map(col => newRow[col]).join('-');

        // Check for null/empty values
        for (const col of pkColumns) {
            if (newRow[col] === null || newRow[col] === undefined || newRow[col] === '') {
                throw new Error(`Primary key violation: Column '${col}' cannot be null.`);
            }
        }
        
        // Check for uniqueness
        const duplicate = existingRows.some(row => {
            // If editing, exclude the current row from the check
            if (rowIdToExclude && row.id === rowIdToExclude) {
                return false;
            }
            const existingPkValue = pkColumns.map(col => row[col]).join('-');
            return existingPkValue === pkValue;
        });

        if (duplicate) {
            throw new Error(`Primary key violation: A row with the value(s) '${pkValue.replace(/-/g, ', ')}' for column(s) '${constraint.column_names}' already exists.`);
        }
    }
}

async function validateForeignKey(projectId: string, tableId: string, newRow: Record<string, any>) {
    const fkConstraints = (await getConstraintsForTable(projectId, tableId)).filter(c => c.type === 'FOREIGN KEY');

    if (fkConstraints.length === 0) return;
    
    for (const constraint of fkConstraints) {
        const fkColumns = constraint.column_names.split(',');
        const fkValue = fkColumns.map(col => newRow[col]).join('-');

        // Skip validation if FK value is null or empty for any column in the key
        if (!fkValue || fkColumns.some(col => !newRow[col])) continue;

        const referencedTable = (await getTablesForProject(projectId)).find(t => t.table_id === constraint.referenced_table_id);
        if (!referencedTable) throw new Error(`Internal error: Referenced table with ID '${constraint.referenced_table_id}' not found.`);
        
        const { rows: referencedData } = await getTableData(projectId, referencedTable.table_name, 1, 100000); // Note: Inefficient for large tables
        const referencedPkColumns = (constraint.referenced_column_names || '').split(',');

        const referenceExists = referencedData.some(refRow => {
            const refPkValue = referencedPkColumns.map(col => refRow[col]).join('-');
            return refPkValue === fkValue;
        });

        if (!referenceExists) {
            throw new Error(`Foreign key violation on table '${referencedTable.table_name}': The value '${fkValue.replace(/-/g, ', ')}' for column '${constraint.column_names}' does not exist in the referenced table.`);
        }
    }
}

export async function addRowAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const userId = await getCurrentUserId();
  
  if (!projectId || !tableName || !userId || !tableId) {
    return {error: 'Missing required fields.'};
  }

  try {
    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);

    const { rows: existingRows } = await getTableData(projectId, tableName, 1, 100000);
    const columns = await getColumnsForTable(projectId, tableId);
    if (!columns.length) return { error: 'No columns found for this table.' };

    const newRowObject: Record<string, any> = {};
    const now = new Date();

    for (const col of columns) {
        let value = formData.get(col.column_name) as string | null;
        if (col.data_type === 'gen_random_uuid()' && !value) {
            value = uuidv4();
        } else if (col.data_type === 'now_date()') {
            value = now.toLocaleDateString('en-CA');
        } else if (col.data_type === 'now_time()') {
            value = now.toLocaleTimeString('en-GB', { hour12: false });
        }
        newRowObject[col.column_name] = value || '';
    }
    
    // Add id if it doesn't exist
    if (!newRowObject['id']) {
        newRowObject['id'] = uuidv4();
    }
    
    await validatePrimaryKey(projectId, tableId, newRowObject, existingRows);
    await validateForeignKey(projectId, tableId, newRowObject);

    const data = await readCsvFile(dataFilePath);
    const header = data.length > 0 ? data[0] : columns.map(c => c.column_name);
    
    // Ensure header exists if file is empty
    if (data.length === 0) {
        data.push(header);
    }

    const newRowValues = header.map(h => newRowObject[h] || '');
    
    await writeCsvFile(dataFilePath, [...data, newRowValues]);

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

    const { rows: existingRows } = await getTableData(projectId, tableName, 1, 100000);
    
    const newRowObject: Record<string, any> = { id: rowId };
    const columns = await getColumnsForTable(projectId, tableId);
    columns.forEach(col => {
        if(col.column_name !== 'id') {
            const value = formData.get(col.column_name) as string | null;
            newRowObject[col.column_name] = value || '';
        } else {
             newRowObject['id'] = rowId;
        }
    });
    
    await validatePrimaryKey(projectId, tableId, newRowObject, existingRows, rowId);
    await validateForeignKey(projectId, tableId, newRowObject);

    const data = await readCsvFile(dataFilePath);
    const header = data[0];
    const idColumnIndex = header.indexOf('id');
    if (idColumnIndex === -1) return {error: "Cannot edit row: 'id' column not found."};

    const updatedData = data.map((row, index) => {
        if (index === 0) return row; // Keep header
        if (row[idColumnIndex] === rowId) {
            return header.map(colName => newRowObject[colName] || '');
        }
        return row;
    });

    await writeCsvFile(dataFilePath, updatedData);

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return {success: true};
  } catch (error) {
    console.error('Failed to edit row:', error);
    return {error: `An unexpected error occurred: ${(error as Error).message}`};
  }
}

async function handleCascadingDeletes(projectId: string, tableId: string, rowIdsToDelete: Set<string>) {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);

    const allTables = await getTablesForProject(projectId);
    const allConstraints = await getConstraintsForProject(projectId);
    const fkConstraints = allConstraints.filter(c => c.type === 'FOREIGN KEY' && c.referenced_table_id === tableId);

    for (const constraint of fkConstraints) {
        const childTable = allTables.find(t => t.table_id === constraint.table_id);
        if (!childTable) continue;
        
        const childDataPath = path.join(projectPath, `${childTable.table_name}.csv`);
        const childData = await readCsvFile(childDataPath);
        if (childData.length < 2) continue; // No data to process

        const childHeader = childData[0];
        const childFkColNames = (constraint.column_names || '').split(',');
        // For simplicity, we assume the referenced column is the parent's 'id' which is what our UI supports.
        // A more robust solution would use `constraint.referenced_column_names`
        const parentIdIndex = 0; // Assuming 'id' is the first column for simplicity, which isn't robust.
                                 // Let's find the actual index.
        const parentTableColumns = await getColumnsForTable(projectId, tableId);
        const parentTableData = await readCsvFile(path.join(projectPath, `${(allTables.find(t=>t.table_id === tableId))?.table_name}.csv`));
        const parentHeader = parentTableData.length > 0 ? parentTableData[0] : parentTableColumns.map(c=>c.column_name);

        const parentRefColName = constraint.referenced_column_names!;
        const parentPkIndex = parentHeader.indexOf(parentRefColName);


        const childFkColIndex = childHeader.indexOf(childFkColNames[0]); // Assuming single column FK for now

        if (childFkColIndex === -1) continue;

        if (constraint.on_delete === 'CASCADE') {
             const rowsToKeep = childData.filter((row, index) => {
                if(index === 0) return true; // header
                const fkValue = row[childFkColIndex];
                return !rowIdsToDelete.has(fkValue);
            });
            await writeCsvFile(childDataPath, rowsToKeep);
        } else if (constraint.on_delete === 'SET NULL') {
            const updatedData = childData.map((row, index) => {
                if (index === 0) return row; // header
                const fkValue = row[childFkColIndex];
                 if (rowIdsToDelete.has(fkValue)) {
                    row[childFkColIndex] = ''; // Set to null/empty string
                }
                return row;
            });
            await writeCsvFile(childDataPath, updatedData);
        } else if (constraint.on_delete === 'RESTRICT') {
            const hasDependency = childData.slice(1).some(row => {
                 const fkValue = row[childFkColIndex];
                 return rowIdsToDelete.has(fkValue);
            });
             if (hasDependency) {
                throw new Error(`Cannot delete from table '${(allTables.find(t=>t.table_id === tableId))?.table_name}'. It is referenced by table '${childTable.table_name}'.`);
            }
        }
    }
}

export async function deleteRowAction(projectId: string, tableId: string, tableName: string, rowIds: string[]) {
    const userId = await getCurrentUserId();
    if (!projectId || !tableName || !userId || !rowIds || rowIds.length === 0) {
        return { error: 'Missing required fields for deletion.' };
    }

    try {
        const rowIdsToDelete = new Set(rowIds);
        
        await handleCascadingDeletes(projectId, tableId, rowIdsToDelete);
        
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
        const dataFilePath = path.join(projectPath, `${tableName}.csv`);

        const data = await readCsvFile(dataFilePath);
        if (data.length < 1) return { success: true };

        const header = data[0];
        const idColumnIndex = header.indexOf('id');
        if (idColumnIndex === -1) return { error: "Cannot delete row(s): 'id' column not found." };
        
        const rowsToKeep = data.filter((row, index) => {
            if (index === 0) return true; // Keep header
            return !rowIdsToDelete.has(row[idColumnIndex]);
        });
        
        await writeCsvFile(dataFilePath, rowsToKeep);

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true, deletedCount: rowIds.length };

    } catch (error) {
        console.error('Failed to delete row(s):', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}

export async function addColumnAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const columnName = formData.get('columnName') as string;
  const columnType = formData.get('columnType') as string;
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
    const newColumnCsvRow = `\n${newColumnId},${tableId},${columnName},${columnType}`;
    await fs.appendFile(columnsCsvPath, newColumnCsvRow, 'utf8');


    // 2. Update the data file (e.g., users.csv)
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);
    const data = await readCsvFile(dataFilePath);

    if (data.length > 0) {
      data[0].push(columnName); // Add to header
      for (let i = 1; i < data.length; i++) {
        data[i].push(''); // Add empty value for new column
      }
      await writeCsvFile(dataFilePath, data);
    } else {
        await writeCsvFile(dataFilePath, [[columnName]]);
    }

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to add column:', error);
    return { error: `An unexpected error occurred: ${(error as Error).message}` };
  }
}

export async function editColumnAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const tableName = formData.get('tableName') as string;
    const columnId = formData.get('columnId') as string;
    const oldColumnName = formData.get('oldColumnName') as string;
    const newColumnName = formData.get('newColumnName') as string;
    const userId = await getCurrentUserId();

    if (!projectId || !tableId || !tableName || !columnId || !oldColumnName || !newColumnName || !userId) {
        return { error: 'Missing required fields.' };
    }
     if (oldColumnName === 'id') {
        return { error: "The 'id' column cannot be renamed." };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newColumnName)) {
        return { error: 'Column name can only contain letters, numbers, and underscores.' };
    }

    try {
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
        
        // 1. Update columns.csv
        const columnsCsvPath = path.join(projectPath, 'columns.csv');
        const columnsData = await readCsvFile(columnsCsvPath);
        const colIdIndex = columnsData[0].indexOf('column_id');
        const colNameIndex = columnsData[0].indexOf('column_name');
        
        const newColumnsData = columnsData.map(row => {
            if (row[colIdIndex] === columnId) {
                row[colNameIndex] = newColumnName;
            }
            return row;
        });
        await writeCsvFile(columnsCsvPath, newColumnsData);
        
        // 2. Update data file header
        const dataFilePath = path.join(projectPath, `${tableName}.csv`);
        const data = await readCsvFile(dataFilePath);

        if (data.length > 0) {
            const headerIndex = data[0].indexOf(oldColumnName);
            if (headerIndex > -1) {
                data[0][headerIndex] = newColumnName;
                await writeCsvFile(dataFilePath, data);
            }
        }
        
        // 3. Update constraints.csv
        const constraintsCsvPath = path.join(projectPath, 'constraints.csv');
         if (await fileExists(constraintsCsvPath)) {
            let constraintsData = await readCsvFile(constraintsCsvPath);
            const tableIdIndex = constraintsData[0].indexOf('table_id');
            const colNamesIndex = constraintsData[0].indexOf('column_names');
            
            const newConstraintsData = constraintsData.map(row => {
                 if (row[tableIdIndex] === tableId) {
                    const columns = row[colNamesIndex].split(',');
                    const updatedColumns = columns.map(c => c === oldColumnName ? newColumnName : c).join(',');
                    row[colNamesIndex] = updatedColumns;
                }
                return row;
            });
            await writeCsvFile(constraintsCsvPath, newConstraintsData);
        }

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to edit column:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}


export async function deleteColumnAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const tableName = formData.get('tableName') as string;
    const columnId = formData.get('columnId') as string;
    const columnName = formData.get('columnName') as string;
    const userId = await getCurrentUserId();
    
    if (!projectId || !tableId || !tableName || !columnId || !columnName || !userId) {
        return { error: 'Missing required fields.' };
    }

    if (columnName === 'id') {
        return { error: "The 'id' column cannot be deleted." };
    }

    try {
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);

        // Constraint check
        const constraints = await getConstraintsForProject(projectId);
        const isUsedInConstraint = constraints.some(c => c.table_id === tableId && c.column_names.split(',').includes(columnName));
        if (isUsedInConstraint) {
            return { error: `Cannot delete column '${columnName}' because it is used in a primary or foreign key constraint. Please remove the constraint first.` };
        }

        // 1. Update columns.csv
        const columnsCsvPath = path.join(projectPath, 'columns.csv');
        const columnsData = await readCsvFile(columnsCsvPath);
        const colIdIndex = columnsData[0].indexOf('column_id');
        const newColumnsData = columnsData.filter((row, i) => i === 0 || row[colIdIndex] !== columnId);
        await writeCsvFile(columnsCsvPath, newColumnsData);
        
        // 2. Update data file (remove column from header and all rows)
        const dataFilePath = path.join(projectPath, `${tableName}.csv`);
        const data = await readCsvFile(dataFilePath);

        if (data.length > 0) {
            const headerIndex = data[0].indexOf(columnName);
            if (headerIndex > -1) {
                const newData = data.map(row => {
                    row.splice(headerIndex, 1);
                    return row;
                });
                await writeCsvFile(dataFilePath, newData);
            }
        }
        
        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete column:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}


export async function addConstraintAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const type = formData.get('type') as Constraint['type'];
    const columnNames = formData.get('columnNames') as string;
    const userId = await getCurrentUserId();

    if (!projectId || !tableId || !type || !columnNames || !userId) {
        return { error: 'Missing required fields.' };
    }

    try {
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
        const constraintsCsvPath = path.join(projectPath, 'constraints.csv');

        const constraintId = uuidv4();
        let newConstraintCsvRow = `\n${constraintId},${tableId},${type},"${columnNames}"`;

        if (type === 'FOREIGN KEY') {
            const refTableId = formData.get('referencedTableId') as string;
            const refColNames = formData.get('referencedColumnNames') as string;
            const onDelete = formData.get('onDelete') as string;
            if (!refTableId || !refColNames || !onDelete) {
                return { error: 'Missing foreign key-specific fields.' };
            }
            newConstraintCsvRow += `,"${refTableId}","${refColNames}","${onDelete}",`;
        } else {
            newConstraintCsvRow += ',,,,'; // Add empty values for FK fields
        }

        const constraintsFileExists = await fileExists(constraintsCsvPath);
        if (constraintsFileExists) {
            await fs.appendFile(constraintsCsvPath, newConstraintCsvRow, 'utf8');
        } else {
            const header = 'constraint_id,table_id,type,column_names,referenced_table_id,referenced_column_names,on_delete,on_update';
            await fs.writeFile(constraintsCsvPath, header + newConstraintCsvRow, 'utf8');
        }

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${formData.get('tableName')}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to add constraint:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}

export async function deleteConstraintAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const tableName = formData.get('tableName') as string;
    const constraintId = formData.get('constraintId') as string;
    const userId = await getCurrentUserId();

    if (!projectId || !tableId || !tableName || !constraintId || !userId) {
        return { error: 'Missing required fields.' };
    }
    
    try {
        const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
        const constraintsCsvPath = path.join(projectPath, 'constraints.csv');

        const constraintsData = await readCsvFile(constraintsCsvPath);
        if (constraintsData.length === 0) return { success: true };

        const constraintIdIndex = constraintsData[0].indexOf('constraint_id');
        const newConstraintsData = constraintsData.filter((row, i) => i === 0 || row[constraintIdIndex] !== constraintId);
        
        await writeCsvFile(constraintsCsvPath, newConstraintsData);

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to delete constraint:', error);
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
        let tablesData = await readCsvFile(tablesCsvPath);
        if(tablesData.length > 0) {
            const tableIdIndex = tablesData[0].indexOf('table_id');
            const newTablesData = tablesData.filter((row, i) => i === 0 || row[tableIdIndex] !== tableId);
            await writeCsvFile(tablesCsvPath, newTablesData);
        }

        // 3. Remove columns from columns.csv
        const columnsCsvPath = path.join(projectPath, 'columns.csv');
        let columnsData = await readCsvFile(columnsCsvPath);
        if(columnsData.length > 0) {
            const tableIdIndex = columnsData[0].indexOf('table_id');
            const newColumnsData = columnsData.filter((row, i) => i === 0 || row[tableIdIndex] !== tableId);
            await writeCsvFile(columnsCsvPath, newColumnsData);
        }

        // 4. Remove constraints from constraints.csv
        const constraintsCsvPath = path.join(projectPath, 'constraints.csv');
        if (await fileExists(constraintsCsvPath)) {
            let constraintsData = await readCsvFile(constraintsCsvPath);
            if(constraintsData.length > 0) {
                const tableIdIndex = constraintsData[0].indexOf('table_id');
                const refTableIdIndex = constraintsData[0].indexOf('referenced_table_id');
                const newConstraintsData = constraintsData.filter((row, i) => i === 0 || (row[tableIdIndex] !== tableId && row[refTableIdIndex] !== tableId));
                await writeCsvFile(constraintsCsvPath, newConstraintsData);
            }
        }


        revalidatePath(`/dashboard?projectId=${projectId}`);
        revalidatePath(`/editor?projectId=${projectId}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to delete table:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}
