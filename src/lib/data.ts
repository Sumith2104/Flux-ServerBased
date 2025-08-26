
'use server';

import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';

const DB_PATH = path.join(process.cwd(), 'src', 'database');

// Helper to parse CSV data
function parseCsv(data: string): Record<string, string>[] {
    if (!data) return [];
    const rows = data.trim().split('\n').filter(row => row.trim() !== '');
    if (rows.length < 2) return [];

    const header = rows[0].split(',').map(h => h.trim());
    
    return rows.slice(1).map(row => {
        const values = row.split(',');
        return header.reduce((obj, nextKey, index) => {
            obj[nextKey] = values[index]?.trim().replace(/^"|"$/g, '') || '';
            return obj;
        }, {} as Record<string, string>);
    });
}


// Helper to read a CSV file
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
        // Return empty array instead of throwing error to avoid breaking the UI for non-authed states
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
    const tables = await readCsvFile(tablesCsvPath);
    return tables as unknown as Table[];
}

export async function getColumnsForTable(projectId: string, tableId: string): Promise<Column[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const columnsCsvPath = path.join(DB_PATH, userId, projectId, 'columns.csv');
    const allColumns = await readCsvFile(columnsCsvPath) as unknown as Column[];
    return allColumns.filter(col => col.table_id === tableId);
}

export async function getTableData(projectId: string, tableName: string): Promise<Record<string, string>[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("User not authenticated");
    }
    const tableDataPath = path.join(DB_PATH, userId, projectId, `${tableName}.csv`);
    return readCsvFile(tableDataPath);
}
