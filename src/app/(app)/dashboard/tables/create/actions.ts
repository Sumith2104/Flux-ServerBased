
'use server';

import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createTableAction(formData: FormData) {
  const tableName = formData.get('tableName') as string;
  const description = formData.get('description') as string;
  const projectId = formData.get('projectId') as string;
  const columnsStr = formData.get('columns') as string;
  const userId = await getCurrentUserId();

  if (!tableName || !projectId || !userId || !columnsStr) {
    return { success: false, error: 'Missing required fields.' };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    return { success: false, error: 'Table name can only contain letters, numbers, and underscores.' };
  }

  try {
    // Verify user owns the project
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId }
    });
    if (!project) {
        return { success: false, error: "Project not found or you don't have access." };
    }

    // Check for duplicate table name
    const existingTable = await prisma.table.findFirst({
      where: {
        projectId,
        name: {
          equals: tableName,
          mode: 'insensitive',
        },
      },
    });

    if (existingTable) {
      return { success: false, error: `A table with the name '${tableName}' already exists in this project.` };
    }
    
    const columns = columnsStr.split(',').map(c => {
        const [name, type] = c.split(':');
        if (!name || !type) throw new Error(`Invalid column definition: ${c}`);
        return { name: name.trim(), type: type.trim() };
    });

    if (columns.length === 0) {
        return { success: false, error: 'You must define at least one column.' };
    }
    
    // Create the table and its columns in a single transaction
    const newTable = await prisma.table.create({
        data: {
            name: tableName,
            description: description,
            projectId: projectId,
            columns: {
                create: columns.map(col => ({
                    name: col.name,
                    dataType: col.type,
                })),
            },
        },
    });

    revalidatePath(`/dashboard?projectId=${projectId}`);
    
    return { success: true, tableId: newTable.id };

  } catch (error: any) {
    console.error('Table creation failed:', error);
    // Prisma unique constraint violation
    if (error.code === 'P2002') {
        return { success: false, error: `A table with the name '${tableName}' already exists in this project.` };
    }
    return { success: false, error: `An unexpected error occurred: ${error.message}` };
  }
}
