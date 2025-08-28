'use server';

import fs from 'fs/promises';
import path from 'path';
import type { User } from '@/lib/auth';

export async function findUserById(userId: string): Promise<User | null> {
    const usersCsvPath = path.join(process.cwd(), 'src', 'database', 'users.csv');
    try {
        const data = await fs.readFile(usersCsvPath, 'utf8');
        const rows = data.trim().split('\n');
        if (rows.length < 2) return null;
        const header = rows[0].split(',');
        const users = rows.slice(1).map(row => {
            const values = row.split(',');
            return header.reduce((obj, nextKey, index) => {
                obj[nextKey.trim()] = values[index]?.trim().replace(/^"|"$/g, '');
                return obj;
            }, {} as Record<string, string>);
        });
        const user = users.find(u => u.id === userId);
        return user as User || null;
    } catch (error) {
        console.error("Failed to read or parse users.csv", error);
        return null;
    }
}
