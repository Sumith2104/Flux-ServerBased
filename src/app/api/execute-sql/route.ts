
import { NextResponse } from 'next/server';
import { getTableData, getTablesForProject, getColumnsForTable } from '@/lib/data';
import { getCurrentUserId } from '@/lib/auth';
import { Parser, AST } from 'node-sql-parser';

export const maxDuration = 60; // 1 minute

const sqlParser = new Parser();

// Helper to compare values, handling numbers and strings
const compare = (left: any, operator: string, right: any): boolean => {
    // Handle nulls
    if (operator === 'IS' && right === null) return left === null || left === undefined || left === '';
    if (operator === 'IS NOT' && right === null) return left !== null && left !== undefined && left !== '';
    if (left === null || right === null || left === undefined || right === undefined) return false;


    const leftNum = parseFloat(left);
    const rightNum = parseFloat(right);

    // If both can be numbers, compare as numbers
    if (!isNaN(leftNum) && !isNaN(rightNum)) {
        left = leftNum;
        right = rightNum;
    } else { // Compare as strings, case-insensitive
        left = String(left).toLowerCase();
        right = Array.isArray(right) 
            ? right.map(r => String(r).toLowerCase()) 
            : String(right).toLowerCase();
    }
    
    switch (operator.toUpperCase()) {
        case '=': return left == right;
        case '!=':
        case '<>': return left != right;
        case '>': return left > right;
        case '<': return left < right;
        case '>=': return left >= right;
        case '<=': return left <= right;
        case 'IN': return Array.isArray(right) && right.includes(left);
        case 'NOT IN': return Array.isArray(right) && !right.includes(left);
        case 'LIKE': 
            if (typeof right !== 'string') return false;
            // Basic LIKE support: % matches any sequence of characters
            const regex = new RegExp("^" + right.replace(/%/g, '.*') + "$");
            return regex.test(left);
        default: throw new Error(`Unsupported operator: ${operator}`);
    }
};

// Evaluates a WHERE clause AST node against a row
const evaluateWhereClause = (whereNode: any, row: Record<string, any>): boolean => {
    if (!whereNode) return true;
    
    const { type, operator, left, right } = whereNode;

    if (type === 'binary_expr') {
        // Logical operators (AND, OR)
        if (['AND', 'OR'].includes(operator.toUpperCase())) {
            const leftValue = evaluateWhereClause(left, row);
            
            if (operator.toUpperCase() === 'AND' && !leftValue) return false;
            if (operator.toUpperCase() === 'OR' && leftValue) return true;
            
            const rightValue = evaluateWhereClause(right, row);

            if (operator.toUpperCase() === 'AND') return leftValue && rightValue;
            if (operator.toUpperCase() === 'OR') return leftValue || rightValue;
        }

        // Comparison operators (=, !=, >, <, etc.)
        const colName = left.column;
        if (row[colName] === undefined) return false; // Column doesn't exist in row

        let rVal;
        if (right.type === 'column_ref') {
            rVal = row[right.column];
        } else if (right.type === 'value_list') {
            rVal = right.value.map((v: any) => v.value);
        } else if (right.type === 'null') {
            rVal = null;
        } else {
            rVal = right.value;
        }

        return compare(row[colName], operator, rVal);
    }
    
    if (type === 'column_ref') {
         // e.g. `WHERE is_active` is treated as `is_active = true`
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

            const valA = a[col];
            const valB = b[col];

            const valANum = parseFloat(valA);
            const valBNum = parseFloat(valB);

            if (!isNaN(valANum) && !isNaN(valBNum)) {
                if (valANum < valBNum) return -1 * dir;
                if (valANum > valBNum) return 1 * dir;
            } else {
                 if (String(valA).localeCompare(String(valB)) < 0) return -1 * dir;
                 if (String(valA).localeCompare(String(valB)) > 0) return 1 * dir;
            }
        }
        return 0;
    });
};

const performJoin = (
    leftTable: any[], 
    rightTable: any[], 
    joinCondition: any,
    joinType: 'INNER JOIN' | 'LEFT JOIN'
) => {
    const joinedRows: any[] = [];
    const { left, right, operator } = joinCondition;

    const leftCol = left.column;
    const rightCol = right.column;

    const rightTableMap = new Map();
    for (const row of rightTable) {
        if (!rightTableMap.has(row[rightCol])) {
            rightTableMap.set(row[rightCol], []);
        }
        rightTableMap.get(row[rightCol]).push(row);
    }

    for (const leftRow of leftTable) {
        const joinValue = leftRow[leftCol];
        const matchingRightRows = rightTableMap.get(joinValue) || [];

        if (matchingRightRows.length > 0) {
            for (const rightRow of matchingRightRows) {
                joinedRows.push({ ...leftRow, ...rightRow });
            }
        } else if (joinType === 'LEFT JOIN') {
            const nullPaddedRightRow: Record<string, null> = {};
            if(rightTable.length > 0) {
                Object.keys(rightTable[0]).forEach(key => {
                    nullPaddedRightRow[key] = null;
                });
            }
            joinedRows.push({ ...leftRow, ...nullPaddedRightRow });
        }
    }
    return joinedRows;
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
    
    let ast: AST | AST[];
    try {
        ast = sqlParser.astify(query);
    } catch (e: any) {
        return NextResponse.json({ error: `SQL Parse Error: ${e.message}` }, { status: 400 });
    }
    
    const selectAst = Array.isArray(ast) ? ast[0] : ast;
    if (selectAst.type?.toUpperCase() !== 'SELECT') {
        throw new Error("Only SELECT queries are supported at this time.");
    }
    
    // --- Data Fetching ---
    const from = selectAst.from;
    if (!from || from.length === 0) throw new Error("FROM clause is required.");
    
    const mainTableDef = from[0];
    const { rows: mainTableData } = await getTableData(projectId, mainTableDef.table, 1, 1000000); // Fetch all for now

    let processedRows = mainTableData;
    
    // --- Join Processing ---
    if (from.length > 1) {
        let currentLeftTable = mainTableData;
        for (let i = 1; i < from.length; i++) {
            const joinDef = from[i];
            const { rows: rightTableData } = await getTableData(projectId, joinDef.table, 1, 1000000);
            currentLeftTable = performJoin(currentLeftTable, rightTableData, joinDef.on, joinDef.join);
        }
        processedRows = currentLeftTable;
    }

    // --- Filtering (WHERE) ---
    const filteredRows = processedRows.filter(row => evaluateWhereClause(selectAst.where, row));

    // --- Sorting (ORDER BY) ---
    const sortedRows = applyOrderBy(filteredRows, selectAst.orderby);

    // --- Pagination (LIMIT) ---
    const limit = selectAst.limit ? selectAst.limit.value[0].value : 100; // default 100
    let finalRows = sortedRows.slice(0, limit);

    // --- Column Projection (SELECT) ---
    let resultColumns: string[];
    if (selectAst.columns.length === 1 && selectAst.columns[0].expr.column === '*') {
        resultColumns = finalRows.length > 0 ? Object.keys(finalRows[0]) : [];
    } else {
        resultColumns = selectAst.columns.map((c: any) => c.as || c.expr.column);
        finalRows = finalRows.map(row => {
            const projectedRow: Record<string, any> = {};
            selectAst.columns.forEach((c: any) => {
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
