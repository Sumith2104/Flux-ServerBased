
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { type Constraint } from '@/lib/data';

// Helper function to validate user ownership
async function canUserModify(userId: string | null, projectId: string) {
    if (!userId) return false;
    const project = await prisma.project.count({
        where: { id: projectId, userId },
    });
    return project > 0;
}


export async function addRowAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;

  if (!projectId || !tableId || !tableName) {
    return { success: false, error: 'Missing required fields.' };
  }

  try {
    const columns = await prisma.column.findMany({ where: { tableId } });
    const rowData: { [key: string]: any } = {};

    for (const col of columns) {
        if (formData.has(col.name)) {
             let value = formData.get(col.name) as string;
             // Simple type coercion based on schema
             if (col.dataType === 'number' && value) {
                 rowData[col.name] = parseFloat(value);
             } else if (col.dataType === 'boolean') {
                 rowData[col.name] = value === 'true';
             } else {
                 rowData[col.name] = value;
             }
        }
    }
    
    await prisma.row.create({
        data: {
            tableId: tableId,
            data: rowData,
        }
    });

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return { success: true };

  } catch (error) {
    console.error('Failed to add row:', error);
    return { success: false, error: `An unexpected error occurred: ${(error as Error).message}` };
  }
}


export async function editRowAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const rowId = formData.get('rowId') as string;
  
  if (!projectId || !tableId || !tableName || !rowId) {
    return { success: false, error: 'Missing required fields for editing.' };
  }

  try {
    const columns = await prisma.column.findMany({ where: { tableId } });
    const rowData: { [key: string]: any } = {};

     for (const col of columns) {
        if (formData.has(col.name)) {
             let value = formData.get(col.name) as string;
             if (col.dataType === 'number' && value) {
                 rowData[col.name] = parseFloat(value) || null;
             } else if (col.dataType === 'boolean') {
                 rowData[col.name] = value === 'true';
             } else {
                 rowData[col.name] = value;
             }
        }
    }

    await prisma.row.update({
        where: { id: rowId },
        data: {
            data: rowData,
        }
    });
    
    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to edit row:', error);
    return { success: false, error: `An unexpected error occurred: ${(error as Error).message}` };
  }
}


export async function deleteRowAction(projectId: string, tableId: string, tableName: string, rowIds: string[]) {
    if (!projectId || !tableName || !rowIds || rowIds.length === 0) {
        return { success: false, error: 'Missing required fields for deletion.' };
    }

    try {
        const { count } = await prisma.row.deleteMany({
            where: {
                id: { in: rowIds },
                tableId: tableId,
            }
        });

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true, deletedCount: count };

    } catch (error) {
        console.error('Failed to delete row(s):', error);
        return { success: false, error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}


export async function addColumnAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  const columnName = formData.get('columnName') as string;
  const columnType = formData.get('columnType') as string;

  if (!projectId || !tableId || !tableName || !columnName || !columnType) {
    return { success: false, error: 'Missing required fields.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(columnName)) {
    return { success: false, error: 'Column name can only contain letters, numbers, and underscores.' };
  }
  
  try {
    await prisma.column.create({
        data: {
            name: columnName,
            dataType: columnType,
            tableId: tableId,
        }
    });

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return { success: true };

  } catch (error: any) {
    console.error('Failed to add column:', error);
     if (error.code === 'P2002') {
        return { success: false, error: `A column with the name '${columnName}' already exists in this table.` };
    }
    return { success: false, error: `An unexpected error occurred: ${error.message}` };
  }
}


export async function editColumnAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const tableName = formData.get('tableName') as string;
    const columnId = formData.get('columnId') as string;
    const newColumnName = formData.get('newColumnName') as string;

    if (!projectId || !tableId || !tableName || !columnId || !newColumnName) {
        return { success: false, error: 'Missing required fields.' };
    }
     if (newColumnName.toLowerCase() === 'id') {
        return { success: false, error: "The 'id' column cannot be renamed." };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newColumnName)) {
        return { success: false, error: 'Column name can only contain letters, numbers, and underscores.' };
    }

    try {
        await prisma.column.update({
            where: { id: columnId },
            data: { name: newColumnName },
        });

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };
    } catch (error: any) {
        console.error('Failed to edit column:', error);
         if (error.code === 'P2002') {
            return { success: false, error: `A column with the name '${newColumnName}' already exists in this table.` };
        }
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}


export async function deleteColumnAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const tableName = formData.get('tableName') as string;
    const columnId = formData.get('columnId') as string;
    const columnName = formData.get('columnName') as string;
    
    if (!projectId || !tableId || !tableName || !columnId || !columnName) {
        return { success: false, error: 'Missing required fields.' };
    }

    if (columnName.toLowerCase() === 'id') {
        return { success: false, error: "The 'id' column cannot be deleted." };
    }

    try {
        // We might need to handle data migration here in a real app (e.g., removing the key from all JSONB data in rows)
        // For now, we just delete the column definition. The data in the `rows` table will remain but won't be shown or used.
        await prisma.column.delete({
            where: { id: columnId }
        });
        
        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete column:', error);
        return { success: false, error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}


export async function addConstraintAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const type = formData.get('type') as Constraint['type'];
    const columnNames = formData.get('columnNames') as string;

    if (!projectId || !tableId || !type || !columnNames) {
        return { success: false, error: 'Missing required fields.' };
    }

    try {
        const data: any = {
            tableId: tableId,
            type: type,
            columnNames: columnNames,
        };

        if (type === 'FOREIGN_KEY') {
            const refTableId = formData.get('referencedTableId') as string;
            const refColNames = formData.get('referencedColumnNames') as string;
            const onDelete = formData.get('onDelete');
            if (!refTableId || !refColNames || !onDelete) {
                return { success: false, error: 'Missing foreign key-specific fields.' };
            }
            data.referencedTableId = refTableId;
            data.referencedColumnNames = refColNames;
            data.onDelete = onDelete as Constraint['onDelete'];
        }

        const newConstraint = await prisma.constraint.create({ data });

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${formData.get('tableName')}`);
        return { success: true, constraint: newConstraint };

    } catch (error: any) {
        console.error('Failed to add constraint:', error);
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}

export async function deleteConstraintAction(formData: FormData) {
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const tableName = formData.get('tableName') as string;
    const constraintId = formData.get('constraintId') as string;

    if (!projectId || !tableId || !tableName || !constraintId) {
        return { success: false, error: 'Missing required fields.' };
    }
    
    try {
        await prisma.constraint.delete({ where: { id: constraintId } });

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to delete constraint:', error);
        return { success: false, error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}


export async function deleteTableAction(projectId: string, tableId: string, tableName: string) {
    if (!projectId || !tableId || !tableName) {
        return { success: false, error: 'Missing required fields for table deletion.' };
    }

    try {
        // Prisma's cascading delete will handle related columns, rows, and constraints
        await prisma.table.delete({
            where: { id: tableId }
        });
        
        revalidatePath(`/dashboard?projectId=${projectId}`);
        revalidatePath(`/editor?projectId=${projectId}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to delete table:', error);
        return { success: false, error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}
