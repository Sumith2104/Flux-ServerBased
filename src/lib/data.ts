

'use server';

import prisma from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import type { Project as PrismaProject, Table as PrismaTable, Column as PrismaColumn, Constraint as PrismaConstraint } from '@prisma/client';

// Re-exporting with friendlier names for the UI if needed
export type Project = PrismaProject;
export type Table = PrismaTable;
export type Column = PrismaColumn;
export type Constraint = PrismaConstraint;


export async function getProjectsForCurrentUser(): Promise<Project[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return [];
    }
    try {
        const projects = await prisma.project.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        // Map to what the frontend expects
        return projects.map(p => ({
            ...p,
            project_id: p.id,
            display_name: p.name,
            created_at: p.createdAt.toISOString(),
        }));
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return [];
    }
}

export async function getProjectById(projectId: string): Promise<Project | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    
    try {
        const project = await prisma.project.findFirst({
            where: { id: projectId, userId },
        });
        return project;
    } catch (error) {
        console.error(`Failed to fetch project ${projectId}:`, error);
        return null;
    }
}

export async function getTablesForProject(projectId: string): Promise<Table[]> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    
    try {
         const tables = await prisma.table.findMany({
            where: { projectId },
            orderBy: { name: 'asc' },
        });
        return tables.map(t => ({
            ...t,
            table_id: t.id,
            table_name: t.name,
            created_at: t.createdAt.toISOString()
        }))
    } catch (error) {
        console.error(`Failed to fetch tables for project ${projectId}:`, error);
        return [];
    }
}

export async function getColumnsForTable(tableId: string): Promise<Column[]> {
    try {
        const columns = await prisma.column.findMany({
            where: { tableId },
            orderBy: { name: 'asc' },
        });
        return columns.map(c => ({
            ...c,
            column_id: c.id,
            column_name: c.name,
            data_type: c.dataType,
            table_id: c.tableId
        }));
    } catch (error) {
        console.error(`Failed to fetch columns for table ${tableId}:`, error);
        return [];
    }
}

export async function getConstraintsForProject(projectId: string): Promise<Constraint[]> {
    try {
        const constraints = await prisma.constraint.findMany({
            where: {
                table: {
                    projectId: projectId,
                },
            },
        });
        return constraints.map(c => ({
            ...c,
            constraint_id: c.id,
            table_id: c.tableId,
            column_names: c.columnNames,
            referenced_table_id: c.referencedTableId,
            referenced_column_names: c.referencedColumnNames,
        }));
    } catch (error) {
        console.error(`Failed to fetch constraints for project ${projectId}:`, error);
        return [];
    }
}

export async function getConstraintsForTable(tableId: string): Promise<Constraint[]> {
     try {
        const constraints = await prisma.constraint.findMany({
            where: { tableId },
        });
         return constraints.map(c => ({
            ...c,
            constraint_id: c.id,
            table_id: c.tableId,
            column_names: c.columnNames,
            referenced_table_id: c.referencedTableId,
            referenced_column_names: c.referencedColumnNames,
        }));
    } catch (error) {
        console.error(`Failed to fetch constraints for table ${tableId}:`, error);
        return [];
    }
}

interface PaginatedTableData {
    rows: Record<string, any>[];
    totalRows: number;
}

export async function getTableData(
    tableId: string,
    page: number = 1,
    pageSize: number = 100
): Promise<PaginatedTableData> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    
    // Authorization: Check if the user has access to the project this table belongs to
    const table = await prisma.table.findUnique({
        where: { id: tableId },
        select: { project: { select: { userId: true } } }
    });

    if (!table || table.project.userId !== userId) {
        throw new Error("Unauthorized access to table data.");
    }
    
    try {
        const skip = (page - 1) * pageSize;
        
        const [rows, totalRows] = await prisma.$transaction([
            prisma.row.findMany({
                where: { tableId },
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.row.count({ where: { tableId } }),
        ]);

        // The 'data' field in the Row model is a JSONB field.
        // We spread it into the main object for easier access in the UI.
        const processedRows = rows.map(row => ({
            id: row.id,
            ...row.data as object,
        }));
        
        return { rows: processedRows, totalRows };

    } catch (error) {
        console.error(`Failed to read paginated table data for table ${tableId}:`, error);
        throw error;
    }
}

export interface ProjectAnalytics {
    totalSize: number; // in KB
    totalRows: number;
    tables: {
        name: string;
        size: number; // in KB
        rows: number;
    }[];
}

// This function needs database-specific queries to get table size, which can be complex.
// For now, we'll use row counts as a proxy.
export async function getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");

    const tables = await getTablesForProject(projectId);
    let totalRows = 0;
    const tableAnalytics = [];

    for (const table of tables) {
        const rowCount = await prisma.row.count({ where: { tableId: table.id } });
        totalRows += rowCount;
        tableAnalytics.push({
            name: table.name,
            rows: rowCount,
            // Mock size calculation: 1KB per row as an estimate. A real implementation
            // would require a database query to get actual table size.
            size: rowCount * 1, 
        });
    }

    return {
        totalSize: tableAnalytics.reduce((acc, t) => acc + t.size, 0),
        totalRows,
        tables: tableAnalytics,
    };
}
