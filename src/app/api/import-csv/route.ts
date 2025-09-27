
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';
import { getColumnsForTable } from '@/lib/data';
import { revalidatePath } from 'next/cache';

export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    const tableId = formData.get('tableId') as string;
    const tableName = formData.get('tableName') as string;
    const csvFile = formData.get('csvFile') as File | null;

    if (!projectId || !tableId || !tableName || !csvFile) {
      return NextResponse.json({ error: 'Missing required fields for CSV import.' }, { status: 400 });
    }

    const tableColumns = await getColumnsForTable(projectId, tableId);
    if (tableColumns.length === 0) {
        return NextResponse.json({ error: 'Table columns could not be determined. Cannot import.' }, { status: 400 });
    }
    const expectedHeader = tableColumns.map(c => c.column_name);

    // Read the entire file and clean it first
    const fileContent = await csvFile.text();
    const cleanedLines = fileContent
        .trim()
        .split('\n')
        .map(line => line.trim())
        .filter(line => line);
    
    if (cleanedLines.length === 0) {
        return NextResponse.json({ error: 'CSV file is empty or contains only whitespace.' }, { status: 400 });
    }

    // Validate header from the cleaned content
    const headerLine = cleanedLines[0];
    const csvHeader = headerLine.split(',').map(h => h.replace(/^"|"$/g, '').trim());
    
    if (JSON.stringify(csvHeader) !== JSON.stringify(expectedHeader)) {
        const errorMessage = `CSV header does not match table structure. Expected: ${expectedHeader.join(',')} | Received: ${csvHeader.join(',')}`;
        return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
    
    // Get the data rows (all lines except the header)
    const dataLines = cleanedLines.slice(1);
    let importedCount = 0;

    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);

    // Prepare the content to be appended, ensuring each row is properly formed.
    const contentToAppend = dataLines.map(line => {
        const values = line.split(',').map(v => v.trim());
        if (values.length !== expectedHeader.length) {
            // This is a basic check. A more robust CSV parser would be needed for complex cases.
            throw new Error(`Row has an incorrect number of columns. Expected ${expectedHeader.length}, got ${values.length}. Row content: ${line.substring(0, 100)}...`);
        }
        importedCount++;
        // Re-join the cleaned cells.
        return values.join(',');
    }).join('\n');

    if (contentToAppend) {
        // Append a newline to the file in case the last line is not terminated, then append the new content.
        await fs.appendFile(dataFilePath, '\n' + contentToAppend, 'utf8');
    }

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return NextResponse.json({ success: true, importedCount });

  } catch (error: any) {
    console.error('Failed to import CSV:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}

    