
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';
import { getColumnsForTable } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { Writable } from 'stream';
import { Readable } from 'stream';

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
    const expectedHeader = tableColumns.map(c => c.column_name);

    // Stream processing
    const readableStream = Readable.from(csvFile.stream());
    let headerChecked = false;
    let importedCount = 0;
    let buffer = '';

    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);
    
    // Create a writable stream to append to the file
    const fileWriteStream = (await fs.open(dataFilePath, 'a')).createWriteStream();
    
    fileWriteStream.write('\n'); // Start on a new line

    await new Promise<void>((resolve, reject) => {
      readableStream.on('data', (chunk) => {
        buffer += chunk.toString('utf-8');
        let lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial line in the buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          if (!headerChecked) {
            const csvHeader = line.trim().split(',').map(h => h.replace(/^"|"$/g, ''));
            if (JSON.stringify(csvHeader) !== JSON.stringify(expectedHeader)) {
              const err = new Error(`CSV header does not match table structure. Expected: ${expectedHeader.join(',')}`);
              readableStream.destroy(err);
              return;
            }
            headerChecked = true;
            continue; // Skip header row from being written
          }

          // Basic validation for number of columns. More robust validation can be added.
          const values = line.split(',');
          if (values.length !== expectedHeader.length) {
              const err = new Error(`Row has an incorrect number of columns. Expected ${expectedHeader.length}, got ${values.length}.`);
              readableStream.destroy(err);
              return;
          }
          
          fileWriteStream.write(line + '\n');
          importedCount++;
        }
      });

      readableStream.on('end', () => {
        // Process the final chunk of data if it exists and is not just whitespace.
        const finalLine = buffer.trim();
        if (finalLine) {
            const values = finalLine.split(',');
            if (values.length !== expectedHeader.length) {
                const err = new Error(`Final row has an incorrect number of columns. Expected ${expectedHeader.length}, got ${values.length}.`);
                readableStream.destroy(err);
                return;
            }
            fileWriteStream.write(finalLine + '\n');
            importedCount++;
        }
        fileWriteStream.end();
      });

      fileWriteStream.on('finish', () => {
        resolve();
      });
      
      readableStream.on('error', (err) => {
        fileWriteStream.close();
        reject(err);
      });

      fileWriteStream.on('error', (err) => {
        readableStream.destroy();
        reject(err);
      });
    });

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return NextResponse.json({ success: true, importedCount });

  } catch (error: any) {
    console.error('Failed to import CSV:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}
