
import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import prisma from '@/lib/prisma';
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

    const tableColumns = await prisma.column.findMany({ where: { tableId } });
    if (tableColumns.length === 0) {
      return NextResponse.json({ error: 'Table columns could not be determined. Cannot import.' }, { status: 400 });
    }
    const expectedHeader = tableColumns.map(c => c.name);

    const fileContent = await csvFile.text();
    const cleanedLines = fileContent.trim().split('\n').map(line => line.trim()).filter(line => line);
    
    if (cleanedLines.length <= 1) {
      return NextResponse.json({ error: 'CSV file is empty or contains only a header.' }, { status: 400 });
    }

    const headerLine = cleanedLines[0];
    const csvHeader = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    const dataLines = cleanedLines.slice(1);
    
    // Create a mapping from CSV header to table column name
    const headerMap: { [key: string]: string } = {};
    const lowerCaseExpected = expectedHeader.map(h => h.toLowerCase());
    csvHeader.forEach(h => {
        const hLower = h.toLowerCase();
        const matchIndex = lowerCaseExpected.indexOf(hLower);
        if(matchIndex > -1) {
            headerMap[h] = expectedHeader[matchIndex];
        }
    });

    const rowsToCreate = dataLines.map(line => {
      const values = line.split(','); // Simplified parsing
      const rowData: { [key: string]: any } = {};

      csvHeader.forEach((header, index) => {
        const tableColumnName = headerMap[header];
        if (tableColumnName) {
            const columnSchema = tableColumns.find(c => c.name === tableColumnName);
            let value = values[index].trim();

            if (columnSchema?.dataType === 'number') {
                rowData[tableColumnName] = parseFloat(value) || null;
            } else if (columnSchema?.dataType === 'boolean') {
                rowData[tableColumnName] = value.toLowerCase() === 'true';
            } else {
                rowData[tableColumnName] = value.replace(/^"|"$/g, '');
            }
        }
      });
      return {
          tableId: tableId,
          data: rowData
      };
    });

    const { count } = await prisma.row.createMany({
        data: rowsToCreate,
        skipDuplicates: true, // This can be useful but might hide issues
    });

    revalidatePath(`/editor?projectId=${projectId}&tableId=${tableId}&tableName=${tableName}`);
    return NextResponse.json({ success: true, importedCount: count });

  } catch (error: any) {
    console.error('Failed to import CSV:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}
