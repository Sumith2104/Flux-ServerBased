
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentUserId } from '@/lib/auth';
import { getColumnsForTable } from '@/lib/data';
import { revalidatePath } from 'next/cache';
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
    const readableStream = csvFile.stream();
    const projectPath = path.join(process.cwd(), 'src', 'database', userId, projectId);
    const dataFilePath = path.join(projectPath, `${tableName}.csv`);
    
    // Open the file in append mode
    const fileHandle = await fs.open(dataFilePath, 'a');
    const fileWriteStream = fileHandle.createWriteStream();

    let headerChecked = false;
    let importedCount = 0;
    let buffer = '';
    let firstChunk = true;

    // Append a newline to the file in case the last line is not terminated
    await fileHandle.appendFile('\n');

    for await (const chunk of readableStream) {
      buffer += new TextDecoder().decode(chunk);
      let lines = buffer.split('\n');
      
      // Keep the last partial line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        if (!headerChecked && firstChunk) {
            const csvHeader = line.trim().split(',').map(h => h.replace(/^"|"$/g, '').trim());
            if (JSON.stringify(csvHeader) !== JSON.stringify(expectedHeader)) {
              const errorMessage = `CSV header does not match table structure. Expected: ${expectedHeader.join(',')}`;
              await fileWriteStream.close();
              return NextResponse.json({ error: errorMessage }, { status: 400 });
            }
            headerChecked = true;
            // Skip writing the header row
            continue; 
        }

        const values = line.split(',');
        if (values.length !== expectedHeader.length) {
            const errorMessage = `Row has an incorrect number of columns. Expected ${expectedHeader.length}, got ${values.length}. Row content: ${line.substring(0, 100)}...`;
            await fileWriteStream.close();
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }
        
        fileWriteStream.write(line + '\n');
        importedCount++;
      }
      firstChunk = false;
    }

    // Process any remaining data in the buffer (the very last line of the file)
    if (buffer.trim()) {
      const values = buffer.split(',');
      if (values.length !== expectedHeader.length) {
        const errorMessage = `Final row has an incorrect number of columns. Expected ${expectedHeader.length}, got ${values.length}.`;
        await fileWriteStream.close();
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
      fileWriteStream.write(buffer + '\n');
      importedCount++;
    }

    await fileWriteStream.close();

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return NextResponse.json({ success: true, importedCount });

  } catch (error: any) {
    console.error('Failed to import CSV:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}
