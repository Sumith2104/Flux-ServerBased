
import { NextResponse } from 'next/server';
import { getTableData } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';

export const maxDuration = 60; // 1 minute

// Extremely simple SQL parser. Handles "SELECT ... FROM ... WHERE ... LIMIT ..."
function parseSql(query: string) {
    query = query.replace(/\s+/g, ' ').trim();
    
    // SELECT clause
    const selectMatch = query.match(/^SELECT\s+(.*?)\s+FROM/i);
    if (!selectMatch) throw new Error("Invalid SQL: Missing SELECT or FROM clause.");
    const columns = selectMatch[1].split(',').map(c => c.trim());

    // FROM clause
    const fromMatch = query.match(/\s+FROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) throw new Error("Invalid SQL: Missing FROM clause.");
    const tableName = fromMatch[1];
    
    let whereClause = null;
    const whereMatch = query.match(/\s+WHERE\s+(.*?)(\s+LIMIT|\s*$)/i);
    if(whereMatch) {
        whereClause = whereMatch[1].trim();
    }
    
    let limit = 100; // Default limit
    const limitMatch = query.match(/\s+LIMIT\s+([0-9]+)/i);
    if(limitMatch) {
        limit = parseInt(limitMatch[1], 10);
    }
    
    return { columns, tableName, whereClause, limit };
}

// Simple WHERE clause evaluator
function evaluateWhereClause(row: Record<string, any>, where: string): boolean {
    // This is a very basic evaluator and can be expanded.
    // It handles simple conditions like `column = 'value'` or `column > 10`.
    const operators = ['=', '!=', '>', '<', '>=', '<='];
    
    for (const op of operators) {
        if (where.includes(op)) {
            const [column, valueStr] = where.split(op).map(s => s.trim());
            
            const rawValue = valueStr.replace(/['"]/g, ''); // Strip quotes
            
            const rowValue = row[column];
            
            if (rowValue === undefined) return false;

            const rowValueNum = parseFloat(rowValue);
            const rawValueNum = parseFloat(rawValue);

            switch (op) {
                case '=': return (isNaN(rowValueNum) || isNaN(rawValueNum)) ? rowValue == rawValue : rowValueNum == rawValueNum;
                case '!=': return (isNaN(rowValueNum) || isNaN(rawValueNum)) ? rowValue != rawValue : rowValueNum != rawValueNum;
                case '>': return !isNaN(rowValueNum) && !isNaN(rawValueNum) && rowValueNum > rawValueNum;
                case '<': return !isNaN(rowValueNum) && !isNaN(rawValueNum) && rowValueNum < rawValueNum;
                case '>=': return !isNaN(rowValueNum) && !isNaN(rawValueNum) && rowValueNum >= rawValueNum;
                case '<=': return !isNaN(rowValueNum) && !isNaN(rawValueNum) && rowValueNum <= rawValueNum;
            }
        }
    }
    // Very basic "IN" clause support: `column IN ('val1', 'val2')`
    const inMatch = where.match(/(\w+)\s+IN\s+\((.*?)\)/i);
    if(inMatch) {
        const column = inMatch[1];
        const values = inMatch[2].split(',').map(v => v.trim().replace(/['"]/g, ''));
        return values.includes(row[column]);
    }

    throw new Error(`Unsupported WHERE clause format: "${where}"`);
}


export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { projectId, query } = await request.json();

    if (!projectId || !query) {
      return NextResponse.json({ error: 'Missing required body parameters: projectId and query' }, { status: 400 });
    }
    
    const { columns, tableName, whereClause, limit } = parseSql(query);

    // Fetch all data first, then filter. Inefficient but necessary for file-based system.
    const { rows: allRows } = await getTableData(projectId, tableName, 1, 1000000); 

    let filteredRows = allRows;
    if(whereClause) {
        filteredRows = allRows.filter(row => evaluateWhereClause(row, whereClause));
    }
    
    let resultRows = filteredRows.slice(0, limit);
    let resultColumns = columns;
    
    // Handle SELECT *
    if (columns.length === 1 && columns[0] === '*') {
        if(resultRows.length > 0) {
            resultColumns = Object.keys(resultRows[0]);
        } else if (allRows.length > 0) {
            resultColumns = Object.keys(allRows[0]);
        } else {
            // Need a better way to get columns if table is empty
            resultColumns = [];
        }
    } else {
        // Project only the selected columns
        resultRows = resultRows.map(row => {
            const projectedRow: Record<string, any> = {};
            for(const col of columns) {
                projectedRow[col] = row[col];
            }
            return projectedRow;
        });
    }

    return NextResponse.json({ rows: resultRows, columns: resultColumns });

  } catch (error: any) {
    console.error('Failed to execute SQL:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}
