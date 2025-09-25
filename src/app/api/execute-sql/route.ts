
import { NextResponse } from 'next/server';
import { getTableData, getTablesForProject, getColumnsForTable } from '@/lib/data';
import { createTableAction } from '@/app/(app)/dashboard/tables/create/actions';
import { addRowAction } from '@/app/(app)/editor/actions';
import { getCurrentUserId } from '@/lib/auth';
import { Parser, AST, Create, Insert } from 'node-sql-parser';

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

const handleSelectQuery = async (ast: AST, projectId: string) => {
    if (ast.type?.toUpperCase() !== 'SELECT') {
        throw new Error("Invalid AST type passed to handleSelectQuery.");
    }
    
    const from = ast.from;
    if (!from || from.length === 0) throw new Error("FROM clause is required.");
    
    const mainTableDef = from[0];
    const { rows: mainTableData } = await getTableData(projectId, mainTableDef.table, 1, 1000000);

    let processedRows = mainTableData;
    
    if (from.length > 1) {
        let currentLeftTable = mainTableData;
        for (let i = 1; i < from.length; i++) {
            const joinDef = from[i];
            const { rows: rightTableData } = await getTableData(projectId, joinDef.table, 1, 1000000);
            currentLeftTable = performJoin(currentLeftTable, rightTableData, joinDef.on, joinDef.join);
        }
        processedRows = currentLeftTable;
    }

    const filteredRows = processedRows.filter(row => evaluateWhereClause(ast.where, row));
    const sortedRows = applyOrderBy(filteredRows, ast.orderby);
    const limit = ast.limit ? ast.limit.value[0].value : 100;
    let finalRows = sortedRows.slice(0, limit);

    let resultColumns: string[];
    if (ast.columns.length === 1 && ast.columns[0].expr.column === '*') {
        resultColumns = finalRows.length > 0 ? Object.keys(finalRows[0]) : [];
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

    return { rows: finalRows, columns: resultColumns };
};

const handleCreateQuery = async (ast: Create, projectId: string) => {
    if (ast.keyword !== 'table' || !ast.table) {
        throw new Error("Only CREATE TABLE statements are supported.");
    }
    
    const tableName = ast.table[0].table;
    const columns = ast.create_definitions?.map(def => {
        if (def.resource !== 'column') return null;
        
        let dataType = def.definition.dataType.toLowerCase();
        
        // This is a simplified mapping. A real system would need more nuance.
        switch(dataType) {
            case 'uuid':
                dataType = 'gen_random_uuid()';
                break;
            case 'text':
            case 'char':
            case 'varchar':
                dataType = 'text';
                break;
            case 'timestamptz':
            case 'timestamp':
            case 'date':
                dataType = 'date';
                break;
            case 'int':
            case 'integer':
            case 'smallint':
            case 'bigint':
            case 'decimal':
            case 'numeric':
            case 'float':
            case 'double':
                dataType = 'number';
                break;
             case 'boolean':
                dataType = 'text'; // Storing booleans as text 'true'/'false' for simplicity in CSV
                break;
            default:
                 dataType = 'text'; // Default to text for unrecognized types
        }

        return `${def.column.column}:${dataType}`;
    }).filter(Boolean).join(',');

    if (!columns) {
        throw new Error("CREATE TABLE statement must include column definitions.");
    }
    
    const formData = new FormData();
    formData.append('tableName', tableName);
    formData.append('projectId', projectId);
    formData.append('columns', columns);
    formData.append('description', 'Created via SQL Editor');

    const result = await createTableAction(formData);

    if (!result.success) {
        // Handle the specific error for duplicate table names gracefully.
        if (result.error?.includes('already exists')) {
             return { 
                rows: [{ success: false, message: `Skipped: ${result.error}` }],
                columns: ['success', 'message']
            };
        }
        throw new Error(result.error || 'Failed to create table via server action.');
    }

    return { 
        rows: [{ success: true, message: `Table '${tableName}' created successfully.`, tableId: result.tableId }],
        columns: ['success', 'message', 'tableId']
    };
};

const handleInsertQuery = async (ast: Insert, projectId: string) => {
    const tableName = ast.table?.[0].table;
    if (!tableName) throw new Error("INSERT statement must have a table name.");

    const allTables = await getTablesForProject(projectId);
    const table = allTables.find(t => t.table_name === tableName);
    if (!table) throw new Error(`Table '${tableName}' not found.`);

    const valuesNode = ast.values.find(v => v.type === 'value_list');
    if (!valuesNode) {
        throw new Error("Invalid INSERT format. VALUES clause is missing or invalid.");
    }

    let columnsToInsert: string[];
    if (ast.columns) {
        columnsToInsert = ast.columns;
    } else {
        const schemaColumns = await getColumnsForTable(projectId, table.table_id);
        columnsToInsert = schemaColumns.map(c => c.column_name);
    }
    
    const values = valuesNode.value.map((v: any) => v.value);

    if (columnsToInsert.length !== values.length) {
        throw new Error(`Number of columns (${columnsToInsert.length}) does not match number of values (${values.length}).`);
    }

    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('tableId', table.table_id);
    formData.append('tableName', tableName);

    columnsToInsert.forEach((col, index) => {
        formData.append(col, String(values[index]));
    });

    const result = await addRowAction(formData);

    if (!result.success) {
        throw new Error(result.error || 'Failed to insert row via server action.');
    }

    return { 
        rows: [{ success: true, message: `1 row inserted into '${tableName}' successfully.` }],
        columns: ['success', 'message']
    };
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
    
    // Sanitize query for types not understood by the parser
    const sanitizedQuery = query
        .replace(/\bUUID\b/gi, 'VARCHAR')
        .replace(/\bTEXT\b/gi, 'VARCHAR')
        .replace(/\bTIMESTAMPTZ\b/gi, 'TIMESTAMP');

    let astArray: AST[] | AST;
    try {
        // Remove comments before parsing
        const queryWithoutComments = sanitizedQuery.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        astArray = sqlParser.astify(queryWithoutComments);
    } catch (e: any) {
        // Provide the original parser error for better debugging
        return NextResponse.json({ error: `SQL Parse Error: ${e.message}` }, { status: 400 });
    }
    
    const ast = Array.isArray(astArray) ? astArray[0] : astArray;

    switch (ast.type?.toUpperCase()) {
        case 'SELECT':
            const selectResults = await handleSelectQuery(ast, projectId);
            return NextResponse.json(selectResults);
        
        case 'CREATE':
            const createResults = await handleCreateQuery(ast as Create, projectId);
            return NextResponse.json(createResults);

        case 'INSERT':
            const insertResults = await handleInsertQuery(ast as Insert, projectId);
            return NextResponse.json(insertResults);

        default:
            throw new Error(`Unsupported SQL command: ${ast.type}. Only SELECT, CREATE TABLE, and INSERT are currently supported.`);
    }

  } catch (error: any) {
    console.error('Failed to execute SQL:', error);
    return NextResponse.json({ error: `An unexpected error occurred: ${error.message}` }, { status: 500 });
  }
}
    

    
