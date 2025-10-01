

'use server';

import {v4 as uuidv4} from 'uuid';
import {revalidatePath} from 'next/cache';
import { getColumnsForTable, getConstraintsForTable, getTableData, Constraint, getConstraintsForProject, Table, getTablesForProject, Column } from '@/lib/data';

export async function addRowAction(formData: FormData) {
  const projectId = formData.get('projectId') as string;
  const tableId = formData.get('tableId') as string;
  const tableName = formData.get('tableName') as string;
  
  if (!projectId || !tableName || !tableId) {
    return {error: 'Missing required fields.'};
  }

  try {
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
  
  if (!projectId || !tableName || !rowId) {
    return {error: 'Missing required fields for editing.'};
  }

  try {
    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return {success: true};
  } catch (error) {
    console.error('Failed to edit row:', error);
    return {error: `An unexpected error occurred: ${(error as Error).message}`};
  }
}

export async function deleteRowAction(projectId: string, tableId: string, tableName: string, rowIds: string[]) {
    if (!projectId || !tableName || !rowIds || rowIds.length === 0) {
        return { error: 'Missing required fields for deletion.' };
    }

    try {
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

  if (!projectId || !tableId || !tableName || !columnName || !columnType) {
    return { error: 'Missing required fields.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(columnName)) {
    return { error: 'Column name can only contain letters, numbers, and underscores.' };
  }
  
  try {
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

    if (!projectId || !tableId || !tableName || !columnId || !oldColumnName || !newColumnName) {
        return { error: 'Missing required fields.' };
    }
     if (oldColumnName === 'id') {
        return { error: "The 'id' column cannot be renamed." };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newColumnName)) {
        return { error: 'Column name can only contain letters, numbers, and underscores.' };
    }

    try {
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
    
    if (!projectId || !tableId || !tableName || !columnId || !columnName) {
        return { error: 'Missing required fields.' };
    }

    if (columnName === 'id') {
        return { error: "The 'id' column cannot be deleted." };
    }

    try {
        // Constraint check
        const constraints = await getConstraintsForProject(projectId);
        const isUsedInConstraint = constraints.some(c => c.table_id === tableId && c.column_names.split(',').includes(columnName));
        if (isUsedInConstraint) {
            return { error: `Cannot delete column '${columnName}' because it is used in a primary or foreign key constraint. Please remove the constraint first.` };
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

    if (!projectId || !tableId || !type || !columnNames) {
        return { error: 'Missing required fields.' };
    }

    try {
        const newConstraint: Constraint = {
            constraint_id: uuidv4(),
            table_id: tableId,
            type: type,
            column_names: columnNames,
        };

        if (type === 'FOREIGN KEY') {
            const refTableId = formData.get('referencedTableId') as string;
            const refColNames = formData.get('referencedColumnNames') as string;
            const onDelete = formData.get('onDelete') as Constraint['on_delete'];
            if (!refTableId || !refColNames || !onDelete) {
                return { error: 'Missing foreign key-specific fields.' };
            }
            newConstraint.referenced_table_id = refTableId;
            newConstraint.referenced_column_names = refColNames;
            newConstraint.on_delete = onDelete;
        }

        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${formData.get('tableName')}`);
        return { success: true, constraint: newConstraint };

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

    if (!projectId || !tableId || !tableName || !constraintId) {
        return { error: 'Missing required fields.' };
    }
    
    try {
        revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to delete constraint:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}


export async function deleteTableAction(projectId: string, tableId: string, tableName: string) {
    if (!projectId || !tableId || !tableName) {
        return { error: 'Missing required fields for table deletion.' };
    }

    try {
        revalidatePath(`/dashboard?projectId=${projectId}`);
        revalidatePath(`/editor?projectId=${projectId}`);
        return { success: true };

    } catch (error) {
        console.error('Failed to delete table:', error);
        return { error: `An unexpected error occurred: ${(error as Error).message}` };
    }
}
