
'use client';

import * as React from 'react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

interface DataTableProps {
    columns: GridColDef[];
    rows: any[];
}

export function DataTable({ columns, rows }: DataTableProps) {
  const paginationModel = { page: 0, pageSize: 10 };

  return (
    <Paper sx={{ 
        height: '100%', 
        width: '100%',
        '& .MuiDataGrid-root': {
            border: 'none',
            color: 'hsl(var(--foreground))',
            backgroundColor: 'hsl(var(--card))',
        },
        '& .MuiDataGrid-cell': {
            borderBottom: '1px solid hsl(var(--border))',
        },
         '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'hsl(var(--background))',
            borderBottom: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
        },
        '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
        },
        '& .MuiTablePagination-root': {
            color: 'hsl(var(--muted-foreground))',
        },
        '& .MuiCheckbox-root.Mui-checked': {
            color: 'hsl(var(--primary))',
        },
        '& .MuiDataGrid-iconButtonContainer > .MuiButtonBase-root': {
            color: 'hsl(var(--foreground))'
        }
    }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: paginationModel,
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Paper>
  );
}
