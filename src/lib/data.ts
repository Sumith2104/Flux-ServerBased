

'use server';

import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';

const DB_PATH = path.join(process.cwd(), 'src', 'database');

// Helper to parse CSV data
function parseCsv(data: string): Record<string, string>[] {
    if (!data) return [];
    const lines = data.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1);

    return rows.map(line => {
        // This regex handles comma-separated values, including quoted strings that contain commas
        const values = (line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || []).map(v => v.trim().replace(/^"|"$/g, ''));
        const entry: Record<string, string> = {};
        header.forEach((key, index) => {
            entry[key] = values[index];
        });
        return entry;
    });
}


// Helper to read a small CSV file
async function readCsvFile(filePath: string) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return parseCsv(data);
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return []; // File not found, return empty array
        }
        throw error;
    }
}

// --- Project Data ---

export interface Project {
    project_id: string;
    user_id: string;
    display_name: string;
    created_at: string;
}

export async function getProjectsForCurrentUser(): Promise<Project[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        return [];
    }
    const projectsCsvPath = path.join(DB_PATH, userId, 'projects.csv');
    const projects = await readCsvFile(projectsCsvPath);
    return projects as unknown as Project[];
}

export async function getProjectById(projectId: string): Promise<Project | null> {
    const userId = await getCurrentUserId();
    if (!userId) return null;
    
    const projects = await getProjectsForCurrentUser();
    return projects.find(p => p.project_id === projectId) || null;
}

// --- Table Data ---

export interface Table {
    table_id: string;
    project_id: string;
    table_name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface Column {
    column_id: string;
    table_id: string;
    column_name: string;
    data_type: string;
}

// --- Constraint Data ---
export type ConstraintType = 'PRIMARY KEY' | 'FOREIGN KEY';
export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT';

export interface Constraint {
    constraint_id: string;
    table_id: string;
    type: ConstraintType;
    column_names: string; // Comma-separated for composite keys
    // Foreign Key specific fields
    referenced_table_id?: string;
    referenced_column_names?: string; // Comma-separated for composite keys
    on_delete?: ReferentialAction;
    on_update?: ReferentialAction;
}

export async function getConstraintsForProject(projectId: string): Promise<Constraint[]> {
    const userId = await getCurrentUserId();
    if (!userId) throw new Error("User not authenticated");
    const constraintsCsvPath = path.join(DB_PATH, userId, projectId, 'constraints.csv');
    return await readCsvFile(constraintsCsvPath) as unknown as Constraint[];
}

export async function getConstraintsForTable(projectId: string, tableId: string): Promise<Constraint[]> {
    const allConstraints = await getConstraintsForProject(projectId);
    return allConstraints.filter(c => c.table_id === tableId);
}


export async function getTablesForProject(projectId: string): Promise<Table[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const tablesCsvPath = path.join(DB_PATH, userId, projectId, 'tables.csv');
    return await readCsvFile(tablesCsvPath) as unknown as Table[];
}

export async function getColumnsForTable(projectId:string, tableId: string): Promise<Column[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const columnsCsvPath = path.join(DB_PATH, userId, projectId, 'columns.csv');
    const allColumns = await readCsvFile(columnsCsvPath);
    return allColumns.filter(col => col.table_id === tableId) as unknown as Column[];
}


interface PaginatedTableData {
    rows: Record<string, string>[];
    totalRows: number;
}

export async function getTableData(
    projectId: string, 
    tableName: string,
    page: number = 1,
    pageSize: number = 100
): Promise<PaginatedTableData> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const tableDataPath = path.join(DB_PATH, userId, projectId, `${tableName}.csv`);

    try {
        const fileContent = await fs.readFile(tableDataPath, 'utf8');
        const allRows = parseCsv(fileContent);

        const totalRows = allRows.length;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        const paginatedRows = allRows.slice(startIndex, endIndex);

        return { rows: paginatedRows, totalRows: totalRows };

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return { rows: [], totalRows: 0 };
        }
        console.error("Failed to read paginated table data:", error);
        throw error;
    }
}


// --- Analytics Data ---
export interface ProjectAnalytics {
    totalSize: number; // in KB
    totalRows: number;
    tables: {
        name: string;
        size: number; // in KB
        rows: number;
    }[];
}

async function getCsvLineCount(filePath: string): Promise<number> {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim() !== '');
        return Math.max(0, lines.length > 1 ? lines.length - 1 : 0);
    } catch (error: any) {
        if (error.code === 'ENOENT') return 0;
        throw error;
    }
}

export async function getProjectAnalytics(projectId: string): Promise<ProjectAnalytics> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }

    const projectPath = path.join(DB_PATH, userId, projectId);
    const tables = await getTablesForProject(projectId);

    let totalSize = 0;
    let totalRows = 0;
    const tableAnalytics = [];

    for (const table of tables) {
        const tableDataPath = path.join(projectPath, `${table.table_name}.csv`);
        try {
            const stats = await fs.stat(tableDataPath);
            const rowCount = await getCsvLineCount(tableDataPath);

            const sizeInKb = parseFloat((stats.size / 1024).toFixed(2));

            totalSize += sizeInKb;
            totalRows += rowCount;
            
            tableAnalytics.push({
                name: table.table_name,
                size: sizeInKb,
                rows: rowCount,
            });

        } catch (error) {
            console.warn(`Could not get analytics for table ${table.table_name}:`, error);
        }
    }

    return {
        totalSize: parseFloat(totalSize.toFixed(2)),
        totalRows,
        tables: tableAnalytics,
    };
}
