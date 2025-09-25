
import { NextResponse } from 'next/server';
import { getTableData } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';
import { Parser } from 'node-sql-parser';

export const maxDuration = 60; // 1 minute

const sqlParser = new Parser();

// Helper to compare values, handling numbers and strings
const compare = (left: any, operator: string, right: any) => {
    const leftNum = parseFloat(left);
    const rightNum = parseFloat(right);

    // If both can be numbers, compare as numbers
    if (!isNaN(leftNum) && !isNaN(rightNum)) {
        left = leftNum;
        right = rightNum;
    }

    switch (operator) {
        case '=': return left == right;
        case '!=': return left != right;
        case '>': return left > right;
        case '<': return left < right;
        case '>=': return left >= right;
        case '<=': return left <= right;
        case 'IN': return right.includes(left);
        case 'NOT IN': return !right.includes(left);
        default: throw new Error(`Unsupported operator: ${operator}`);
    }
};

// Evaluates a WHERE clause AST node against a row
const evaluateWhereClause = (whereNode: any, row: Record<string, any>): boolean => {
    if (!whereNode) return true;
    
    const { type, operator, left, right } = whereNode;

    if (type === 'binary_expr') {
        const leftValue = evaluateWhereClause(left, row);
        
        // Handle short-circuiting for AND/OR
        if (operator.toUpperCase() === 'AND' && !leftValue) return false;
        if (operator.toUpperCase() === 'OR' && leftValue) return true;
        
        const rightValue = evaluateWhereClause(right, row);

        if (operator.toUpperCase() === 'AND') {
            return leftValue && rightValue;
        }
        if (operator.toUpperCase() === 'OR') {
            return leftValue || rightValue;
        }

        // It's a comparison
        const colName = left.column;
        let rVal;
        if (right.type === 'column_ref') {
            rVal = row[right.column];
        } else if (right.type === 'value_list') {
            rVal = right.value.map((v: any) => v.value);
        } else {
            rVal = right.value;
        }

        return compare(row[colName], operator, rVal);
    }
    
    // For single column (e.g. `WHERE my_col`) or other expressions
    if (type === 'column_ref') {
         return !!row[left.column];
    }
    
    throw new Error(`Unsupported WHERE clause node type: ${type}`);
};

const applyOrderBy = (rows: any[], orderBy: any[]) => {
    if (!orderBy || orderBy.length === 0) return rows;

    return [...rows].sort((a, b) => {
        for (const order of orderBy) {
            const { expr, type } = order;
            const col = expr.column;
            const dir = type === 'DESC' ? -1 : 1;

            if (a[col] < b[col]) return -1 * dir;
            if (a[col] > b[col]) return 1 * dir;
        }
        return 0;
    });
};


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
    
    let ast;
    try {
        ast = sqlParser.astify(query);
    } catch (e: any) {
        return NextResponse.json({ error: `SQL Parse Error: ${e.message}` }, { status: 400 });
    }

    if (Array.isArray(ast) || ast.type?.toUpperCase() !== 'SELECT') {
        throw new Error("Only SELECT queries are supported at this time.");
    }
    
    // --- Data Fetching ---
    const from = ast.from;
    if (!from || from.length === 0) throw new Error("FROM clause is required.");
    const mainTable = from[0].table;
    const { rows: mainTableData } = await getTableData(projectId, mainTable, 1, 1000000); // Fetch all for now

    // --- Filtering (WHERE) ---
    const filteredRows = mainTableData.filter(row => evaluateWhereClause(ast.where, row));

    // --- Sorting (ORDER BY) ---
    const sortedRows = applyOrderBy(filteredRows, ast.orderby);

    // --- Pagination (LIMIT) ---
    const limit = ast.limit ? ast.limit.value[0].value : 100; // default 100
    let finalRows = sortedRows.slice(0, limit);

    // --- Column Projection (SELECT) ---
    let resultColumns: string[];
    if (ast.columns.length === 1 && ast.columns[0].expr.column === '*') {
        resultColumns = mainTableData.length > 0 ? Object.keys(mainTableData[0]) : [];
    } else {
        resultColumns = ast.columns.map((c: any) => c.as || c.expr.column);
        finalRows = finalRows.map(row => {
            const projectedRow: Record<string, any> = {};
            ast.columns.forEach((c: any) => {
                const colName = c.expr.column;
                projectedRow[c.as || colName] = row[colName];
            });
            return projectedRow;
        });
    }

    return NextResponse.json({ rows: finalRows, columns: resultColumns });

  } catch (error: any) {
    console.error('Failed to execute SQL:', error);
    return NextResponse.json({ error: `Query Execution Error: ${error.message}` }, { status: 500 });
  }
}
