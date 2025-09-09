

'use server';

import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';
import { Readable } from 'stream';
import { createReadStream } from 'fs';

const DB_PATH = path.join(process.cwd(), 'src', 'database');

// Helper to parse CSV data - now only used for smaller config files
function parseCsv(data: string): Record<string, string>[] {
    if (!data) return [];
    const rows = data.trim().split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) return [];

    const header = rows[0].split(',').map(h => h.trim());
    
    return rows.slice(1).map(row => {
        // This is a simplified parser. A more robust one would handle quotes.
        const values = row.split(',');
        return header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index]?.trim().replace(/^"|"$/g, '') || '';
            return obj;
        }, {} as Record<string, string>);
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

export async function getTablesForProject(projectId: string): Promise<Table[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const tablesCsvPath = path.join(DB_PATH, userId, projectId, 'tables.csv');
    return await readCsvFile(tablesCsvPath) as unknown as Table[];
}

export async function getColumnsForTable(projectId: string, tableId: string): Promise<Column[]> {
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

async function getCsvLineCount(filePath: string): Promise<number> {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        // Split by newline and filter out empty lines that might result from trailing newlines
        const lines = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
        // If there's content, there's at least a header, so we subtract that.
        // A file with just a header has 1 line, so (1 - 1) = 0 data rows.
        // A file with header + 1 data row has 2 lines, so (2 - 1) = 1 data row.
        return Math.max(0, lines.length > 0 ? lines.length - 1 : 0);
    } catch (error: any) {
        if (error.code === 'ENOENT') return 0;
        throw error;
    }
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

