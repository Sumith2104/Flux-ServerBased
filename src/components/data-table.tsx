'use client';

import * as React from 'react';
import { DataGrid, type GridColDef, type GridRowSelectionModel } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

interface DataTableProps {
  columns: GridColDef[];
  rows: any[];
  onRowSelectionModelChange?: (selectionModel: GridRowSelectionModel) => void;
  selectionModel?: GridRowSelectionModel;
}

export function DataTable({ columns, rows, onRowSelectionModelChange, selectionModel }: DataTableProps) {
  const paginationModel = { page: 0, pageSize: 10 };

  return (
    <Paper
      sx={{
        height: '100%',
        width: '100%',
        '& .MuiDataGrid-root': {
          border: 'none',
          color: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: 'thin solid hsl(var(--border))',
        },
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: 'white', 
          borderBottom: '1px solid hsl(var(--border))',
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 'bold',
          color: 'black', 
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid hsl(var(--border))',
          color: 'hsl(var(--muted-foreground))',
        },
        '& .MuiTablePagination-root': {
          color: 'hsl(var(--muted-foreground))',
        },
        '& .MuiCheckbox-root': {
          color: 'hsl(var(--primary))',
        },
        '& .MuiCheckbox-root.Mui-checked': {
          color: 'hsl(var(--primary))',
        },
        '& .MuiDataGrid-iconButtonContainer > .MuiButtonBase-root': {
          color: 'hsl(var(--foreground))',
        },
        '& .MuiDataGrid-actionsCell .MuiIconButton-root': {
            color: 'hsl(var(--foreground))',
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.id} 
        initialState={{
          pagination: {
            paginationModel: paginationModel,
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        checkboxSelection
        disableRowSelectionOnClick
        onRowSelectionModelChange={onRowSelectionModelChange}
        rowSelectionModel={selectionModel}
      />
    </Paper>
  );
}
